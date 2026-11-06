import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Wallet, RefreshCw, AlertCircle, CheckCircle2, X, Pencil, Power } from 'lucide-react';
import { authedGetJSON, authedPostJSON } from '../../lib/api';

interface Concept {
  id: string;
  displayName: string;
  amount: number; // centavos
  currency: string;
  recurrent: boolean;
  active?: boolean;
  plazos?: number | null;
  description?: string;
}

const money = (centavos: number) =>
  (centavos / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const PlansPanel: React.FC = () => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Concept | 'new' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await authedGetJSON<{ concepts: Concept[]; configured: boolean }>('/api/quentli/admin-concepts');
      setConcepts(r.concepts || []);
      setConfigured(r.configured !== false);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (c: Concept) => {
    setBusy(c.id);
    try {
      await authedPostJSON('/api/quentli/update-concept', { id: c.id, active: !(c.active !== false) });
      await load();
    } catch { alert('No se pudo cambiar el estado del plan.'); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Planes de pago</h2>
          <p className="text-sm text-slate-500">Se crean y editan en Quentli; aparecen en la inscripción del alumno.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="bg-slate-100 text-slate-600 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-200 flex items-center gap-2">
            <RefreshCw size={16} /> Actualizar
          </button>
          <button onClick={() => setEditing('new')} className="bg-[#2B5299] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-800 flex items-center gap-2">
            <Plus size={16} /> Nuevo plan
          </button>
        </div>
      </div>

      {!configured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold rounded-2xl px-5 py-3 flex items-center gap-2">
          <AlertCircle size={16} /> Quentli no está configurado (falta QUENTLI_API_KEY).
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>
      ) : concepts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4"><Wallet size={26} /></div>
          <p className="text-slate-500 font-medium">Aún no hay planes. Crea el primero con “Nuevo plan”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {concepts.map((c) => {
            const inactive = c.active === false;
            const total = c.plazos ? c.amount * c.plazos : undefined;
            return (
              <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-6 ${inactive ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-slate-800 leading-tight">{c.displayName}</h3>
                  {inactive
                    ? <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-full shrink-0">Inactivo</span>
                    : c.recurrent && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full shrink-0">Activo</span>}
                </div>
                {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                <div className="flex items-end gap-1.5 mt-4">
                  <span className="text-2xl font-black text-[#2B5299]">{money(c.amount)}</span>
                  <span className="text-slate-400 text-xs font-bold mb-1">/mes</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {c.plazos ? `${c.plazos} mensualidades` : 'Indefinido'}
                  </span>
                  {total && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Total {money(total)}</span>}
                </div>
                <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button onClick={() => setEditing(c)} className="flex-1 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg py-2 flex items-center justify-center gap-1.5">
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => toggleActive(c)} disabled={busy === c.id}
                    className={`flex-1 text-xs font-bold rounded-lg py-2 flex items-center justify-center gap-1.5 disabled:opacity-50 ${inactive ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}>
                    {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />} {inactive ? 'Activar' : 'Desactivar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <PlanModal
          concept={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
};

const PlanModal: React.FC<{ concept: Concept | null; onClose: () => void; onSaved: () => void }> = ({ concept, onClose, onSaved }) => {
  const isEdit = !!concept;
  const [name, setName] = useState(concept?.displayName || '');
  const [monthly, setMonthly] = useState(concept ? String(Math.round(concept.amount / 100)) : '');
  const [plazos, setPlazos] = useState(concept?.plazos ? String(concept.plazos) : '');
  const [description, setDescription] = useState(concept?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const nMonthly = Number(monthly);
  const nPlazos = Number(plazos);
  const total = nMonthly > 0 && nPlazos > 0 ? nMonthly * nPlazos : undefined;

  const save = async () => {
    setError('');
    if (name.trim().length < 3) return setError('Escribe un nombre para el plan.');
    if (!(nMonthly > 0)) return setError('Escribe el monto mensual.');
    setSaving(true);
    try {
      if (isEdit) {
        await authedPostJSON('/api/quentli/update-concept', {
          id: concept!.id, name: name.trim(), monthlyMXN: nMonthly,
          plazos: nPlazos > 0 ? nPlazos : 0, description: description.trim(),
        });
      } else {
        await authedPostJSON('/api/quentli/create-concept', {
          name: name.trim(), monthlyMXN: nMonthly,
          plazos: nPlazos > 0 ? nPlazos : undefined, description: description.trim() || undefined,
        });
      }
      setDone(true);
      setTimeout(onSaved, 900);
    } catch (e: any) {
      setError(e?.message?.includes('Quentli') ? 'Quentli rechazó el plan. Revisa los datos.' : 'No se pudo guardar el plan.');
      setSaving(false);
    }
  };

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#2B5299] transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-800">{isEdit ? 'Editar plan' : 'Nuevo plan de pago'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"><CheckCircle2 size={28} /></div>
            <p className="font-black text-slate-800">{isEdit ? '¡Plan actualizado en Quentli!' : '¡Plan creado en Quentli!'}</p>
          </div>
        ) : (
          <>
            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Nombre del plan</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Titulación — 10 mensualidades" className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Monto mensual (MXN)</label>
                  <input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="numeric" placeholder="3700" className={input} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Plazos (meses)</label>
                  <input value={plazos} onChange={(e) => setPlazos(e.target.value)} inputMode="numeric" placeholder="10" className={input} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1">Descripción (opcional)</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalle que verá el alumno" className={input} />
              </div>
              {total && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-2.5">
                  Total del plan: <b className="text-[#2B5299]">{money(total * 100)}</b> ({nPlazos} × {money(nMonthly * 100)})
                </p>
              )}
              <p className="text-[11px] text-slate-400">Si dejas “Plazos” vacío, el cobro es indefinido (hasta cancelar).</p>
            </div>
            <button onClick={save} disabled={saving} className="mt-6 w-full bg-[#2B5299] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} {isEdit ? 'Guardar cambios' : 'Crear en Quentli'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlansPanel;
