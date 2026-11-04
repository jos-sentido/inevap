import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle, X, Settings2, Plus, Trash2, UserX, RotateCcw, MapPin } from 'lucide-react';
import { authedGetJSON, authedPostJSON } from '../../lib/api';

interface Lead { status: string; lostReasons?: string[] }
interface Row {
  uid: string; name: string; email: string; phone: string; city: string;
  licenciatura: string; currentStage: number; lead: Lead; preQual: any;
}

const wa = (phone: string) => `https://wa.me/52${(phone || '').replace(/\D/g, '')}`;

const COLUMNS: { key: string; label: string; match: (r: Row) => boolean; color: string }[] = [
  { key: 'bienvenida', label: 'Bienvenida', color: 'bg-slate-400', match: (r) => r.lead?.status !== 'lost' && r.currentStage === 0 },
  { key: 'admision', label: 'Admisión', color: 'bg-blue-400', match: (r) => r.lead?.status !== 'lost' && r.currentStage === 1 },
  { key: 'inscripcion', label: 'Inscripción', color: 'bg-indigo-400', match: (r) => r.lead?.status !== 'lost' && r.currentStage === 2 },
  { key: 'inscritos', label: 'Inscritos', color: 'bg-emerald-500', match: (r) => r.lead?.status !== 'lost' && r.currentStage >= 3 },
  { key: 'perdidos', label: 'Perdidos', color: 'bg-red-400', match: (r) => r.lead?.status === 'lost' },
];

const ProspectsPanel: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState<string[]>([]);
  const [lossFor, setLossFor] = useState<Row | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        authedGetJSON<{ students: Row[] }>('/api/admin/students'),
        authedGetJSON<{ reasons: string[] }>('/api/admin/loss-reasons'),
      ]);
      setRows(s.students);
      setReasons(r.reasons || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const reactivate = async (uid: string) => {
    await authedPostJSON('/api/admin/set-lead', { uid, status: 'active' });
    load();
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pipeline de prospectos</h2>
          <p className="text-sm text-slate-500">{rows.length} contactos</p>
        </div>
        <button onClick={() => setManageOpen(true)} className="bg-slate-100 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-200 flex items-center gap-2">
          <Settings2 size={16} /> Motivos de pérdida
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = rows.filter(col.match);
          return (
            <div key={col.key} className="w-72 shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-black text-slate-700">{col.label}</h3>
                <span className="text-xs font-bold text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((r) => (
                  <div key={r.uid} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <p className="font-bold text-slate-800 text-sm">{r.name || r.email}</p>
                    <p className="text-xs text-slate-500">{r.licenciatura}</p>
                    {r.city && <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1"><MapPin size={11} /> {r.city}</p>}
                    {r.lead?.status === 'lost' && r.lead.lostReasons?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.lead.lostReasons.map((lr) => <span key={lr} className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{lr}</span>)}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 mt-3">
                      {r.phone && <a href={wa(r.phone)} target="_blank" rel="noreferrer" title="WhatsApp" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><MessageCircle size={15} /></a>}
                      {r.lead?.status === 'lost'
                        ? <button onClick={() => reactivate(r.uid)} className="flex-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg py-2 hover:bg-slate-200 flex items-center justify-center gap-1"><RotateCcw size={13} /> Reactivar</button>
                        : <button onClick={() => setLossFor(r)} className="flex-1 text-xs font-bold text-red-600 bg-red-50 rounded-lg py-2 hover:bg-red-100 flex items-center justify-center gap-1"><UserX size={13} /> Marcar perdido</button>}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-slate-300 text-center py-6">Vacío</p>}
              </div>
            </div>
          );
        })}
      </div>

      {lossFor && <LossModal row={lossFor} reasons={reasons} onClose={() => setLossFor(null)} onDone={() => { setLossFor(null); load(); }} />}
      {manageOpen && <ManageReasonsModal reasons={reasons} onClose={() => setManageOpen(false)} onSaved={(r) => { setReasons(r); setManageOpen(false); }} />}
    </div>
  );
};

const LossModal: React.FC<{ row: Row; reasons: string[]; onClose: () => void; onDone: () => void }> = ({ row, reasons, onClose, onDone }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const toggle = (r: string) => setSelected((s) => s.includes(r) ? s.filter((x) => x !== r) : [...s, r]);
  const save = async () => {
    setSaving(true);
    try { await authedPostJSON('/api/admin/set-lead', { uid: row.uid, status: 'lost', lostReasons: selected, note }); onDone(); }
    catch { alert('No se pudo guardar.'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-800">Marcar como perdido</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{row.name} · Selecciona uno o más motivos:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {reasons.map((r) => (
            <button key={r} onClick={() => toggle(r)} className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${selected.includes(r) ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'}`}>{r}</button>
          ))}
          {reasons.length === 0 && <p className="text-xs text-slate-400">No hay motivos configurados aún.</p>}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none mb-4 resize-none" rows={2} />
        <button onClick={save} disabled={saving || selected.length === 0} className="w-full bg-red-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />} Confirmar pérdida
        </button>
      </div>
    </div>
  );
};

const ManageReasonsModal: React.FC<{ reasons: string[]; onClose: () => void; onSaved: (r: string[]) => void }> = ({ reasons, onClose, onSaved }) => {
  const [list, setList] = useState<string[]>(reasons);
  const [nuevo, setNuevo] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { const r = await authedPostJSON<{ reasons: string[] }>('/api/admin/loss-reasons', { reasons: list }); onSaved(r.reasons); }
    catch { alert('No se pudo guardar.'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-800">Motivos de pérdida</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {list.map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-slate-700">{r}</span>
              <button onClick={() => setList(list.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-5">
          <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nuevo.trim()) { setList([...list, nuevo.trim()]); setNuevo(''); } }} placeholder="Nuevo motivo..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
          <button onClick={() => { if (nuevo.trim()) { setList([...list, nuevo.trim()]); setNuevo(''); } }} className="bg-slate-100 text-slate-700 px-4 rounded-xl hover:bg-slate-200"><Plus size={18} /></button>
        </div>
        <button onClick={save} disabled={saving} className="w-full bg-[#2B5299] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={18} className="animate-spin" /> : null} Guardar motivos
        </button>
      </div>
    </div>
  );
};

export default ProspectsPanel;
