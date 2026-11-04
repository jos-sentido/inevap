import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2, Plus, Trash2, Users, X } from 'lucide-react';
import { authedGetJSON, authedPostJSON, authedJSON } from '../../lib/api';

interface Slot {
  id: string; examType: 'teorico' | 'oral'; dateTime: string; capacity: number; booked: number; modality: string;
  roster: { uid: string; name: string; status: string }[];
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const ExamsPanel: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await authedGetJSON<{ slots: Slot[] }>('/api/admin/exam-roster');
      setSlots(d.slots);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm('¿Eliminar esta fecha? (Los alumnos ya agendados la perderán)')) return;
    try { await authedJSON('/api/admin/slots', 'DELETE', { id }); load(); }
    catch { alert('No se pudo eliminar.'); }
  };

  const columns: { type: 'teorico' | 'oral'; label: string }[] = [
    { type: 'teorico', label: 'Examen Teórico (Escrito)' },
    { type: 'oral', label: 'Examen Oral (Caso práctico)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><CalendarDays size={24} /></div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Agenda de exámenes</h2>
            <p className="text-sm text-slate-500">Fechas y alumnos agendados</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-emerald-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> Agregar fecha
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {columns.map((col) => (
            <div key={col.type} className="space-y-4">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">{col.label}</h3>
              {slots.filter((s) => s.examType === col.type).map((slot) => (
                <div key={slot.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 capitalize text-sm">{fmt(slot.dateTime)}</p>
                      <p className="text-[11px] text-slate-500">{fmtTime(slot.dateTime)} hrs · {slot.booked}/{slot.capacity} lugares</p>
                    </div>
                    <button onClick={() => del(slot.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </div>
                  <div className="p-4">
                    {slot.roster.length === 0 ? (
                      <p className="text-xs text-slate-400">Nadie agendado aún.</p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-2"><Users size={12} /> Agendados</p>
                        {slot.roster.map((r) => (
                          <div key={r.uid} className="text-sm text-slate-700 flex items-center justify-between">
                            <span>{r.name}</span>
                            <span className="text-[9px] font-black uppercase text-slate-400">{r.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {slots.filter((s) => s.examType === col.type).length === 0 && (
                <p className="text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 px-4 py-6 text-center">Sin fechas.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddSlotModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
};

const AddSlotModal: React.FC<{ onClose: () => void; onAdded: () => void }> = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ examType: 'teorico', date: '', time: '10:00', capacity: 20, modality: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.date) { setError('Elige una fecha'); return; }
    setLoading(true); setError('');
    try {
      await authedPostJSON('/api/admin/slots', {
        examType: form.examType,
        dateTime: new Date(`${form.date}T${form.time}:00`).toISOString(),
        capacity: Number(form.capacity),
        modality: form.modality,
      });
      onAdded();
    } catch { setError('No se pudo crear.'); } finally { setLoading(false); }
  };

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">Agregar fecha de examen</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {error && <p className="text-red-600 text-xs font-bold bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })} className={input}>
            <option value="teorico">Teórico (Escrito)</option>
            <option value="oral">Oral (Caso práctico)</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={input} />
          </div>
          <input type="number" placeholder="Cupo" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className={input} />
          <input placeholder="Modalidad (opcional)" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })} className={input} />
          <button onClick={submit} disabled={loading} className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Crear fecha
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamsPanel;
