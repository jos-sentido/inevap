import React, { useState } from 'react';
import { Users, CalendarDays, Database } from 'lucide-react';
import StudentsPanel from './StudentsPanel';
import ExamsPanel from './ExamsPanel';
import GuidesPanel from './GuidesPanel';

type Tab = 'alumnos' | 'examenes' | 'temarios';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'alumnos', label: 'Alumnos', icon: <Users size={16} /> },
  { id: 'examenes', label: 'Exámenes', icon: <CalendarDays size={16} /> },
  { id: 'temarios', label: 'Temarios', icon: <Database size={16} /> },
];

const AdminConsole: React.FC = () => {
  const [tab, setTab] = useState<Tab>('alumnos');
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === 'alumnos' && <StudentsPanel />}
      {tab === 'examenes' && <ExamsPanel />}
      {tab === 'temarios' && <GuidesPanel />}
    </div>
  );
};

export default AdminConsole;
