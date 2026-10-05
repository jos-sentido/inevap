import React, { useState } from 'react';
import { Loader2, GraduationCap, ShieldCheck } from 'lucide-react';
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

const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [curp, setCurp] = useState('');
  const [licenciatura, setLicenciatura] = useState(LICENCIATURAS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({ email: email.trim(), password, name: name.trim(), curp: curp.trim(), licenciatura });
      }
    } catch (err: any) {
      setError(friendlyError(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#2B5299] transition-all font-medium text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#2B5299] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">I</div>
          <span className="font-black text-2xl tracking-tight text-[#2B5299]">INEVAP</span>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-slate-200 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800 mb-1">
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h1>
            <p className="text-sm text-slate-500">
              {mode === 'login'
                ? 'Accede a tu portal de titulación'
                : 'Comienza tu proceso de titulación por experiencia'}
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            )}
            <input
              type="email"
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {mode === 'register' && (
              <>
                <input
                  type="text"
                  placeholder="CURP (opcional)"
                  value={curp}
                  onChange={(e) => setCurp(e.target.value.toUpperCase())}
                  className={inputClass}
                  maxLength={18}
                />
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                    Carrera de interés
                  </label>
                  <select
                    value={licenciatura}
                    onChange={(e) => setLicenciatura(e.target.value)}
                    className={inputClass}
                  >
                    {LICENCIATURAS.map((lic) => (
                      <option key={lic} value={lic}>
                        {lic}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2B5299] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <GraduationCap size={20} />
                  {mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-sm text-slate-500 hover:text-[#2B5299] font-medium transition-colors"
            >
              {mode === 'login' ? (
                <>
                  ¿No tienes cuenta? <span className="font-black text-[#2B5299]">Regístrate</span>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta? <span className="font-black text-[#2B5299]">Inicia sesión</span>
                </>
              )}
            </button>
          </div>
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
