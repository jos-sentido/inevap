import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, Loader2, PlayCircle, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { authedPostJSON } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { LICENCIATURAS } from '../../constants';

const WHATSAPP = '523339498607'; // 33 3949 8607

// Convierte una URL de YouTube/Vimeo a su forma embebible.
function toEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

const Bienvenida: React.FC<{ onContinuar: () => void }> = ({ onContinuar }) => {
  const { profile, updateProfessionalProfile } = useAuth();
  const prof = profile!;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    licenciatura: prof.licenciatura || LICENCIATURAS[0],
    bachillerato: '',
    experiencia: '',
    yearsExp: prof.professionalProfile?.yearsExp || '',
    currentRole: prof.professionalProfile?.currentRole || '',
    industry: prof.professionalProfile?.industry || '',
    titularseCuando: '',
    comoConociste: '',
  });

  useEffect(() => {
    getDoc(doc(db, 'config', 'welcome'))
      .then((s) => setVideoUrl(s.exists() ? toEmbed((s.data() as any).videoUrl || '') : null))
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await authedPostJSON('/api/profile/prequalify', {
        licenciatura: form.licenciatura,
        professionalProfile: { yearsExp: form.yearsExp, currentRole: form.currentRole, industry: form.industry },
        preQual: {
          bachillerato: form.bachillerato,
          experiencia: form.experiencia,
          titularseCuando: form.titularseCuando,
          comoConociste: form.comoConociste,
        },
      });
      // refleja el perfil en memoria
      updateProfessionalProfile({ yearsExp: form.yearsExp, currentRole: form.currentRole, industry: form.industry }).catch(() => {});
      onContinuar();
    } catch {
      alert('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#2B5299] transition-all';
  const label = 'text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block';

  const Choice: React.FC<{ k: string; options: string[] }> = ({ k, options }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => set(k, o)}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${(form as any)[k] === o ? 'bg-[#2B5299] text-white border-[#2B5299]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#2B5299]'}`}>
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#2B5299] to-blue-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-md border border-white/20"><Sparkles size={28} className="text-amber-300" /></div>
          <h2 className="text-2xl md:text-3xl font-black mb-3">¡Bienvenido a INEVAP, {prof.name?.split(' ')[0]}!</h2>
          <p className="text-blue-100/80 font-medium leading-relaxed max-w-2xl">
            Estás a punto de titularte reconociendo tu experiencia profesional por el Acuerdo 286 de la SEP.
            Cuéntanos un poco de ti para personalizar tu proceso, y conoce cómo funciona.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-sm font-bold">
            <span className="bg-white/10 px-4 py-2 rounded-xl">⏱️ ~6 meses</span>
            <span className="bg-white/10 px-4 py-2 rounded-xl">📝 2 exámenes</span>
            <span className="bg-white/10 px-4 py-2 rounded-xl">✅ Validez oficial SEP</span>
          </div>
        </div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Video informativo */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        {videoUrl ? (
          <div className="aspect-video w-full bg-black">
            <iframe src={videoUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video informativo INEVAP" />
          </div>
        ) : (
          <div className="aspect-video w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
            <PlayCircle size={48} className="mb-3" />
            <p className="text-sm font-bold">Video informativo (próximamente)</p>
          </div>
        )}
      </div>

      {/* Precalificador */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8">
        <h3 className="text-xl font-black text-slate-800 mb-1">Cuéntanos de ti</h3>
        <p className="text-sm text-slate-500 mb-6">Esto personaliza tu Tutor IA y tu proceso.</p>
        <div className="space-y-6">
          <div>
            <label className={label}>Carrera de interés</label>
            <select value={form.licenciatura} onChange={(e) => set('licenciatura', e.target.value)} className={input}>
              {LICENCIATURAS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>¿Concluiste tu bachillerato?</label>
            <Choice k="bachillerato" options={['Sí', 'No', 'En trámite']} />
          </div>
          <div>
            <label className={label}>¿Tienes experiencia laboral en el área?</label>
            <Choice k="experiencia" options={['Sí', 'No']} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={label}>Años de experiencia</label><input type="number" value={form.yearsExp} onChange={(e) => set('yearsExp', e.target.value)} className={input} /></div>
            <div><label className={label}>Puesto actual</label><input value={form.currentRole} onChange={(e) => set('currentRole', e.target.value)} className={input} /></div>
            <div><label className={label}>Industria / sector</label><input value={form.industry} onChange={(e) => set('industry', e.target.value)} className={input} /></div>
          </div>
          <div>
            <label className={label}>¿Para cuándo quieres titularte?</label>
            <Choice k="titularseCuando" options={['Lo antes posible', 'En 3-6 meses', 'Este año', 'Solo explorando']} />
          </div>
          <div>
            <label className={label}>¿Cómo nos conociste?</label>
            <Choice k="comoConociste" options={['Facebook / Instagram', 'Google', 'Recomendación', 'Otro']} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button onClick={submit} disabled={saving}
            className="flex-1 bg-[#2B5299] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />} Continuar a Admisión
          </button>
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, me interesa titularme con INEVAP y quisiera una sesión informativa.')}`} target="_blank" rel="noreferrer"
            className="sm:w-auto bg-emerald-50 text-emerald-700 font-bold py-4 px-6 rounded-2xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 text-sm">
            <MessageCircle size={18} /> Hablar con un asesor
          </a>
        </div>
        <p className="text-[11px] text-slate-400 text-center mt-4 flex items-center justify-center gap-1">
          <CheckCircle2 size={12} className="text-emerald-500" /> Puedes avanzar por tu cuenta o agendar una sesión cuando quieras.
        </p>
      </div>
    </div>
  );
};

export default Bienvenida;
