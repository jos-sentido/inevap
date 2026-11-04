import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Loader2, X, Save, CheckCircle2, Percent } from 'lucide-react';
import { authedGetJSON, authedPostJSON } from '../../lib/api';

interface Rep { uid: string; name: string; email?: string }
interface Rule { uid: string; name: string; percentage: number }

const TeamPanel: React.FC = () => {
  const [reps, setReps] = useState<Rep[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        authedGetJSON<{ staff: Rep[] }>('/api/crm/staff'),
        authedGetJSON<{ rules: Rule[] }>('/api/crm/assignment-rules'),
      ]);
      setReps(s.staff);
      // Combina reps con sus porcentajes guardados
      setRules(s.staff.map((rep) => ({ uid: rep.uid, name: rep.name, percentage: r.rules.find((x) => x.uid === rep.uid)?.percentage ?? 0 })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const totalPct = rules.reduce((a, r) => a + (Number(r.percentage) || 0), 0);

  const saveRules = async () => {
    setSavingRules(true);
    try { await authedPostJSON('/api/crm/assignment-rules', { rules: rules.filter((r) => r.percentage > 0) }); }
    catch { alert('No se pudo guardar.'); } finally { setSavingRules(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2B5299] rounded-2xl flex items-center justify-center text-white shadow-lg"><Users size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Equipo de ventas</h2>
              <p className="text-sm text-slate-500">{reps.length} vendedores</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-[#2B5299] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-800 flex items-center gap-2"><UserPlus size={16} /> Agregar vendedor</button>
        </div>
        {reps.length === 0 ? <p className="text-sm text-slate-400">Aún no hay vendedores. Agrega el primero.</p> : (
          <div className="space-y-2">
            {reps.map((r) => (
              <div key={r.uid} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <div><p className="font-bold text-slate-800 text-sm">{r.name}</p><p className="text-xs text-slate-400">{r.email}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Percent size={18} className="text-[#2B5299]" />
          <h3 className="text-lg font-black text-slate-800">Reglas de asignación (round-robin)</h3>
        </div>
        <p className="text-sm text-slate-500 mb-5">Reparto de prospectos nuevos por porcentaje entre el equipo.</p>
        {rules.length === 0 ? <p className="text-sm text-slate-400">Agrega vendedores para configurar el reparto.</p> : (
          <>
            <div className="space-y-3 mb-4">
              {rules.map((r, i) => (
                <div key={r.uid} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-slate-700">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={100} value={r.percentage} onChange={(e) => setRules((rs) => rs.map((x, idx) => idx === i ? { ...x, percentage: Number(e.target.value) } : x))} className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-right outline-none focus:ring-2 focus:ring-blue-100" />
                    <span className="text-slate-400 text-sm">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={`flex items-center justify-between text-sm font-bold mb-4 ${totalPct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              <span>Total</span><span>{totalPct}% {totalPct !== 100 && '(idealmente 100%)'}</span>
            </div>
            <button onClick={saveRules} disabled={savingRules} className="w-full bg-[#2B5299] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {savingRules ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar reglas
            </button>
          </>
        )}
      </div>

      {showCreate && <CreateRepModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
};

const CreateRepModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');
  const submit = async () => {
    setError(''); setLoading(true);
    try { const r = await authedPostJSON<{ resetLink: string }>('/api/crm/create-staff', form); setResetLink(r.resetLink); }
    catch { setError('No se pudo crear. ¿El correo ya existe?'); } finally { setLoading(false); }
  };
  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-black text-slate-800">Agregar vendedor</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
        {resetLink ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto"><CheckCircle2 size={28} /></div>
            <p className="font-bold text-slate-800">Vendedor creado</p>
            <p className="text-xs text-slate-500">Comparte este enlace para que defina su contraseña:</p>
            <input readOnly value={resetLink} onClick={(e) => (e.target as HTMLInputElement).select()} className={input} />
            <button onClick={onCreated} className="w-full bg-[#2B5299] text-white font-bold py-3 rounded-xl">Listo</button>
          </div>
        ) : (
          <div className="space-y-3">
            {error && <p className="text-red-600 text-xs font-bold bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <input placeholder="Nombre completo *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            <input placeholder="Correo *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
            <button onClick={submit} disabled={loading || !form.name || !form.email} className="w-full bg-[#2B5299] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Crear vendedor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPanel;
