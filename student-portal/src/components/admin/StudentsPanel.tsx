import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Loader2, X, FileText, ExternalLink, Search, Save, CheckCircle2, MessageCircle, MapPin } from 'lucide-react';
import { authedGetJSON, authedPostJSON } from '../../lib/api';
import { STAGES_CONFIG, LICENCIATURAS } from '../../constants';

interface StudentRow { uid: string; name: string; email: string; licenciatura: string; currentStage: number; totalAbonado: number; }

const money = (n: number) => (n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const stageName = (i: number) => STAGES_CONFIG[i]?.title || `Etapa ${i + 1}`;

const DEFAULT_CERT_STEPS = [
  { title: 'Validación de expediente', status: 'pendiente' },
  { title: 'Exámenes aprobados', status: 'pendiente' },
  { title: 'Integración ante la SEP', status: 'pendiente' },
  { title: 'Registro de título', status: 'pendiente' },
  { title: 'Cédula profesional', status: 'pendiente' },
];

const StudentsPanel: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detailUid, setDetailUid] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authedGetJSON<{ students: StudentRow[] }>('/api/admin/students');
      setStudents(data.students);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = students.filter((s) =>
    `${s.name} ${s.email} ${s.licenciatura}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2B5299] rounded-2xl flex items-center justify-center text-white shadow-lg"><Users size={24} /></div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Alumnos</h2>
            <p className="text-sm text-slate-500">{students.length} registrados</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..."
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="bg-[#2B5299] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-800 flex items-center gap-2 whitespace-nowrap">
            <UserPlus size={16} /> Alta manual
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="text-left font-black px-6 py-3">Alumno</th>
                <th className="text-left font-black px-6 py-3">Carrera</th>
                <th className="text-left font-black px-6 py-3">Etapa</th>
                <th className="text-left font-black px-6 py-3">Abonado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.uid} onClick={() => setDetailUid(s.uid)} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{s.name || '—'}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{s.licenciatura || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#2B5299] px-2.5 py-1 rounded-full">{stageName(s.currentStage)}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{money(s.totalAbonado)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Sin alumnos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateStudentModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {detailUid && <StudentDetail uid={detailUid} onClose={() => setDetailUid(null)} onSaved={load} />}
    </div>
  );
};

const CreateStudentModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', licenciatura: LICENCIATURAS[0], phone: '', curp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const r = await authedPostJSON<{ resetLink: string }>('/api/admin/create-student', form);
      setResetLink(r.resetLink);
    } catch {
      setError('No se pudo crear. ¿El correo ya existe?');
    } finally { setLoading(false); }
  };

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">Alta manual de alumno</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {resetLink ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto"><CheckCircle2 size={28} /></div>
            <p className="font-bold text-slate-800">Alumno creado</p>
            <p className="text-xs text-slate-500">Comparte este enlace para que defina su contraseña:</p>
            <input readOnly value={resetLink} onClick={(e) => (e.target as HTMLInputElement).select()} className={input} />
            <button onClick={onCreated} className="w-full bg-[#2B5299] text-white font-bold py-3 rounded-xl">Listo</button>
          </div>
        ) : (
          <div className="space-y-3">
            {error && <p className="text-red-600 text-xs font-bold bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <input placeholder="Nombre completo *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            <input placeholder="Correo *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
            <select value={form.licenciatura} onChange={(e) => setForm({ ...form, licenciatura: e.target.value })} className={input}>
              {LICENCIATURAS.map((l) => <option key={l}>{l}</option>)}
            </select>
            <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
            <input placeholder="CURP" value={form.curp} onChange={(e) => setForm({ ...form, curp: e.target.value.toUpperCase() })} maxLength={18} className={input} />
            <button onClick={submit} disabled={loading || !form.name || !form.email}
              className="w-full bg-[#2B5299] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Crear alumno
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface Detail {
  student: any; documents: any[]; exams: any[]; enrollments: any[]; certification: any;
}

const StudentDetail: React.FC<{ uid: string; onClose: () => void; onSaved: () => void }> = ({ uid, onClose, onSaved }) => {
  const [data, setData] = useState<Detail | null>(null);
  const [stage, setStage] = useState(0);
  const [abono, setAbono] = useState(0);
  const [steps, setSteps] = useState<{ title: string; status: string }[]>(DEFAULT_CERT_STEPS);
  const [folio, setFolio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await authedGetJSON<Detail>(`/api/admin/student?uid=${uid}`);
      setData(d);
      setStage(d.student.currentStage ?? 0);
      setAbono(d.student.payment?.totalAbonado ?? 0);
      setFolio(d.certification?.folio || '');
      setSteps(d.certification?.steps?.length ? d.certification.steps : DEFAULT_CERT_STEPS);
    })();
  }, [uid]);

  const save = async () => {
    setSaving(true);
    try {
      const completed = steps.every((s) => s.status === 'completado');
      await authedPostJSON('/api/admin/update-student', {
        uid, currentStage: stage, totalAbonado: abono,
        certification: { status: completed ? 'completado' : 'en_proceso', folio, steps },
      });
      onSaved();
      onClose();
    } catch {
      alert('No se pudo guardar.');
    } finally { setSaving(false); }
  };

  const cycle = (i: number) => setSteps((prev) => prev.map((s, idx) => idx === i
    ? { ...s, status: s.status === 'pendiente' ? 'en_proceso' : s.status === 'en_proceso' ? 'completado' : 'pendiente' } : s));

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl p-8 custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        {!data ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">{data.student.name}</h3>
                <p className="text-sm text-slate-400">{data.student.email}</p>
                <p className="text-xs text-slate-500 mt-1">{data.student.licenciatura}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={22} /></button>
            </div>

            <Section title="Contacto">
              <div className="space-y-2 text-sm bg-slate-50 rounded-xl px-4 py-3">
                {data.student.phone
                  ? <a href={`https://wa.me/52${String(data.student.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-700 font-bold hover:underline"><MessageCircle size={16} /> {data.student.phone}</a>
                  : <p className="text-slate-400">Sin teléfono</p>}
                {data.student.city && <p className="text-slate-600 flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {data.student.city}</p>}
                {data.student.curp && <p className="text-slate-400 text-xs">CURP: {data.student.curp}</p>}
              </div>
            </Section>

            {data.student.preQual && (
              <Section title="Precalificación">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {([['bachillerato', 'Bachillerato'], ['experiencia', 'Experiencia'], ['titularseCuando', 'Quiere titularse'], ['comoConociste', 'Nos conoció por']] as [string, string][])
                    .filter(([k]) => data.student.preQual[k])
                    .map(([k, lbl]) => (
                      <div key={k} className="bg-slate-50 rounded-xl px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{lbl}</p>
                        <p className="font-bold text-slate-700">{data.student.preQual[k]}</p>
                      </div>
                    ))}
                </div>
              </Section>
            )}

            <Section title="Documentos">
              {data.documents.length === 0 ? <Empty>Sin documentos subidos.</Empty> : (
                <div className="space-y-2">
                  {data.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{d.type}</p>
                          <p className={`text-[10px] font-black uppercase ${d.status === 'valid' ? 'text-emerald-600' : d.status === 'invalid' ? 'text-red-500' : 'text-slate-400'}`}>{d.status || 'subido'}</p>
                        </div>
                      </div>
                      {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-[#2B5299] hover:underline"><ExternalLink size={16} /></a>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Exámenes agendados">
              {data.exams.length === 0 ? <Empty>Sin exámenes agendados.</Empty> : (
                <div className="space-y-2">
                  {data.exams.map((e) => (
                    <div key={e.id} className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
                      <span className="font-bold capitalize">{e.examType}</span> · {e.scheduledAt ? new Date(e.scheduledAt).toLocaleDateString('es-MX') : '—'} · <span className="text-slate-400">{e.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Progreso y pago">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etapa actual</label>
              <select value={stage} onChange={(e) => setStage(Number(e.target.value))} className={input + ' mb-3'}>
                {STAGES_CONFIG.map((s, i) => <option key={i} value={i}>{i + 1}. {s.title}</option>)}
              </select>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total abonado (MXN)</label>
              <input type="number" value={abono} onChange={(e) => setAbono(Number(e.target.value))} className={input} />
              <p className="text-[10px] text-slate-400 mt-1">Provisional hasta conectar Quentli. Mínimo para agendar: $13,000.</p>
            </Section>

            <Section title="Certificación">
              <div className="space-y-2 mb-3">
                {steps.map((s, i) => (
                  <button key={i} onClick={() => cycle(i)}
                    className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-left">
                    <span className="font-medium text-slate-700">{s.title}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${s.status === 'completado' ? 'bg-emerald-100 text-emerald-700' : s.status === 'en_proceso' ? 'bg-blue-100 text-[#2B5299]' : 'bg-slate-200 text-slate-500'}`}>{s.status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
              <input placeholder="Folio del título" value={folio} onChange={(e) => setFolio(e.target.value)} className={input} />
              <p className="text-[10px] text-slate-400 mt-1">Toca cada paso para cambiar su estado.</p>
            </Section>

            <button onClick={save} disabled={saving}
              className="w-full bg-[#2B5299] text-white font-black py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar cambios
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</h4>
    {children}
  </div>
);
const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-4 py-3">{children}</p>;

export default StudentsPanel;
