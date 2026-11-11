import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth.js';
import { requireStaff, requireAdmin } from '../_lib/requireAdmin.js';
import { adminAuth, adminDb } from '../_lib/firebaseAdmin.js';
import { logActivity, assignRoundRobin } from '../_lib/crm.js';
import { ghlConfigured, upsertContact, moveToStage, moveToStageNamed } from '../_lib/ghl.js';

const iso = (v: any) => (v?.toDate ? v.toDate().toISOString() : v || null);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action || '');
  const db = adminDb();

  try {
    // ====== Acción del propio alumno al registrarse: asignación + GHL + historial ======
    if (action === 'onboard') {
      const user = await verifyAuth(req);
      if (!user) return res.status(401).json({ error: 'No autorizado' });
      const ref = db.doc(`users/${user.uid}`);
      const data = (await ref.get()).data() as any || {};
      await logActivity(user.uid, 'registered', 'Se registró en el sistema');

      // Asignación round-robin (si no tiene)
      if (!data.assignedTo) {
        const rep = await assignRoundRobin();
        if (rep) {
          await ref.set({ assignedTo: rep.uid, assignedToName: rep.name, assignedAt: new Date() }, { merge: true });
          await logActivity(user.uid, 'assigned', `Asignado a ${rep.name}`);
        }
      }
      // GHL best-effort
      if (ghlConfigured()) {
        try {
          const contactId = data.ghl?.contactId || (await upsertContact({ email: data.email || user.email || '', name: data.name, phone: data.phone, licenciatura: data.licenciatura }));
          if (contactId) {
            const oppId = await moveToStage({ contactId, stageIndex: data.currentStage ?? 0, opportunityId: data.ghl?.opportunityId, name: data.name || data.email || 'Prospecto INEVAP' });
            const g: Record<string, string> = { contactId };
            if (oppId || data.ghl?.opportunityId) g.opportunityId = oppId || data.ghl.opportunityId;
            await ref.set({ ghl: g }, { merge: true });
          }
        } catch (e) { console.error('GHL onboard', e); }
      }
      return res.status(200).json({ ok: true });
    }

    // ====== Lista de prospectos (staff) ======
    if (action === 'prospects') {
      const staff = await requireStaff(req, res); if (!staff) return;
      let docs;
      if (staff.admin) {
        docs = (await db.collection('users').where('role', '==', 'ALUMNO').get()).docs;
      } else {
        docs = (await db.collection('users').where('assignedTo', '==', staff.uid).get()).docs;
      }
      const prospects = docs.map((d) => {
        const u = d.data() as any;
        return {
          uid: d.id, name: u.name || '', email: u.email || '', phone: u.phone || '', city: u.city || '',
          licenciatura: u.licenciatura || '', currentStage: u.currentStage ?? 0,
          lead: u.lead || { status: 'active' }, assignedTo: u.assignedTo || null, assignedToName: u.assignedToName || null,
          attribution: u.attribution || null,
        };
      });
      return res.status(200).json({ prospects });
    }

    // ====== Detalle de oportunidad (staff) ======
    if (action === 'opportunity') {
      const staff = await requireStaff(req, res); if (!staff) return;
      const uid = String(req.query.uid || '');
      if (!uid) return res.status(400).json({ error: 'Falta uid' });
      const [uSnap, cSnap, aSnap] = await Promise.all([
        db.doc(`users/${uid}`).get(),
        db.collection(`users/${uid}/comments`).orderBy('at', 'asc').get(),
        db.collection(`users/${uid}/activity`).orderBy('at', 'desc').limit(100).get(),
      ]);
      if (!uSnap.exists) return res.status(404).json({ error: 'No encontrado' });
      const u = uSnap.data() as any;
      return res.status(200).json({
        prospect: {
          uid, name: u.name, email: u.email, phone: u.phone, city: u.city, curp: u.curp,
          licenciatura: u.licenciatura, currentStage: u.currentStage ?? 0,
          lead: u.lead || { status: 'active' }, assignedTo: u.assignedTo || null, assignedToName: u.assignedToName || null,
          preQual: u.preQual || null, attribution: u.attribution || null, professionalProfile: u.professionalProfile || null,
          payment: u.payment || { totalAbonado: 0 },
        },
        comments: cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), at: iso((d.data() as any).at) })),
        activity: aSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), at: iso((d.data() as any).at) })),
      });
    }

    // ====== Comentario (staff) ======
    if (action === 'comment') {
      const staff = await requireStaff(req, res); if (!staff) return;
      const { uid, text } = (req.body || {}) as { uid?: string; text?: string };
      if (!uid || !text?.trim()) return res.status(400).json({ error: 'Faltan datos' });
      const byName = (await db.doc(`users/${staff.uid}`).get()).data()?.name || staff.email || 'Staff';
      await db.collection(`users/${uid}/comments`).add({ text: text.trim(), by: staff.uid, byName, at: new Date() });
      await logActivity(uid, 'comment', `Comentario de ${byName}`, staff.uid);
      return res.status(200).json({ ok: true });
    }

    // ====== Cambiar etapa (staff) ======
    if (action === 'set-stage') {
      const staff = await requireStaff(req, res); if (!staff) return;
      const { uid, currentStage } = (req.body || {}) as { uid?: string; currentStage?: number };
      if (!uid || typeof currentStage !== 'number') return res.status(400).json({ error: 'Faltan datos' });
      await db.doc(`users/${uid}`).set({ currentStage, [`stageStatus.${currentStage}`]: 'IN_PROGRESS', updatedAt: new Date() }, { merge: true });
      await logActivity(uid, 'stage_changed', `Etapa cambiada a ${currentStage} (por staff)`, staff.uid);
      return res.status(200).json({ ok: true });
    }

    // ====== Ganado / Perdido / Reactivar (staff) ======
    if (action === 'set-lead') {
      const staff = await requireStaff(req, res); if (!staff) return;
      const { uid, status, lostReasons, wonReasons, note } = (req.body || {}) as { uid?: string; status?: string; lostReasons?: string[]; wonReasons?: string[]; note?: string };
      if (!uid || !status) return res.status(400).json({ error: 'Faltan datos' });
      const lead: Record<string, unknown> = { status };
      if (status === 'lost') { lead.lostReasons = lostReasons || []; lead.lostAt = new Date(); lead.lostBy = staff.uid; if (note) lead.note = note; }
      if (status === 'won') { lead.wonReasons = wonReasons || []; lead.wonAt = new Date(); lead.wonBy = staff.uid; }
      await db.doc(`users/${uid}`).set({ lead, updatedAt: new Date() }, { merge: true });
      await logActivity(uid, `lead_${status}`, status === 'lost' ? `Marcado perdido: ${(lostReasons || []).join(', ')}` : status === 'won' ? 'Marcado como ganado' : 'Reactivado', staff.uid);

      if (ghlConfigured() && (status === 'lost' || status === 'won')) {
        try {
          const u = (await db.doc(`users/${uid}`).get()).data() as any;
          const contactId = u.ghl?.contactId || (await upsertContact({ email: u.email, name: u.name, phone: u.phone, licenciatura: u.licenciatura }));
          if (contactId) {
            const oppId = await moveToStageNamed({ contactId, stageName: status === 'lost' ? 'Descartado' : 'Inscritos', opportunityId: u.ghl?.opportunityId, name: u.name || u.email || 'Prospecto', status });
            const g: Record<string, string> = { contactId };
            if (oppId || u.ghl?.opportunityId) g.opportunityId = oppId || u.ghl.opportunityId;
            await db.doc(`users/${uid}`).set({ ghl: g }, { merge: true });
          }
        } catch (e) { console.error('GHL set-lead', e); }
      }
      return res.status(200).json({ ok: true });
    }

    // ====== Reasignar (staff) ======
    if (action === 'reassign') {
      const staff = await requireStaff(req, res); if (!staff) return;
      const { uid, assignTo, assignToName } = (req.body || {}) as { uid?: string; assignTo?: string; assignToName?: string };
      if (!uid || !assignTo) return res.status(400).json({ error: 'Faltan datos' });
      await db.doc(`users/${uid}`).set({ assignedTo: assignTo, assignedToName: assignToName || '', assignedAt: new Date() }, { merge: true });
      await logActivity(uid, 'assigned', `Reasignado a ${assignToName || assignTo}`, staff.uid);
      return res.status(200).json({ ok: true });
    }

    // ====== Lista de staff / vendedores ======
    if (action === 'staff') {
      const staff = await requireStaff(req, res); if (!staff) return;
      const docs = (await db.collection('users').where('staff', '==', true).get()).docs;
      return res.status(200).json({ staff: docs.map((d) => { const u = d.data() as any; return { uid: d.id, name: u.name || '', email: u.email || '' }; }) });
    }

    // ====== Crear vendedor (admin) ======
    if (action === 'create-staff') {
      const admin = await requireAdmin(req, res); if (!admin) return;
      const { name, email } = (req.body || {}) as { name?: string; email?: string };
      if (!name || !email) return res.status(400).json({ error: 'Nombre y correo obligatorios' });
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const rec = await adminAuth().createUser({ email: email.trim(), password: tempPassword, displayName: name });
      await adminAuth().setCustomUserClaims(rec.uid, { sales: true });
      await db.doc(`users/${rec.uid}`).set({ uid: rec.uid, name, email: email.trim(), role: 'VENTAS', staff: true, createdAt: new Date() });
      const resetLink = await adminAuth().generatePasswordResetLink(email.trim());
      return res.status(200).json({ ok: true, resetLink });
    }

    // ====== Reglas de asignación (admin) ======
    if (action === 'assignment-rules') {
      if (req.method === 'POST') {
        const admin = await requireAdmin(req, res); if (!admin) return;
        const { rules } = (req.body || {}) as { rules?: any[] };
        await db.doc('config/assignmentRules').set({ rules: rules || [] }, { merge: true });
        return res.status(200).json({ ok: true });
      }
      const staff = await requireStaff(req, res); if (!staff) return;
      const snap = await db.doc('config/assignmentRules').get();
      return res.status(200).json({ rules: snap.exists ? (snap.data() as any).rules || [] : [] });
    }

    // ====== Motivos de pérdida / ganado (lectura staff) ======
    if (action === 'loss-reasons' || action === 'won-reasons') {
      const staff = await requireStaff(req, res); if (!staff) return;
      const docId = action === 'won-reasons' ? 'config/wonReasons' : 'config/lossReasons';
      const fallback = action === 'won-reasons'
        ? ['Buen precio / promoción', 'Urgencia por titularse', 'Confianza en el proceso', 'Referido', 'Atención del asesor', 'Facilidad y rapidez']
        : ['Precio', 'No tiene documentos', 'Solo exploraba', 'No contesta', 'Se inscribió en otro lado', 'No calificó', 'Sin interés'];
      const snap = await db.doc(docId).get();
      const reasons = snap.exists ? (snap.data() as any).reasons : fallback;
      return res.status(200).json({ reasons });
    }

    // ====== Dashboard del embudo (admin) ======
    if (action === 'dashboard') {
      const admin = await requireAdmin(req, res); if (!admin) return;
      const docs = (await db.collection('users').where('role', '==', 'ALUMNO').get()).docs;

      const STAGES = ['Bienvenida', 'Admisión', 'Inscripción', 'Estudio', 'Prep. Oral', 'Agendado', 'Certificación'];
      const stageCounts = new Array(7).fill(0);
      let registros = 0, inscritos = 0, perdidos = 0, activos = 0;
      let abonadoTotal = 0, esperadoTotal = 0, conPlan = 0;
      const lostReasons: Record<string, number> = {};
      const wonReasons: Record<string, number> = {};
      const byCampaign: Record<string, { registros: number; inscritos: number; abonado: number }> = {};
      const byRep: Record<string, { name: string; asignados: number; inscritos: number }> = {};

      for (const d of docs) {
        const u = d.data() as any;
        registros++;
        const stage = Math.max(0, Math.min(6, Number(u.currentStage ?? 0)));
        stageCounts[stage]++;
        const status = u.lead?.status;
        const isInscrito = status === 'won' || stage >= 3;
        if (status === 'lost') perdidos++;
        else if (isInscrito) inscritos++;
        else activos++;

        const abon = Number(u.payment?.totalAbonado || 0);
        const esp = Number(u.payment?.expectedTotal || 0);
        abonadoTotal += abon; esperadoTotal += esp;
        if (abon > 0 || esp > 0) conPlan++;

        (u.lead?.lostReasons || []).forEach((r: string) => { lostReasons[r] = (lostReasons[r] || 0) + 1; });
        (u.lead?.wonReasons || []).forEach((r: string) => { wonReasons[r] = (wonReasons[r] || 0) + 1; });

        const camp = String(u.attribution?.utm_campaign || u.attribution?.utm_source || 'Directo / orgánico');
        const c = byCampaign[camp] || (byCampaign[camp] = { registros: 0, inscritos: 0, abonado: 0 });
        c.registros++; if (isInscrito) c.inscritos++; c.abonado += abon;

        if (u.assignedTo) {
          const r = byRep[u.assignedTo] || (byRep[u.assignedTo] = { name: u.assignedToName || 'Vendedor', asignados: 0, inscritos: 0 });
          r.asignados++; if (isInscrito) r.inscritos++;
        }
      }

      const tally = (o: Record<string, number>) => Object.entries(o).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
      const campaigns = Object.entries(byCampaign)
        .map(([campaign, v]) => ({ campaign, ...v, conversion: v.registros ? v.inscritos / v.registros : 0 }))
        .sort((a, b) => b.registros - a.registros);
      const reps = Object.values(byRep).sort((a, b) => b.inscritos - a.inscritos);

      return res.status(200).json({
        registros, inscritos, perdidos, activos,
        conversion: registros ? inscritos / registros : 0,
        abonadoTotal, esperadoTotal, porCobrar: Math.max(0, esperadoTotal - abonadoTotal), conPlan,
        stages: STAGES.map((label, i) => ({ label, count: stageCounts[i] })),
        lostReasons: tally(lostReasons), wonReasons: tally(wonReasons),
        campaigns, reps,
      });
    }

    return res.status(404).json({ error: 'Acción no encontrada' });
  } catch (error: any) {
    console.error(`crm/${action} error`, error);
    const msg = error?.code === 'auth/email-already-exists' ? 'Ya existe una cuenta con ese correo.' : 'Error en la operación.';
    return res.status(400).json({ error: msg });
  }
}
