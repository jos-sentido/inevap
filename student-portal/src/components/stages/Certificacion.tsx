import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Award, CheckCircle2, Loader2, Circle, Clock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Certification, CertStep, CertStepStatus } from '../../types';

const DEFAULT_STEPS: CertStep[] = [
  { title: 'Validación de expediente', description: 'Revisión de documentos oficiales (INE, CURP, Bachillerato).', status: 'pendiente' },
  { title: 'Exámenes aprobados', description: 'Acreditación del examen teórico y oral.', status: 'pendiente' },
  { title: 'Integración ante la SEP', description: 'Envío del expediente completo a la Dirección General de Acreditación.', status: 'pendiente' },
  { title: 'Registro de título', description: 'Emisión y registro del título profesional.', status: 'pendiente' },
  { title: 'Cédula profesional', description: 'Trámite de cédula ante la SEP.', status: 'pendiente' },
];

const statusIcon = (s: CertStepStatus) => {
  if (s === 'completado') return <CheckCircle2 size={20} className="text-emerald-500" />;
  if (s === 'en_proceso') return <Clock size={20} className="text-[#2B5299]" />;
  return <Circle size={20} className="text-slate-300" />;
};

const Certificacion: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [cert, setCert] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, 'certifications', firebaseUser.uid), (snap) => {
      setCert(snap.exists() ? (snap.data() as Certification) : null);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [firebaseUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-[#2B5299]" size={32} />
      </div>
    );
  }

  const steps = cert?.steps?.length ? cert.steps : DEFAULT_STEPS;
  const done = steps.filter((s) => s.status === 'completado').length;
  const pct = Math.round((done / steps.length) * 100);
  const completed = cert?.status === 'completado';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto">
      <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden ${completed ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-900/20' : 'bg-gradient-to-r from-[#2B5299] to-blue-800 shadow-blue-900/20'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <Award size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Certificación</h2>
            <p className="text-white/70 text-sm font-medium">{completed ? '¡Proceso completado!' : 'Seguimiento de tu trámite de titulación'}</p>
          </div>
        </div>
        {cert?.folio && (
          <p className="text-[11px] font-black uppercase tracking-widest text-white/80">Folio: {cert.folio}</p>
        )}
        <div className="mt-6">
          <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-2">
            <span>Avance del trámite</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
        <ol className="relative">
          {steps.map((step, idx) => (
            <li key={idx} className="flex gap-5 pb-8 last:pb-0 relative">
              {idx < steps.length - 1 && (
                <span className={`absolute left-[9px] top-7 bottom-0 w-0.5 ${step.status === 'completado' ? 'bg-emerald-200' : 'bg-slate-100'}`} />
              )}
              <div className="shrink-0 mt-0.5 bg-white z-10">{statusIcon(step.status)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-black ${step.status === 'pendiente' ? 'text-slate-400' : 'text-slate-800'}`}>{step.title}</p>
                  {step.status === 'en_proceso' && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#2B5299] bg-blue-50 px-2.5 py-1 rounded-full">En proceso</span>
                  )}
                  {step.status === 'completado' && step.date && (
                    <span className="text-[10px] font-bold text-slate-400">{new Date(step.date).toLocaleDateString('es-MX')}</span>
                  )}
                </div>
                {step.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>}
              </div>
            </li>
          ))}
        </ol>

        {!cert && (
          <div className="mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
            <p className="text-xs text-slate-500 font-medium">Tu trámite aún no inicia. Avanza en las etapas previas (documentos, pago, estudio y exámenes) para comenzar tu certificación.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificacion;
