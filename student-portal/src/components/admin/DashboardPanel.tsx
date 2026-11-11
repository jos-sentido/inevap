import React, { useEffect, useState } from 'react';
import { Loader2, Users, TrendingUp, Trophy, XCircle, Wallet, PiggyBank } from 'lucide-react';
import { authedGetJSON } from '../../lib/api';

interface Tally { label: string; count: number }
interface Campaign { campaign: string; registros: number; inscritos: number; abonado: number; conversion: number }
interface Rep { name: string; asignados: number; inscritos: number }
interface Data {
  registros: number; inscritos: number; perdidos: number; activos: number; conversion: number;
  abonadoTotal: number; esperadoTotal: number; porCobrar: number; conPlan: number;
  stages: Tally[]; lostReasons: Tally[]; wonReasons: Tally[]; campaigns: Campaign[]; reps: Rep[];
}

const money = (n: number) => (n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const pct = (n: number) => `${Math.round((n || 0) * 100)}%`;

const KPI: React.FC<{ icon: React.ReactNode; label: string; value: string; tone?: string }> = ({ icon, label, value, tone = 'text-[#2B5299]' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
    <div className={`flex items-center gap-2 ${tone} mb-2`}>{icon}<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span></div>
    <p className={`text-2xl font-black ${tone}`}>{value}</p>
  </div>
);

const DashboardPanel: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    authedGetJSON<Data>('/api/crm/dashboard')
      .then(setData).catch((e) => { console.error(e); setError('No se pudo cargar el dashboard.'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#2B5299]" size={28} /></div>;
  if (error || !data) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl px-5 py-3">{error || 'Sin datos'}</div>;

  const maxStage = Math.max(1, ...data.stages.map((s) => s.count));
  const cobranzaPct = data.esperadoTotal > 0 ? data.abonadoTotal / data.esperadoTotal : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dashboard del embudo</h2>
        <p className="text-sm text-slate-500">Registros, conversión, cobranza y desempeño de ventas.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={<Users size={16} />} label="Registros" value={String(data.registros)} />
        <KPI icon={<Trophy size={16} />} label="Inscritos" value={String(data.inscritos)} tone="text-emerald-600" />
        <KPI icon={<TrendingUp size={16} />} label="Conversión" value={pct(data.conversion)} />
        <KPI icon={<XCircle size={16} />} label="Perdidos" value={String(data.perdidos)} tone="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo por etapa */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-black text-slate-800 mb-4">Prospectos por etapa</h3>
          <div className="space-y-2.5">
            {data.stages.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-28 text-xs font-bold text-slate-500 shrink-0">{i}. {s.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#2B5299] to-blue-500 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(6, (s.count / maxStage) * 100)}%` }}>
                    <span className="text-[10px] font-black text-white">{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cobranza (agnóstica al proveedor) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-black text-slate-800 mb-4">Cobranza</h3>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-emerald-700 mb-1"><PiggyBank size={15} /><span className="text-[10px] font-black uppercase tracking-widest">Abonado</span></div>
              <p className="text-xl font-black text-emerald-700">{money(data.abonadoTotal)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-amber-700 mb-1"><Wallet size={15} /><span className="text-[10px] font-black uppercase tracking-widest">Por cobrar</span></div>
              <p className="text-xl font-black text-amber-700">{money(data.porCobrar)}</p>
            </div>
          </div>
          {data.esperadoTotal > 0 && (
            <>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>Avance de cobranza</span><span>{pct(cobranzaPct)}</span>
              </div>
              <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, cobranzaPct * 100)}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Esperado total {money(data.esperadoTotal)} · {data.conPlan} con plan activo</p>
            </>
          )}
          {data.esperadoTotal === 0 && (
            <p className="text-xs text-slate-400">El total esperado se calcula cuando los alumnos activan su plan de pagos en Quentli.</p>
          )}
        </div>
      </div>

      {/* Ventas por campaña (UTM) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-black text-slate-800 mb-4">Desempeño por campaña (UTM)</h3>
        {data.campaigns.length === 0 ? (
          <p className="text-sm text-slate-400">Sin datos de atribución todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-2">Campaña</th>
                  <th className="text-right pb-2">Registros</th>
                  <th className="text-right pb-2">Inscritos</th>
                  <th className="text-right pb-2">Conv.</th>
                  <th className="text-right pb-2">Abonado</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.campaign} className="border-b border-slate-50">
                    <td className="py-2.5 font-bold text-slate-700">{c.campaign}</td>
                    <td className="py-2.5 text-right text-slate-600">{c.registros}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">{c.inscritos}</td>
                    <td className="py-2.5 text-right text-slate-600">{pct(c.conversion)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-700">{money(c.abonado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ventas por vendedor + motivos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-black text-slate-800 mb-4">Por vendedor</h3>
          {data.reps.length === 0 ? <p className="text-sm text-slate-400">Sin asignaciones.</p> : (
            <div className="space-y-3">
              {data.reps.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{r.name}</span>
                  <span className="text-xs text-slate-500"><b className="text-emerald-600">{r.inscritos}</b> / {r.asignados}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ReasonList title="Motivos de pérdida" items={data.lostReasons} tone="text-red-500" />
        <ReasonList title="Motivos de ganado" items={data.wonReasons} tone="text-emerald-600" />
      </div>
    </div>
  );
};

const ReasonList: React.FC<{ title: string; items: Tally[]; tone: string }> = ({ title, items, tone }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
    <h3 className="font-black text-slate-800 mb-4">{title}</h3>
    {items.length === 0 ? <p className="text-sm text-slate-400">Sin registros.</p> : (
      <div className="space-y-2.5">
        {items.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{r.label}</span>
            <span className={`text-sm font-black ${tone}`}>{r.count}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default DashboardPanel;
