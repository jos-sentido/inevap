import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Database, Save, Zap, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { LICENCIATURAS } from '../../constants';

const GuidesPanel: React.FC = () => {
  const [guides, setGuides] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState(LICENCIATURAS[0]);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'guides'));
      const map: Record<string, string> = {};
      snap.forEach((d) => (map[d.id] = (d.data() as any).content || ''));
      setGuides(map);
    })();
  }, []);

  useEffect(() => setContent(guides[selected] || ''), [selected, guides]);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'guides', selected), { licenciatura: selected, content, lastUpdated: serverTimestamp() });
      setGuides((p) => ({ ...p, [selected]: content }));
    } catch {
      alert('No se pudo guardar. ¿Tienes permisos de administrador?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[70vh]">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3"><Database size={24} /></div>
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cerebro Central</h2>
          <p className="text-sm text-slate-500">Temario base que alimenta al Tutor IA.</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4 overflow-y-auto space-y-2">
          {LICENCIATURAS.map((lic) => (
            <button key={lic} onClick={() => setSelected(lic)}
              className={`w-full p-3 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between ${selected === lic ? 'bg-white border-indigo-600 text-indigo-600 shadow' : 'border-transparent text-slate-500 hover:bg-slate-200/50'}`}>
              {lic}{guides[lic] && <Zap size={12} className="text-amber-500" />}
            </button>
          ))}
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Carga aquí el temario y bibliografía..."
            className="flex-1 w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-mono text-sm resize-none" />
          <button onClick={save} disabled={saving}
            className="bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar temario
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidesPanel;
