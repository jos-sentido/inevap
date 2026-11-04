import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { CreditCard, CheckCircle2, Loader2, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { authedPostJSON } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const PLAN = {
  name: 'Titulación completa — Acuerdo 286',
  amountMXN: 25000,
  msiMonths: 12,
  features: [
    'Validación de tu experiencia profesional',
    'Tutor IA + guías de estudio de tu carrera',
    'Asesoría para la Memoria Descriptiva',
    'Examen teórico y oral',
    'Trámite del título ante la SEP',
  ],
};

const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const Inscripcion: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [paid, setPaid] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(collection(db, 'users', firebaseUser.uid, 'enrollments'), (snap) => {
      let isPaid = false;
      let isPending = false;
      snap.forEach((d) => {
        const s = (d.data() as { status?: string }).status;
        if (s === 'paid') isPaid = true;
        if (s === 'pending') isPending = true;
      });
      setPaid(isPaid);
      setPending(isPending && !isPaid);
    });
    return unsub;
  }, [firebaseUser]);

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      const { url } = await authedPostJSON<{ url: string }>('/api/checkout/create-session', { planId: 'completo' });
      if (url) window.location.href = url;
      else throw new Error('sin url');
    } catch (e) {
      console.error(e);
      setError('No se pudo iniciar el pago. Verifica tu conexión o inténtalo más tarde.');
      setLoading(false);
    }
  };

  const monthly = Math.round(PLAN.amountMXN / PLAN.msiMonths);
  const returnedSuccess = typeof window !== 'undefined' && window.location.search.includes('inscripcion=success');

  if (paid) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-200">
            <CheckCircle2 size={34} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Inscripción confirmada!</h2>
          <p className="text-slate-500 font-medium mb-6">Tu pago fue procesado. Ya puedes avanzar a la etapa de Estudio con tu Tutor IA.</p>
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
            <ShieldCheck size={14} /> Pago verificado
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-[#2B5299] to-blue-800 p-8 md:p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
              <CreditCard size={28} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-200 mb-2">Plan de inscripción</p>
            <h2 className="text-2xl font-black mb-4">{PLAN.name}</h2>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black">{money(PLAN.amountMXN)}</span>
              <span className="text-blue-200/80 text-sm font-bold mb-1">MXN</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-400 text-amber-950 text-xs font-black px-4 py-2 rounded-full">
              <Sparkles size={14} /> Hasta {PLAN.msiMonths} MSI · desde {money(monthly)}/mes
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="p-8 md:p-10">
          <ul className="space-y-3 mb-8">
            {PLAN.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl px-5 py-3 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {(pending || returnedSuccess) && !paid && (
            <div className="mb-5 bg-blue-50 border border-blue-100 text-[#2B5299] text-sm font-bold rounded-2xl px-5 py-3 flex items-center gap-3">
              <Loader2 size={16} className="animate-spin" /> Estamos confirmando tu pago. Esto puede tardar unos segundos…
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-[#2B5299] text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
            Pagar e inscribirme
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-4 font-medium flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Pago seguro procesado por Stripe · Aceptamos todas las tarjetas
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inscripcion;
