import React, { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { Calendar, Loader2, CheckCircle2, Clock, Users, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { authedPostJSON } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ExamSlot, ExamType, Exam } from '../../types';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const LABEL: Record<ExamType, string> = { teorico: 'Examen Teórico (Escrito)', oral: 'Examen Oral (Caso práctico)' };

const Agendado: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [slots, setSlots] = useState<ExamSlot[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'examSlots'));
        const now = Date.now();
        const list: ExamSlot[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            const iso = data.dateTime?.toDate ? data.dateTime.toDate().toISOString() : data.dateTime;
            return { id: d.id, examType: data.examType, dateTime: iso, capacity: data.capacity, booked: data.booked ?? 0, modality: data.modality };
          })
          .filter((s) => new Date(s.dateTime).getTime() > now)
          .sort((a, b) => +new Date(a.dateTime) - +new Date(b.dateTime));
        setSlots(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(collection(db, 'users', firebaseUser.uid, 'exams'), (snap) => {
      setExams(snap.docs.map((d) => {
        const data = d.data() as any;
        const iso = data.scheduledAt?.toDate ? data.scheduledAt.toDate().toISOString() : data.scheduledAt;
        return { id: d.id, examType: data.examType, slotId: data.slotId, scheduledAt: iso, status: data.status };
      }));
    });
    return unsub;
  }, [firebaseUser]);

  const bookedType = (t: ExamType) => exams.find((e) => e.examType === t && e.status !== 'cancelled');

  const handleBook = async (slot: ExamSlot) => {
    setError('');
    setBooking(slot.id);
    try {
      await authedPostJSON('/api/exams/book', { slotId: slot.id });
      // onSnapshot actualiza exams; refrescamos conteo local
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, booked: s.booked + 1 } : s)));
    } catch (e: any) {
      setError(e?.message?.includes('409') ? 'Esa fecha ya no está disponible o ya reservaste este examen.' : 'No se pudo reservar. Intenta de nuevo.');
    } finally {
      setBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-[#2B5299]" size={32} />
      </div>
    );
  }

  const renderColumn = (type: ExamType) => {
    const booked = bookedType(type);
    const typeSlots = slots.filter((s) => s.examType === type);
    return (
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${type === 'teorico' ? 'bg-[#2B5299]' : 'bg-emerald-600'}`}>
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 leading-tight">{LABEL[type]}</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              {type === 'teorico' ? 'Fines de semana' : 'Entre semana'}
            </p>
          </div>
        </div>

        {booked ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-emerald-50 rounded-3xl border border-emerald-100 p-8">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Fecha reservada</p>
            <p className="text-lg font-black text-slate-800 capitalize">{fmtDate(booked.scheduledAt)}</p>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1"><Clock size={14} /> {fmtTime(booked.scheduledAt)} hrs</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
            {typeSlots.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">No hay fechas disponibles por ahora.</p>
            )}
            {typeSlots.map((slot) => {
              const full = slot.booked >= slot.capacity;
              return (
                <div key={slot.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${full ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200 hover:border-[#2B5299] hover:shadow-md'}`}>
                  <div>
                    <p className="text-sm font-bold text-slate-800 capitalize">{fmtDate(slot.dateTime)}</p>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                      <Clock size={12} /> {fmtTime(slot.dateTime)} hrs
                      <span className="flex items-center gap-1"><Users size={12} /> {slot.capacity - slot.booked} lugares</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleBook(slot)}
                    disabled={full || booking === slot.id}
                    className="bg-[#2B5299] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-all disabled:opacity-40 flex items-center gap-2"
                  >
                    {booking === slot.id ? <Loader2 size={14} className="animate-spin" /> : null}
                    {full ? 'Lleno' : 'Reservar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-gradient-to-r from-[#2B5299] to-blue-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/20">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Agenda tus exámenes</h2>
        <p className="text-blue-100/80 text-sm font-medium">Elige una fecha para tu examen teórico y una para tu examen oral. Recuerda que el teórico va primero.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl px-5 py-3 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderColumn('teorico')}
        {renderColumn('oral')}
      </div>
    </div>
  );
};

export default Agendado;
