import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle, X, Settings2, Plus, Trash2, UserCircle2, MapPin } from 'lucide-react';
import { authedGetJSON, authedPostJSON } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import OpportunityDrawer from './OpportunityDrawer';

interface Lead { status: string }
interface Row {
  uid: string; name: string; email: string; phone: string; city: string;
  licenciatura: string; currentStage: number; lead: Lead; assignedTo: string | null; assignedToName: string | null;
}

const wa = (phone: string) => `https://wa.me/52${(phone || '').replace(/\D/g, '')}`;
const active = (r: Row) => r.lead?.status !== 'lost' && r.lead?.status !== 'won';

const COLUMNS: { key: string; label: string; match: (r: Row) => boolean; color: string }[] = [
  { key: 'bienvenida', label: 'Bienvenida', color: 'bg-slate-400', match: (r) => active(r) && r.currentStage === 0 },
  { key: 'admision', label: 'Admisión', color: 'bg-blue-400', match: (r) => active(r) && r.currentStage === 1 },
  { key: 'inscripcion', label: 'Inscripción', color: 'bg-indigo-400', match: (r) => active(r) && r.currentStage === 2 },
  { key: 'ganados', label: 'Ganados / Inscritos', color: 'bg-emerald-500', match: (r) => r.lead?.status === 'won' || (active(r) && r.currentStage >= 3) },
  { key: 'perdidos', label: 'Perdidos', color: 'bg-red-400', match: (r) => r.lead?.status === 'lost' },
];

const ProspectsPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [staff, setStaff] = useState<{ uid: string; name: string }[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [wonReasons, setWonReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [manage, setManage] = useState<'loss' | 'won' | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, r, w] = await Promise.all([
        authedGetJSON<{ prospects: Row[] }>('/api/crm/prospects'),
        authedGetJSON<{ staff: { uid: string; name: string }[] }>('/api/crm/staff'),
        authedGetJSON<{ reasons: string[] }>('/api/crm/loss-reasons'),
        authedGetJSON<{ reasons: string[] }>('/api/crm/won-reasons'),
      ]);
      setRows(p.prospects); setStaff(s.staff); setReasons(r.reasons || []); setWonReasons(w.reasons || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pipeline de prospectos</h2>
          <p className="text-sm text-slate-500">{rows.length} oportunidades</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setManage('won')} className="bg-emerald-50 text-emerald-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-100 flex items-center gap-2">
              <Settings2 size={16} /> Motivos de ganado
            </button>
            <button onClick={() => setManage('loss')} className="bg-red-50 text-red-600 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-100 flex items-center gap-2">
              <Settings2 size={16} /> Motivos de pérdida
            </button>
          </div>
        )}
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
                  <button key={r.uid} onClick={() => setOpenUid(r.uid)} className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-[#2B5299] hover:shadow-md transition-all">
                    <p className="font-bold text-slate-800 text-sm">{r.name || r.email}</p>
                    <p className="text-xs text-slate-500">{r.licenciatura}</p>
                    {r.city && <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1"><MapPin size={11} /> {r.city}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <UserCircle2 size={13} /> {r.assignedToName || 'Sin asignar'}
                      </span>
                      {r.phone && <a href={wa(r.phone)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><MessageCircle size={14} /></a>}
                    </div>
                  </button>
                ))}
                {items.length === 0 && <p className="text-xs text-slate-300 text-center py-6">Vacío</p>}
              </div>
            </div>
          );
        })}
      </div>

      {openUid && <OpportunityDrawer uid={openUid} staff={staff} reasons={reasons} wonReasons={wonReasons} onClose={() => setOpenUid(null)} onChanged={load} />}
      {manage && (
        <ManageReasonsModal
          title={manage === 'won' ? 'Motivos de ganado' : 'Motivos de pérdida'}
          endpoint={manage === 'won' ? '/api/admin/won-reasons' : '/api/admin/loss-reasons'}
          reasons={manage === 'won' ? wonReasons : reasons}
          onClose={() => setManage(null)}
          onSaved={(r) => { manage === 'won' ? setWonReasons(r) : setReasons(r); setManage(null); }}
        />
      )}
    </div>
  );
};

const ManageReasonsModal: React.FC<{ title: string; endpoint: string; reasons: string[]; onClose: () => void; onSaved: (r: string[]) => void }> = ({ title, endpoint, reasons, onClose, onSaved }) => {
  const [list, setList] = useState<string[]>(reasons);
  const [nuevo, setNuevo] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { const r = await authedPostJSON<{ reasons: string[] }>(endpoint, { reasons: list }); onSaved(r.reasons); }
    catch { alert('No se pudo guardar.'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
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
