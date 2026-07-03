import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import Icon from '@/components/ui/icon';
import { Печать, Принтер, Катушка } from '@/lib/useStore';
import { число } from '@/lib/parseNumber';

interface Props {
  журнал: Печать[];
  принтеры: Принтер[];
  катушки: Катушка[];
}

const ПАЛИТРА = ['#1565C0', '#26C6DA', '#5C6BC0', '#00ACC1', '#7986CB'];

export default function StatsTab({ журнал, принтеры, катушки }: Props) {
  const [фильтр, setФильтр] = useState<'все' | 'успех' | 'провал'>('все');

  const успешность = useMemo(() => {
    const успех = журнал.filter((j) => j.status === 'успех').length;
    return журнал.length ? Math.round((успех / журнал.length) * 100) : 0;
  }, [журнал]);

  const затраты = useMemo(
    () => журнал.reduce((sum, j) => sum + число(j.costFilament, 0) + число(j.costEnergy, 0), 0),
    [журнал],
  );

  const расходПоТипу = useMemo(() => {
    const группы: Record<string, number> = {};
    катушки.forEach((k) => {
      const использовано = число(k.totalWeight, 0) - число(k.currentWeight, 0);
      группы[k.type] = (группы[k.type] || 0) + использовано;
    });
    return Object.entries(группы).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [катушки]);

  const часыПоПринтерам = useMemo(
    () => принтеры.map((p) => ({ name: p.name, часы: число(p.totalHours, 0) })),
    [принтеры],
  );

  const отфильтрованныйЖурнал = журнал.filter((j) => фильтр === 'все' || j.status === фильтр);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="font-display text-2xl font-light text-foreground">Статистика</h2>
        <p className="text-xs text-muted-foreground">Финансы и производительность фермы</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Карточка icon="TrendingUp" label="Успешность" value={`${успешность}%`} />
        <Карточка icon="Wallet" label="Затраты всего" value={`₽${затраты.toFixed(0)}`} />
      </div>

      {расходПоТипу.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Расход по типам пластика</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={расходПоТипу} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {расходПоТипу.map((_, i) => (
                    <Cell key={i} fill={ПАЛИТРА[i % ПАЛИТРА.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} г`, 'Расход']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {расходПоТипу.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ПАЛИТРА[i % ПАЛИТРА.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {часыПоПринтерам.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Моточасы по принтерам</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={часыПоПринтерам}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#777777' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#777777' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="часы" fill="#1565C0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ЖУРНАЛ ПЕЧАТЕЙ */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Журнал печатей</p>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {(['все', 'успех', 'провал'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setФильтр(f)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase transition-colors ${
                  фильтр === f ? 'bg-card text-farm-blue shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {отфильтрованныйЖурнал.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
            <Icon name="ScrollText" size={28} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Нет записей.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {отфильтрованныйЖурнал.map((j) => (
              <div key={j.id} className="flex items-center justify-between rounded-2xl bg-card p-3.5 shadow-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{j.model}.gcode</p>
                  <p className="text-[11px] text-muted-foreground">{j.printerName} • {j.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-foreground">{число(j.weightUsed, 0)}г</p>
                  <p className="font-mono text-[11px] text-muted-foreground">₽{(число(j.costFilament, 0) + число(j.costEnergy, 0)).toFixed(0)}</p>
                </div>
                <span className={`ml-3 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium uppercase ${
                  j.status === 'успех' ? 'bg-farm-teal/15 text-farm-teal' : 'bg-destructive/15 text-destructive'
                }`}>
                  <Icon name={j.status === 'успех' ? 'Check' : 'X'} size={10} />
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Карточка({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon name={icon} size={16} className="text-farm-blue" />
      </div>
      <p className="font-mono text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}