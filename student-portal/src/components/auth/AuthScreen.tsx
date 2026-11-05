import React, { useState } from 'react';
import { Loader2, GraduationCap, ShieldCheck, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LICENCIATURAS } from '../../constants';

type Mode = 'login' | 'register';

const friendlyError = (code: string): string => {
  const map: Record<string, string> = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  };
  return map[code] || 'Ocurrió un error. Intenta de nuevo.';
};

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#2B5299] transition-all font-medium text-sm';

const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState(0); // 0 nombre · 1 contacto · 2 contraseña
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [curp, setCurp] = useState('');
  const [licenciatura, setLicenciatura] = useState(LICENCIATURAS[0]);

  const firstName = name.trim().split(/\s+/)[0] || '';

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(0);
    setError('');
  };

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(friendlyError(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  // ── Registro progresivo ──
  const nextStep = () => {
    setError('');
    if (step === 0) {
      if (name.trim().length < 3) return setError('Escribe tu nombre completo.');
      return setStep(1);
    }
    if (step === 1) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Escribe un correo válido.');
      if (phone.replace(/\D/g, '').length < 10) return setError('Escribe tu WhatsApp a 10 dígitos.');
      return setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        curp: curp.trim(),
        licenciatura,
      });
    } catch (err: any) {
      setError(friendlyError(err?.code || ''));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo-inevap.jpg" alt="INEVAP" className="w-24 h-24 rounded-3xl shadow-xl shadow-blue-200 object-cover" />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-slate-200 p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
          {mode === 'login' ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-slate-800 mb-1">Bienvenido de vuelta</h1>
                <p className="text-sm text-slate-500">Accede a tu portal de titulación</p>
              </div>
              {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl px-4 py-3">{error}</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" required placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                <input type="password" required placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                <button type="submit" disabled={loading} className="w-full bg-[#2B5299] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <><GraduationCap size={20} /> Iniciar sesión</>}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={() => switchMode('register')} className="text-sm text-slate-500 hover:text-[#2B5299] font-medium transition-colors">
                  ¿No tienes cuenta? <span className="font-black text-[#2B5299]">Comienza aquí</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Encabezado personalizado */}
              <div className="text-center mb-6">
                {step === 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#2B5299] bg-blue-50 px-3 py-1.5 rounded-full mb-3">
                      <Sparkles size={12} /> Titúlate por tu experiencia
                    </span>
                    <h1 className="text-2xl font-black text-slate-800 mb-1">¡Bienvenido a INEVAP!</h1>
                    <p className="text-sm text-slate-500">Para empezar, ¿cómo te llamas?</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-black text-slate-800 mb-1">¡Mucho gusto, {firstName}! 👋</h1>
                    <p className="text-sm text-slate-500">{step === 1 ? 'Déjanos tus datos de contacto.' : 'Crea una contraseña y comienza.'}</p>
                  </>
                )}
              </div>

              {/* Progreso */}
              <div className="flex gap-1.5 mb-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#2B5299]' : 'bg-slate-200'}`} />
                ))}
              </div>

              {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl px-4 py-3">{error}</div>}

              <form onSubmit={step === 2 ? handleRegister : (e) => { e.preventDefault(); nextStep(); }} className="space-y-4">
                {step === 0 && (
                  <input autoFocus type="text" required placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                )}

                {step === 1 && (
                  <>
                    <input autoFocus type="email" required placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    <input type="tel" required placeholder="WhatsApp (10 dígitos)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Carrera de interés</label>
                      <select value={licenciatura} onChange={(e) => setLicenciatura(e.target.value)} className={inputClass}>
                        {LICENCIATURAS.map((lic) => <option key={lic} value={lic}>{lic}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <input autoFocus type="password" required placeholder="Crea una contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                    <input type="text" placeholder="CURP (opcional)" value={curp} onChange={(e) => setCurp(e.target.value.toUpperCase())} className={inputClass} maxLength={18} />
                  </>
                )}

                <div className="flex gap-3 pt-1">
                  {step > 0 && (
                    <button type="button" onClick={() => { setError(''); setStep(step - 1); }} className="px-5 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all flex items-center justify-center">
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="flex-1 bg-[#2B5299] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20} />
                      : step === 2 ? <><GraduationCap size={20} /> Comenzar</>
                      : <>Continuar <ArrowRight size={18} /></>}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <button onClick={() => switchMode('login')} className="text-sm text-slate-500 hover:text-[#2B5299] font-medium transition-colors">
                  ¿Ya tienes cuenta? <span className="font-black text-[#2B5299]">Inicia sesión</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Acuerdo 286 SEP · Datos cifrados</span>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
