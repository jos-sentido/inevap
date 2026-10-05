
import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Send,
  Loader2,
  LogOut,
  Bell,
  MessageSquare,
  UploadCloud,
  Menu,
  Sparkles,
  ShieldCheck,
  Settings,
  Database,
  BrainCircuit,
  GraduationCap,
  Save,
  Zap,
  ClipboardCheck,
  Briefcase
} from 'lucide-react';
import { STAGES_CONFIG, LICENCIATURAS } from './constants';
import { Message, ProfessionalProfile } from './types';
import { getAIResponse, verifyDocumentWithAI, getStudyTutorResponse } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './components/auth/AuthScreen';
import { db } from './lib/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const emptyProfile: ProfessionalProfile = { yearsExp: '', currentRole: '', industry: '' };

const Portal: React.FC = () => {
  const { profile, isAdmin, logout, updateProfessionalProfile } = useAuth();
  const prof = profile!; // garantizado por <App/>
  const licenciatura = prof.licenciatura || 'General';
  const professional = prof.professionalProfile || emptyProfile;

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Formulario de perfil profesional (persistido en Firestore al salir del campo)
  const [profileForm, setProfileForm] = useState<ProfessionalProfile>(professional);
  const saveProfile = () => {
    updateProfessionalProfile(profileForm).catch((e) => console.error('No se pudo guardar el perfil', e));
  };

  // Estados para Chat de Estudio (Stage 2)
  const [studyMessages, setStudyMessages] = useState<Message[]>([
    { role: 'model', text: `¡Bienvenido a tu zona de estudio personalizada! He analizado tu perfil y veo que tienes experiencia en ${professional.industry || 'tu sector'}. Adaptaré los ejemplos de la guía de ${licenciatura} a tu entorno laboral actual. ¿Te parece bien si comenzamos con el primer módulo o tienes alguna duda específica?` }
  ]);
  const [studyInput, setStudyInput] = useState('');
  const [isStudyTyping, setIsStudyTyping] = useState(false);

  // Estados para Chat de Memoria (Stage 3)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `¡Hola ${prof.name}! Vamos a redactar tu Memoria Descriptiva. Tu rol como ${professional.currentRole || 'profesional'} será clave para el desarrollo técnico de este documento.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Guías (temarios) cargadas desde Firestore
  const [guides, setGuides] = useState<Record<string, string>>({});
  const [selectedAdminLic, setSelectedAdminLic] = useState(LICENCIATURAS[0]);
  const [guideEditorContent, setGuideEditorContent] = useState('');
  const [isSavingGuide, setIsSavingGuide] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'guides'));
        const map: Record<string, string> = {};
        snap.forEach((d) => {
          const data = d.data() as { content?: string };
          map[d.id] = data.content || '';
        });
        setGuides(map);
      } catch (e) {
        console.error('No se pudieron cargar las guías', e);
      }
    })();
  }, []);

  useEffect(() => {
    setGuideEditorContent(guides[selectedAdminLic] || '');
  }, [selectedAdminLic, guides]);

  const handleSaveGuide = async () => {
    setIsSavingGuide(true);
    try {
      await setDoc(doc(db, 'guides', selectedAdminLic), {
        licenciatura: selectedAdminLic,
        content: guideEditorContent,
        lastUpdated: serverTimestamp(),
      });
      setGuides((prev) => ({ ...prev, [selectedAdminLic]: guideEditorContent }));
      const notification = document.createElement('div');
      notification.className = "fixed bottom-8 right-8 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4";
      notification.innerHTML = `<div class="flex items-center gap-2"><span class="font-bold">✓ Guía Guardada:</span> ${selectedAdminLic}</div>`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (e) {
      console.error('No se pudo guardar la guía', e);
      alert('No se pudo guardar la guía. Verifica que tengas permisos de administrador.');
    } finally {
      setIsSavingGuide(false);
    }
  };

  const handleSendStudyMessage = async () => {
    if (!studyInput.trim() || isStudyTyping) return;
    const userMsg: Message = { role: 'user', text: studyInput };
    const newMessages = [...studyMessages, userMsg];
    setStudyMessages(newMessages);
    setStudyInput('');
    setIsStudyTyping(true);

    const guideContent = guides[licenciatura] || 'No hay guía cargada aún.';
    const contextWithProfile = `El usuario es ${prof.name}, con ${professional.yearsExp || 'varios'} años de experiencia en ${professional.industry || 'su sector'} como ${professional.currentRole || 'profesional'}. \n\n ${guideContent}`;

    const response = await getStudyTutorResponse(newMessages, licenciatura, contextWithProfile);
    setStudyMessages([...newMessages, { role: 'model', text: response || 'Error al conectar con el tutor.' }]);
    setIsStudyTyping(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    const response = await getAIResponse(newMessages, licenciatura);
    setMessages([...newMessages, { role: 'model', text: response || 'Error al conectar.' }]);
    setIsTyping(false);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
      reader.onerror = error => reject(error);
    });
  };

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, {
    status: 'uploading' | 'verifying' | 'success' | 'error',
    fileName?: string,
    errorMsg?: string
  }>>({});

  const handleDocumentUpload = async (docId: string, docName: string, file: File) => {
    setUploadedDocs(prev => ({ ...prev, [docId]: { status: 'uploading', fileName: file.name } }));
    try {
      const base64 = await convertToBase64(file);
      const aiResult = await verifyDocumentWithAI(base64, file.type, docName);
      if (aiResult.isValid) {
        setUploadedDocs(prev => ({ ...prev, [docId]: { status: 'success', fileName: file.name } }));
      } else {
        setUploadedDocs(prev => ({ ...prev, [docId]: { status: 'error', errorMsg: aiResult.reason } }));
      }
    } catch (error) {
      setUploadedDocs(prev => ({ ...prev, [docId]: { status: 'error', errorMsg: 'Error de conexión.' } }));
    }
  };

  const requiredDocuments = [
    { id: 'ine_front', name: 'INE Anverso' },
    { id: 'ine_back', name: 'INE Reverso' },
    { id: 'curp', name: 'CURP Oficial' },
    { id: 'bachillerato', name: 'Certificado Bachillerato' }
  ];

  const currentStageInfo = STAGES_CONFIG[activeStage];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden relative font-sans">

      {/* Sidebar Principal */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2B5299] rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">I</div>
            <span className="font-bold text-xl tracking-tight text-[#2B5299]">INEVAP</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {STAGES_CONFIG.map((stage, idx) => (
            <button
              key={stage.id}
              onClick={() => { setActiveStage(idx); setIsAdminMode(false); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all
                ${activeStage === idx && !isAdminMode ? 'bg-[#2B5299] text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-100'}
              `}
            >
              <div className={`${activeStage === idx && !isAdminMode ? 'text-white' : 'text-[#2B5299]'}`}>{stage.icon}</div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold leading-none mb-1 ${activeStage === idx && !isAdminMode ? 'text-white' : 'text-slate-800'}`}>{stage.title}</p>
                <p className={`text-[10px] uppercase tracking-wider font-semibold ${activeStage === idx && !isAdminMode ? 'text-blue-200' : 'text-slate-400'}`}>Etapa {idx + 1}</p>
              </div>
            </button>
          ))}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => { setIsAdminMode(true); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all
                  ${isAdminMode ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}
                `}
              >
                <Settings size={20} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold leading-none mb-1">Administración</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Carga de Guías</p>
                </div>
              </button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#2B5299] shrink-0"><UserIcon size={20} /></div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-800">{prof.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{prof.email}</p>
            </div>
            <button onClick={() => logout()} title="Cerrar sesión" className="p-2 text-slate-300 hover:text-red-500 transition-all"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-50 rounded-xl border border-slate-100"><Menu size={24} /></button>
            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-bold text-slate-800">{isAdminMode ? 'Gestión de Guías Oficiales' : currentStageInfo.title}</h1>
              {!isAdminMode && <p className="hidden md:block text-xs text-slate-500 mt-0.5">{currentStageInfo.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
             {isAdminMode && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Admin Access</span>}
             <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Bell size={20} /></button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30">
          <div className="max-w-6xl mx-auto h-full pb-12">

            {isAdminMode && isAdmin ? (
              /* PANEL DE ADMINISTRACIÓN DE GUÍAS */
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col">
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3">
                      <Database size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cerebro Central INEVAP</h2>
                      <p className="text-sm text-slate-500">Carga el conocimiento base para alimentar al Tutor IA de los alumnos.</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-6 overflow-y-auto">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Carrera</label>
                    <div className="space-y-2">
                      {LICENCIATURAS.map(lic => (
                        <button
                          key={lic}
                          onClick={() => setSelectedAdminLic(lic)}
                          className={`w-full p-4 rounded-2xl text-xs font-bold text-left transition-all border flex items-center justify-between
                            ${selectedAdminLic === lic ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200/50'}
                          `}
                        >
                          {lic}
                          {guides[lic] && <Zap size={12} className="text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-8 flex flex-col gap-6">
                    <textarea
                      value={guideEditorContent}
                      onChange={(e) => setGuideEditorContent(e.target.value)}
                      placeholder="Carga aquí el temario y bibliografía..."
                      className="flex-1 w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-mono text-sm leading-relaxed resize-none shadow-inner"
                    />
                    <button
                      onClick={handleSaveGuide}
                      disabled={isSavingGuide}
                      className="bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-sm disabled:opacity-50"
                    >
                      {isSavingGuide ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Guardar Conocimiento Base
                    </button>
                  </div>
                </div>
              </div>
            ) : activeStage === 0 ? (
              /* ETAPA 0: ADMISIÓN Y PERFILAMIENTO */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Columna de Documentos */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-200">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <ClipboardCheck className="text-[#2B5299]" size={28} />
                            Expediente Digital
                          </h2>
                          <p className="text-slate-500 text-sm mt-1 font-medium">Sube tus documentos oficiales para validación inmediata por IA.</p>
                        </div>
                        <div className="hidden sm:flex bg-blue-50 text-[#2B5299] px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 items-center gap-2">
                          <ShieldCheck size={14} /> Sistema Cifrado
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {requiredDocuments.map(doc => {
                          const status = uploadedDocs[doc.id]?.status;
                          return (
                            <label key={doc.id} className={`
                              relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 min-h-[160px]
                              ${status === 'success' ? 'border-emerald-200 bg-emerald-50/20' :
                                status === 'uploading' ? 'border-blue-300 bg-blue-50/40 animate-pulse' :
                                status === 'error' ? 'border-red-200 bg-red-50/20' :
                                'border-slate-200 bg-slate-50/50 hover:border-[#2B5299] hover:bg-blue-50/10'}
                            `}>
                              <input
                                type="file" className="hidden"
                                onChange={(e) => e.target.files && handleDocumentUpload(doc.id, doc.name, e.target.files[0])}
                                disabled={status === 'success' || status === 'uploading'}
                              />
                              {status === 'success' ? (
                                <div className="text-center animate-in zoom-in-50 duration-500">
                                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-emerald-200">
                                    <CheckCircle2 size={24} />
                                  </div>
                                  <p className="text-[10px] font-black text-emerald-700 uppercase">{doc.name}</p>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Validado ✓</span>
                                </div>
                              ) : status === 'uploading' ? (
                                <div className="text-center">
                                  <Loader2 className="animate-spin text-blue-600 mb-2 mx-auto" />
                                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Analizando...</p>
                                </div>
                              ) : (
                                <>
                                  <UploadCloud className="text-slate-300 mb-3" size={32} />
                                  <p className="text-xs font-bold text-slate-700">{doc.name}</p>
                                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">Formatos PDF o JPG</p>
                                  {status === 'error' && <p className="text-[9px] text-red-500 mt-2 text-center font-bold">{uploadedDocs[doc.id]?.errorMsg}</p>}
                                </>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Columna de Perfilamiento */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-gradient-to-br from-[#2B5299] to-blue-800 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                          <Briefcase size={28} className="text-blue-200" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight uppercase">ADN Profesional</h2>
                        <p className="text-blue-100/70 text-sm mb-8 font-medium leading-relaxed">Esta información permitirá que tu Tutor IA personalice cada lección según tu trayectoria real.</p>

                        <div className="space-y-5">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2 block">Años de Experiencia</label>
                            <input
                              type="number"
                              value={profileForm.yearsExp}
                              onChange={(e) => setProfileForm(f => ({ ...f, yearsExp: e.target.value }))}
                              onBlur={saveProfile}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:bg-white/10 transition-all font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2 block">Puesto Actual</label>
                            <input
                              type="text"
                              value={profileForm.currentRole}
                              onChange={(e) => setProfileForm(f => ({ ...f, currentRole: e.target.value }))}
                              onBlur={saveProfile}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:bg-white/10 transition-all font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2 block">Industria / Sector</label>
                            <input
                              type="text"
                              value={profileForm.industry}
                              onChange={(e) => setProfileForm(f => ({ ...f, industry: e.target.value }))}
                              onBlur={saveProfile}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:bg-white/10 transition-all font-bold"
                            />
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                           <Sparkles size={20} className="text-amber-400" />
                           <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest italic">Perfil alimentado a la IA de Estudio</p>
                        </div>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeStage === 2 ? (
              /* SECCIÓN DE ESTUDIO (TUTOR IA ADAPTATIVO) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[700px] animate-in slide-in-from-bottom-6 duration-700">
                <div className="lg:col-span-8 flex flex-col h-full">
                  <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-200 flex flex-col h-full overflow-hidden transition-all">
                    <div className="p-6 md:p-8 border-b border-slate-100 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-100 rotate-[-4deg]">
                          <BrainCircuit size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">Tutor Inteligente INEVAP</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">IA Adaptativa en línea • Contexto de {professional.industry || 'tu sector'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/20 custom-scrollbar">
                      {studyMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                          <div className={`max-w-[85%] md:max-w-[75%] p-5 md:p-6 rounded-[2rem] text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap
                            ${msg.role === 'user'
                              ? 'bg-[#2B5299] text-white rounded-br-none shadow-blue-200'
                              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}
                          `}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isStudyTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-slate-100 p-6 rounded-[2rem] rounded-bl-none flex items-center gap-4 shadow-xl shadow-slate-100 animate-pulse">
                            <div className="flex gap-1.5">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></span>
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Generando respuesta...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 md:p-8 border-t border-slate-100 bg-white">
                      <div className="flex gap-4 bg-slate-50 p-2 rounded-[2rem] border-2 border-slate-100 focus-within:border-emerald-200 focus-within:ring-8 focus-within:ring-emerald-50 transition-all">
                        <input
                          type="text"
                          value={studyInput}
                          onChange={(e) => setStudyInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendStudyMessage()}
                          placeholder="Escribe tu respuesta aquí..."
                          className="flex-1 bg-transparent px-6 py-3 text-sm outline-none font-medium placeholder:text-slate-400"
                        />
                        <button
                          onClick={handleSendStudyMessage}
                          disabled={isStudyTyping || !studyInput.trim()}
                          className="bg-emerald-600 text-white w-14 h-14 rounded-[1.2rem] hover:bg-emerald-700 transition-all disabled:opacity-30 flex items-center justify-center shadow-lg active:scale-95 shrink-0"
                        >
                          <Send size={22} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <Zap size={14} className="text-amber-500" /> Rendimiento Cognitivo
                    </h4>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between text-[11px] font-black mb-3 text-slate-700 uppercase tracking-tight">
                          <span>Dominio del Temario</span>
                          <span className="text-emerald-600">24%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full w-[24%] transition-all duration-1000"></div>
                        </div>
                      </div>
                      <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                        <div className="flex items-center gap-3 text-emerald-700 mb-3">
                          <GraduationCap size={20} />
                          <span className="text-xs font-black tracking-widest uppercase">Análisis IA</span>
                        </div>
                        <p className="text-xs text-emerald-800/80 leading-relaxed font-medium italic">
                          "Hemos detectado que tu fuerte es la Estrategia en {professional.industry || 'tu sector'}. La guía se ha adaptado automáticamente."
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#2B5299] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <h4 className="font-black text-2xl mb-3 uppercase tracking-tighter">Certificación</h4>
                    <p className="text-blue-100/70 text-sm leading-relaxed font-medium">Estás a un paso de validar oficialmente tu trayectoria como profesional.</p>
                  </div>
                </div>
              </div>
            ) : activeStage === 3 ? (
              /* SECCIÓN DE MEMORIA */
              <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col h-[700px] overflow-hidden">
                 <div className="p-8 border-b border-slate-100 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#2B5299] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl rotate-[-4deg]">
                      <MessageSquare size={26} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Redacción de Memoria IA</h3>
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Perfil: {professional.currentRole || 'Profesional'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/20 custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[75%] p-6 rounded-[2rem] text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap
                        ${msg.role === 'user' ? 'bg-[#2B5299] text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}
                      `}>{msg.text}</div>
                    </div>
                  ))}
                  {isTyping && <div className="p-6 bg-white border border-slate-100 rounded-2xl animate-pulse">Analizando...</div>}
                </div>
                <div className="p-8 border-t border-slate-100 bg-white">
                   <div className="flex gap-4 bg-slate-50 p-2 rounded-[2rem] border-2 border-slate-100">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Explica tus logros..."
                      className="flex-1 bg-transparent px-6 py-3 text-sm outline-none font-medium"
                    />
                    <button onClick={handleSendMessage} className="bg-[#2B5299] text-white w-14 h-14 rounded-[1.2rem] flex items-center justify-center"><Send size={22} /></button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-300 mb-8 border border-slate-100">{currentStageInfo.icon}</div>
                <h3 className="text-3xl font-black text-slate-800 mb-4">{currentStageInfo.title}</h3>
                <p className="text-slate-500 max-w-md text-lg">{currentStageInfo.description}</p>
                <span className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-300">Próximamente</span>
              </div>
            )}
          </div>
        </section>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const { loading, firebaseUser, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#2B5299]" size={40} />
      </div>
    );
  }

  if (!firebaseUser) {
    return <AuthScreen />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 text-center px-6">
        <Loader2 className="animate-spin text-[#2B5299]" size={32} />
        <p className="text-sm text-slate-500 font-medium">Preparando tu portal...</p>
      </div>
    );
  }

  return <Portal />;
};

export default App;
