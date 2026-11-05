import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { adminAuth, adminDb, adminStorage } from '../_lib/firebaseAdmin.js';
import { ghlConfigured, upsertContact, moveToStageNamed } from '../_lib/ghl.js';

const DEFAULT_LOSS_REASONS = ['Precio', 'No tiene documentos', 'Solo exploraba', 'No contesta', 'Se inscribió en otro lado', 'No calificó', 'Sin interés'];

const iso = (v: any) => (v?.toDate ? v.toDate().toISOString() : v || null);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const action = String(req.query.action || '');
  const db = adminDb();

  try {
    switch (action) {
      // ---- GET lista de alumnos ----
      case 'students': {
        const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
        const students = snap.docs.map((d) => {
          const u = d.data() as any;
          return {
            uid: d.id, name: u.name || '', email: u.email || '', phone: u.phone || '',
            city: u.city || '', licenciatura: u.licenciatura || '', currentStage: u.currentStage ?? 0,
            role: u.role || 'ALUMNO', totalAbonado: u.payment?.totalAbonado ?? 0,
            lead: u.lead || { status: 'active' }, preQual: u.preQual || null,
            attribution: u.attribution || null, purchaseReason: u.purchaseReason?.id || null,
            createdAt: iso(u.createdAt),
          };
        });
        return res.status(200).json({ students });
      }

      // ---- GET ficha de un alumno ----
      case 'student': {
        const uid = String(req.query.uid || '');
        if (!uid) return res.status(400).json({ error: 'Falta uid' });
        const [userSnap, docsSnap, examsSnap, enrollSnap, certSnap] = await Promise.all([
          db.doc(`users/${uid}`).get(),
          db.collection(`users/${uid}/documents`).get(),
          db.collection(`users/${uid}/exams`).get(),
          db.collection(`users/${uid}/enrollments`).get(),
          db.doc(`certifications/${uid}`).get(),
        ]);
        if (!userSnap.exists) return res.status(404).json({ error: 'Alumno no encontrado' });
        const u = userSnap.data() as any;
        const documents = await Promise.all(
          docsSnap.docs.map(async (d) => {
            const doc = d.data() as any;
            let url: string | null = null;
            if (doc.storagePath) {
              try {
                const [signed] = await adminStorage().bucket().file(doc.storagePath).getSignedUrl({ action: 'read', expires: Date.now() + 3600_000 });
                url = signed;
              } catch { /* noop */ }
            }
            return { id: d.id, type: doc.type, fileName: doc.fileName, status: doc.status, verification: doc.verification || null, url };
          }),
        );
        return res.status(200).json({
          student: {
            uid, name: u.name, email: u.email, curp: u.curp, phone: u.phone, city: u.city,
            licenciatura: u.licenciatura, currentStage: u.currentStage ?? 0,
            stageStatus: u.stageStatus || {}, professionalProfile: u.professionalProfile || null,
            preQual: u.preQual || null, attribution: u.attribution || null,
            payment: u.payment || { totalAbonado: 0 }, ghl: u.ghl || null,
          },
          documents,
          exams: examsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), scheduledAt: iso((d.data() as any).scheduledAt) })),
          enrollments: enrollSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), createdAt: iso((d.data() as any).createdAt) })),
          certification: certSnap.exists ? certSnap.data() : null,
        });
      }

      // ---- POST alta manual ----
      case 'create-student': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { name, email, licenciatura, phone, curp } = (req.body || {}) as any;
        if (!name || !email) return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
        const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
        const userRecord = await adminAuth().createUser({ email: String(email).trim(), password: tempPassword, displayName: name });
        await db.doc(`users/${userRecord.uid}`).set({
          uid: userRecord.uid, name, email: String(email).trim(), curp: curp || '', phone: phone || '',
          role: 'ALUMNO', licenciatura: licenciatura || '', currentStage: 0, stageStatus: { '0': 'IN_PROGRESS' },
          createdBy: admin.uid, createdAt: new Date(), updatedAt: new Date(),
        });
        const resetLink = await adminAuth().generatePasswordResetLink(String(email).trim());
        return res.status(200).json({ ok: true, uid: userRecord.uid, resetLink });
      }

      // ---- POST actualizar alumno (etapa / abono / certificación) ----
      case 'update-student': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { uid, currentStage, totalAbonado, certification } = (req.body || {}) as any;
        if (!uid) return res.status(400).json({ error: 'Falta uid' });
        const userUpdates: Record<string, unknown> = { updatedAt: new Date() };
        if (typeof currentStage === 'number') {
          userUpdates.currentStage = currentStage;
          userUpdates[`stageStatus.${currentStage}`] = 'IN_PROGRESS';
        }
        if (typeof totalAbonado === 'number') {
          userUpdates['payment.totalAbonado'] = totalAbonado;
          userUpdates['payment.updatedAt'] = new Date();
        }
        await db.doc(`users/${uid}`).set(userUpdates, { merge: true });
        if (certification) {
          await db.doc(`certifications/${uid}`).set({ ...certification, updatedAt: new Date(), updatedBy: admin.uid }, { merge: true });
        }
        return res.status(200).json({ ok: true });
      }

      // ---- GET calendario de exámenes con roster ----
      case 'exam-roster': {
        const [slotsSnap, examsSnap] = await Promise.all([
          db.collection('examSlots').orderBy('dateTime').get(),
          db.collectionGroup('exams').get(),
        ]);
        const bySlot: Record<string, { uid: string; name: string; status: string }[]> = {};
        const uidSet = new Set<string>();
        examsSnap.docs.forEach((d) => {
          const e = d.data() as any;
          const uid = d.ref.parent.parent?.id || '';
          uidSet.add(uid);
          (bySlot[e.slotId] ||= []).push({ uid, name: '', status: e.status });
        });
        const names: Record<string, string> = {};
        await Promise.all([...uidSet].map(async (uid) => {
          const u = await db.doc(`users/${uid}`).get();
          names[uid] = (u.data() as any)?.name || (u.data() as any)?.email || uid;
        }));
        const slots = slotsSnap.docs.map((d) => {
          const s = d.data() as any;
          const roster = (bySlot[d.id] || []).map((r) => ({ ...r, name: names[r.uid] || r.uid }));
          return { id: d.id, examType: s.examType, dateTime: iso(s.dateTime), capacity: s.capacity, booked: s.booked ?? 0, modality: s.modality || '', roster };
        });
        return res.status(200).json({ slots });
      }

      // ---- POST/DELETE fechas de examen ----
      case 'slots': {
        if (req.method === 'POST') {
          const { examType, dateTime, capacity, modality } = (req.body || {}) as any;
          if (!examType || !dateTime) return res.status(400).json({ error: 'Faltan datos de la fecha' });
          const ref = await db.collection('examSlots').add({ examType, dateTime: new Date(dateTime), capacity: capacity || 10, booked: 0, modality: modality || '' });
          return res.status(200).json({ ok: true, id: ref.id });
        }
        if (req.method === 'DELETE') {
          const { id } = (req.body || {}) as any;
          if (!id) return res.status(400).json({ error: 'Falta id' });
          await db.collection('examSlots').doc(id).delete();
          return res.status(200).json({ ok: true });
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // ---- GET/POST motivos de pérdida (lista gestionable) ----
      case 'loss-reasons': {
        if (req.method === 'POST') {
          const { reasons } = (req.body || {}) as { reasons?: string[] };
          if (!Array.isArray(reasons)) return res.status(400).json({ error: 'reasons inválido' });
          await db.doc('config/lossReasons').set({ reasons, updatedAt: new Date(), updatedBy: admin.uid });
          return res.status(200).json({ ok: true, reasons });
        }
        const snap = await db.doc('config/lossReasons').get();
        const reasons = snap.exists ? (snap.data() as any).reasons : DEFAULT_LOSS_REASONS;
        return res.status(200).json({ reasons });
      }

      // ---- POST estado del lead (perdido / reactivar) ----
      case 'set-lead': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { uid, status, lostReasons, note } = (req.body || {}) as { uid?: string; status?: string; lostReasons?: string[]; note?: string };
        if (!uid || !status) return res.status(400).json({ error: 'Faltan datos' });
        const lead: Record<string, unknown> = { status };
        if (status === 'lost') {
          lead.lostReasons = lostReasons || [];
          lead.lostAt = new Date();
          lead.lostBy = admin.uid;
          if (note) lead.note = note;
        }
        await db.doc(`users/${uid}`).set({ lead, updatedAt: new Date() }, { merge: true });

        // Best-effort GHL: mover a "Descartado" al perder
        if (status === 'lost' && ghlConfigured()) {
          try {
            const u = (await db.doc(`users/${uid}`).get()).data() as any;
            const contactId = u.ghl?.contactId || (await upsertContact({ email: u.email, name: u.name, phone: u.phone, licenciatura: u.licenciatura }));
            if (contactId) {
              const oppId = await moveToStageNamed({ contactId, stageName: 'Descartado', opportunityId: u.ghl?.opportunityId, name: u.name || u.email || 'Prospecto', status: 'lost' });
              const ghlData: Record<string, string> = { contactId };
              const opp = oppId || u.ghl?.opportunityId;
              if (opp) ghlData.opportunityId = opp;
              await db.doc(`users/${uid}`).set({ ghl: ghlData }, { merge: true });
            }
          } catch (e) { console.error('GHL descartar (no bloqueante)', e); }
        }
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(404).json({ error: 'Acción no encontrada' });
    }
  } catch (error: any) {
    console.error(`admin/${action} error`, error);
    const msg = error?.code === 'auth/email-already-exists' ? 'Ya existe un alumno con ese correo.' : 'Error en la operación de administración.';
    return res.status(400).json({ error: msg });
  }
}
