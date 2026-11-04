import React, { useEffect, useState } from 'react';
import { X, Loader2, MessageCircle, Phone, Mail, Send, UserX, Trophy, MapPin, Clock, RotateCcw } from 'lucide-react';
import { authedGetJSON, authedPostJSON } from '../../lib/api';
import { STAGES_CONFIG } from '../../constants';

interface Staff { uid: string; name: string }
interface Detail {
  prospect: any;
  comments: { id: string; text: string; byName: string; at: string }[];
  activity: { id: string; type: string; label: string; at: string }[];
}

const waLink = (p: string) => `https://wa.me/52${(p || '').replace(/\D/g, '')}`;
const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const OpportunityDrawer: React.FC<{ uid: string; staff: Staff[]; reasons: string[]; onClose: () => void; onChanged: () => void }> = ({ uid, staff, reasons, onClose, onChanged }) => {
  const [d, setD] = useState<Detail | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [showLost, setShowLost] = useState(false);
  const [lostReasons, setLostReasons] = useState<string[]>([]);

  const load = async () => setD(await authedGetJSON<Detail>(`/api/crm/opportunity?uid=${uid}`));
  useEffect(() => { load(); }, [uid]);

  const act = async (path: string, body: any) => {
    setBusy(true);
    try { await authedPostJSON(path, body); await load(); onChanged(); }
    catch { alert('No se pudo completar la acción.'); } finally { setBusy(false); }
  };

  if (!d) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>
    </div>
  );

  const p = d.prospect;
  const status = p.lead?.status || 'active';
  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl p-7 custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800">{p.name || p.email}</h3>
              {status === 'won' && <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ganado</span>}
              {status === 'lost' && <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Perdido</span>}
            </div>
            <p className="text-xs text-slate-400">{p.email}</p>
            <p className="text-xs text-slate-500 mt-0.5">{p.licenciatura} · Etapa {p.currentStage + 1}: {STAGES_CONFIG[p.currentStage]?.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={22} /></button>
        </div>

        {/* Contacto rápido */}
        <div className="flex gap-2 mb-5">
          {p.phone && <a href={waLink(p.phone)} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-emerald-100"><MessageCircle size={15} /> WhatsApp</a>}
          {p.phone && <a href={`tel:${p.phone}`} className="flex-1 bg-blue-50 text-[#2B5299] font-bold text-xs rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-blue-100"><Phone size={15} /> Llamar</a>}
          {p.email && <a href={`mailto:${p.email}`} className="flex-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl py-2.5 flex items-center justify-center gap-1.5 hover:bg-slate-200"><Mail size={15} /> Email</a>}
        </div>

        {/* Asignación + Etapa */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Asignado a</label>
            <select value={p.assignedTo || ''} onChange={(e) => { const s = staff.find((x) => x.uid === e.target.value); act('/api/crm/reassign', { uid, assignTo: e.target.value, assignToName: s?.name }); }} className={input}>
              <option value="">Sin asignar</option>
              {staff.map((s) => <option key={s.uid} value={s.uid}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Etapa</label>
            <select value={p.currentStage} onChange={(e) => act('/api/crm/set-stage', { uid, currentStage: Number(e.target.value) })} className={input}>
              {STAGES_CONFIG.map((s, i) => <option key={i} value={i}>{i + 1}. {s.title}</option>)}
            </select>
          </div>
        </div>

        {/* Ganado / Perdido */}
        {status !== 'won' && status !== 'lost' && (
          <div className="flex gap-2 mb-5">
            <button onClick={() => act('/api/crm/set-lead', { uid, status: 'won' })} disabled={busy} className="flex-1 bg-emerald-600 text-white font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"><Trophy size={16} /> Ganado</button>
            <button onClick={() => setShowLost(!showLost)} className="flex-1 bg-red-50 text-red-600 font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-red-100"><UserX size={16} /> Perdido</button>
          </div>
        )}
        {(status === 'won' || status === 'lost') && (
          <button onClick={() => act('/api/crm/set-lead', { uid, status: 'active' })} disabled={busy} className="w-full bg-slate-100 text-slate-600 font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-slate-200 mb-5"><RotateCcw size={15} /> Reactivar oportunidad</button>
        )}
        {showLost && status !== 'lost' && (
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 mb-5">
            <p className="text-xs font-bold text-slate-600 mb-2">Motivos de pérdida:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {reasons.map((r) => <button key={r} onClick={() => setLostReasons((s) => s.includes(r) ? s.filter((x) => x !== r) : [...s, r])} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${lostReasons.includes(r) ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200'}`}>{r}</button>)}
            </div>
            <button onClick={() => { act('/api/crm/set-lead', { uid, status: 'lost', lostReasons }); setShowLost(false); }} disabled={lostReasons.length === 0} className="w-full bg-red-600 text-white font-bold text-sm rounded-xl py-2.5 disabled:opacity-40">Confirmar pérdida</button>
          </div>
        )}

        {/* Datos del prospecto */}
        <Section title="Datos">
          {p.phone && <Row label="Teléfono" value={p.phone} />}
          {p.city && <Row label="Ciudad" value={p.city} icon={<MapPin size={12} />} />}
          {p.preQual && Object.entries(p.preQual).filter(([, v]) => v).map(([k, v]) => <Row key={k} label={k} value={String(v)} />)}
          {p.attribution && <Row label="Campaña" value={`${p.attribution.utmSource || ''} ${p.attribution.utmCampaign || ''} ${p.attribution.utmContent ? '· ' + p.attribution.utmContent : ''}`} />}
        </Section>

        {/* Comentarios */}
        <Section title="Comentarios">
          <div className="space-y-2 mb-3">
            {d.comments.length === 0 && <p className="text-xs text-slate-400">Sin comentarios.</p>}
            {d.comments.map((c) => (
              <div key={c.id} className="bg-slate-50 rounded-xl px-4 py-2.5">
                <p className="text-sm text-slate-700">{c.text}</p>
                <p className="text-[10px] text-slate-400 mt-1">{c.byName} · {fmtDate(c.at)}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) { act('/api/crm/comment', { uid, text: comment }); setComment(''); } }} placeholder="Escribe un comentario..." className={input} />
            <button onClick={() => { if (comment.trim()) { act('/api/crm/comment', { uid, text: comment }); setComment(''); } }} className="bg-[#2B5299] text-white w-11 rounded-xl flex items-center justify-center shrink-0"><Send size={16} /></button>
          </div>
        </Section>

        {/* Historial */}
        <Section title="Historial de actividad">
          <div className="space-y-2">
            {d.activity.length === 0 && <p className="text-xs text-slate-400">Sin actividad.</p>}
            {d.activity.map((a) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <Clock size={14} className="text-slate-300 mt-0.5 shrink-0" />
                <div className="flex-1"><p className="text-slate-700">{a.label}</p><p className="text-[10px] text-slate-400">{fmtDate(a.at)}</p></div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6"><h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</h4>{children}</div>
);
const Row: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
    <span className="text-slate-400 capitalize flex items-center gap-1">{icon}{label}</span>
    <span className="font-medium text-slate-700 text-right">{value}</span>
  </div>
);

export default OpportunityDrawer;
