import React, { useEffect, useState } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { CreditCard, CheckCircle2, Loader2, ShieldCheck, AlertCircle, CalendarClock, MessageCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { authedGetJSON, authedPostJSON } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Concept {
  id: string;
  displayName: string;
  amount: number; // centavos
  currency: string;
  collectionInterval?: string;
  plazos?: number | null;
  description?: string;
}

interface Enrollment {
  id: string;
  status: 'pending_card' | 'card_ready' | 'active' | 'paid' | string;
  conceptName?: string;
  amount?: number;
  plazos?: number | null;
  setupUrl?: string;
}

const money = (centavos: number) =>
  (centavos / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const WHATSAPP = 'https://wa.me/523339498607'; // 33 3949 8607

const Inscripcion: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [totalAbonado, setTotalAbonado] = useState(0);
  const [loadingConcepts, setLoadingConcepts] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Conceptos (planes) desde Quentli
  useEffect(() => {
    (async () => {
      try {
        const { concepts } = await authedGetJSON<{ concepts: Concept[] }>('/api/quentli/concepts');
        setConcepts(concepts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingConcepts(false);
      }
    })();
  }, []);

  // Estado del alumno: abono acumulado + enrollments
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (d) => {
      const data = d.data() as any;
      setTotalAbonado(data?.payment?.totalAbonado ?? 0);
    });
    const unsubEnr = onSnapshot(collection(db, 'users', firebaseUser.uid, 'enrollments'), (snap) => {
      setEnrollments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => { unsubUser(); unsubEnr(); };
  }, [firebaseUser]);

  const active = enrollments.find((e) => e.status === 'active' || e.status === 'paid');
  const cardReady = enrollments.find((e) => e.status === 'card_ready');
  const pending = enrollments.find((e) => e.status === 'pending_card' && e.setupUrl);
  const isEnrolled = !!active || totalAbonado > 0;

  const handleEnroll = async (conceptId: string) => {
    setError('');
    setStarting(conceptId);
    try {
      const { url } = await authedPostJSON<{ url: string }>('/api/quentli/enroll', { conceptId });
      if (url) window.location.href = url;
      else throw new Error('sin url');
    } catch (e: any) {
      console.error(e);
      setError('No se pudo iniciar la inscripción. Inténtalo de nuevo o contacta a tu asesor.');
      setStarting(null);
    }
  };

  // ── Ya inscrito / con abono ──
  if (isEnrolled) {
    const plan = active?.conceptName;
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-200">
            <CheckCircle2 size={34} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Inscripción activa!</h2>
          {plan && <p className="text-slate-500 font-medium">{plan}</p>}
          <div className="mt-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Abonado a la fecha</p>
            <p className="text-3xl font-black text-[#2B5299]">{money(totalAbonado * 100)}</p>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
            <ShieldCheck size={14} /> Cobro automático con Quentli
          </span>
        </div>
      </div>
    );
  }

  // ── Tarjeta registrada pero suscripción en proceso ──
  if (cardReady) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-amber-400 rounded-3xl flex items-center justify-center text-amber-950 mx-auto mb-6 shadow-xl shadow-amber-100">
            <CalendarClock size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Tarjeta registrada ✓</h2>
          <p className="text-slate-500 font-medium">Estamos activando tu plan de pagos. Tu asesor lo confirmará en breve.</p>
        </div>
      </div>
    );
  }

  // ── Falta terminar de registrar la tarjeta ──
  if (pending) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-[#2B5299] rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-200">
            <CreditCard size={30} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Termina tu inscripción</h2>
          <p className="text-slate-500 font-medium mb-2">{pending.conceptName}</p>
          <p className="text-sm text-slate-400 mb-7">Falta registrar tu método de pago para activar tu plan.</p>
          <a
            href={pending.setupUrl}
            className="inline-flex items-center justify-center gap-3 w-full bg-[#2B5299] text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all uppercase tracking-widest text-sm"
          >
            <CreditCard size={20} /> Registrar mi tarjeta
          </a>
          <p className="text-[10px] text-slate-400 text-center mt-4 font-medium flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Pago seguro procesado por Quentli
          </p>
        </div>
      </div>
    );
  }

  if (loadingConcepts) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-[#2B5299]" size={32} />
      </div>
    );
  }

  // ── Sin planes configurados ──
  if (concepts.length === 0) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-5">
            <CreditCard size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Planes en preparación</h2>
          <p className="text-slate-500 font-medium mb-6">Aún no hay planes de pago disponibles. Tu asesor te ayudará a inscribirte.</p>
          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-emerald-500 text-white font-black px-6 py-3 rounded-xl hover:bg-emerald-600">
            <MessageCircle size={18} /> Hablar con un asesor
          </a>
        </div>
      </div>
    );
  }

  // ── Elegir plan ──
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-gradient-to-r from-[#2B5299] to-blue-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/20 mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Elige tu plan de pagos</h2>
        <p className="text-blue-100/80 text-sm font-medium">Selecciona el plan de titulación. Registras tu tarjeta una sola vez y tus mensualidades se cobran automáticamente.</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl px-5 py-3 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {concepts.map((c) => {
          const plazos = c.plazos || undefined;
          const total = plazos ? c.amount * plazos : undefined;
          return (
            <div key={c.id} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-7 flex flex-col">
              <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{c.displayName}</h3>
              {c.description && <p className="text-sm text-slate-500 mb-4">{c.description}</p>}
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-black text-[#2B5299]">{money(c.amount)}</span>
                <span className="text-slate-400 text-sm font-bold mb-1">/mes</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {plazos && (
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    {plazos} mensualidades
                  </span>
                )}
                {total && (
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    Total {money(total)}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleEnroll(c.id)}
                disabled={starting === c.id}
                className="mt-6 w-full bg-[#2B5299] text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {starting === c.id ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                Inscribirme
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-6 font-medium flex items-center justify-center gap-1">
        <ShieldCheck size={12} /> Tu tarjeta se registra de forma segura en Quentli · nunca en este portal
      </p>
    </div>
  );
};

export default Inscripcion;
