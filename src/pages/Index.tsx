import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

// ==================== ДАННЫЕ ФЕРМЫ ====================

const ПРИНТЕРЫ = [
  {
    id: 1,
    name: 'APERTURE-01',
    model: 'Voron 2.4',
    status: 'печать',
    progress: 67,
    nozzle: 245,
    bed: 100,
    ip: '192.168.1.101',
    hours: 1284,
    job: 'aperture_cube.gcode',
    eta: '01:42',
  },
  {
    id: 2,
    name: 'APERTURE-02',
    model: 'Ender 3 V3',
    status: 'простой',
    progress: 0,
    nozzle: 24,
    bed: 23,
    ip: '192.168.1.102',
    hours: 842,
    job: '—',
    eta: '—',
  },
  {
    id: 3,
    name: 'APERTURE-03',
    model: 'Prusa MK4',
    status: 'пауза',
    progress: 34,
    nozzle: 210,
    bed: 60,
    ip: '192.168.1.103',
    hours: 2013,
    job: 'turret_body.gcode',
    eta: '03:15',
  },
  {
    id: 4,
    name: 'APERTURE-04',
    model: 'Bambu X1C',
    status: 'ошибка',
    progress: 12,
    nozzle: 0,
    bed: 0,
    ip: '192.168.1.104',
    hours: 456,
    job: 'companion_cube.gcode',
    eta: '—',
  },
];

const КАТУШКИ = [
  { id: 1, brand: 'eSun', type: 'PLA+', color: '#FF6B00', remain: 82, weightG: 820 },
  { id: 2, brand: 'Polymaker', type: 'PETG', color: '#4FC3F7', remain: 45, weightG: 450 },
  { id: 3, brand: 'Bambu', type: 'ABS', color: '#2C2C2C', remain: 18, weightG: 180 },
  { id: 4, brand: 'SUNLU', type: 'TPU', color: '#7CB342', remain: 91, weightG: 910 },
];

const ТО = [
  { id: 1, task: 'Смазка направляющих', printer: 'APERTURE-01', due: 84, total: 100 },
  { id: 2, task: 'Замена сопла', printer: 'APERTURE-03', due: 96, total: 100 },
  { id: 3, task: 'Натяжение ремней', printer: 'APERTURE-02', due: 42, total: 100 },
  { id: 4, task: 'Замена фильтра', printer: 'APERTURE-04', due: 12, total: 100 },
];

const ЗАПЧАСТИ = [
  { id: 1, name: 'Сопло 0.4мм латунь', qty: 8, min: 5 },
  { id: 2, name: 'Ремень GT2 6мм', qty: 2, min: 3 },
  { id: 3, name: 'Подшипник 608ZZ', qty: 14, min: 8 },
  { id: 4, name: 'Вентилятор 4010', qty: 1, min: 2 },
];

const ЖУРНАЛ = [
  { id: 1, model: 'aperture_cube', date: '03.07', weight: 42, cost: 18, status: 'успех' },
  { id: 2, model: 'companion_cube', date: '02.07', weight: 128, cost: 54, status: 'провал' },
  { id: 3, model: 'turret_body', date: '01.07', weight: 210, cost: 89, status: 'успех' },
  { id: 4, model: 'portal_gun', date: '29.06', weight: 356, cost: 151, status: 'успех' },
];

const СТАТУС_ЦВЕТ: Record<string, string> = {
  'печать': 'text-aperture-orange',
  'пауза': 'text-aperture-blue',
  'простой': 'text-muted-foreground',
  'ошибка': 'text-red-500',
};

const GLADOS = [
  'СИСТЕМА APERTURE SCIENCE ГОТОВА К ИСПЫТАНИЯМ.',
  'ПЕЧАТЬ ЗАВЕРШЕНА. ОЖИДАНИЕ СЛЕДУЮЩЕГО ИСПЫТАНИЯ.',
  'ОБНАРУЖЕН НИЗКИЙ УРОВЕНЬ ПЛАСТИКА. НЕ ПАНИКУЙТЕ.',
  'МОНИТОРИНГ ФЕРМЫ АКТИВЕН. ХОРОШЕЙ РАБОТЫ, ЧЕЛОВЕК.',
];

// ==================== КРУГОВОЙ ИНДИКАТОР ====================

function Кольцо({ value, color, size = 76 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="6" fill="none" className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="6"
          fill="none"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">
        {value}%
      </span>
    </div>
  );
}

// ==================== ГЛАВНАЯ ====================

export default function Index() {
  const [dark, setDark] = useState(true);
  const [glados, setGlados] = useState(0);
  const [selected, setSelected] = useState<number | null>(1);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const t = setInterval(() => setGlados((g) => (g + 1) % GLADOS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const активных = ПРИНТЕРЫ.filter((p) => p.status === 'печать').length;
  const катушекНизко = КАТУШКИ.filter((k) => k.remain < 20).length;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ШАПКА */}
      <header className="sticky top-0 z-20 border-b-2 border-aperture-orange bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-aperture-orange">
              <Icon name="Aperture" className="text-aperture-orange animate-pulse-glow" size={22} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold uppercase tracking-widest leading-none">
                Aperture <span className="text-aperture-orange">Farm</span>
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Центр управления • {ПРИНТЕРЫ.length} станков
              </p>
            </div>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-transform active:scale-95 hover:border-aperture-orange"
          >
            <Icon name={dark ? 'Sun' : 'Moon'} size={18} />
          </button>
        </div>
        {/* GLaDOS строка */}
        <div className="relative overflow-hidden border-t border-border bg-aperture-orange/10 px-4 py-1.5">
          <p key={glados} className="animate-fade-in font-mono text-[11px] uppercase tracking-wider text-aperture-orange">
            <Icon name="Radio" size={11} className="mr-2 inline animate-pulse-glow" />
            {GLADOS[glados]}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* СВОДКА */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Активны', value: активных, unit: 'печатают', icon: 'Printer', color: 'text-aperture-orange' },
            { label: 'Катушки', value: КАТУШКИ.length, unit: `${катушекНизко} на исходе`, icon: 'Disc3', color: 'text-aperture-blue' },
            { label: 'Моточасы', value: '4.5k', unit: 'всего', icon: 'Clock', color: 'text-foreground' },
            { label: 'Прибыль', value: '₽12.4k', unit: 'за месяц', icon: 'TrendingUp', color: 'text-green-500' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="animate-fade-in rounded-md border border-border bg-card p-4 shadow-sm"
              style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <Icon name={s.icon} size={16} className={s.color} />
              </div>
              <p className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">{s.unit}</p>
            </div>
          ))}
        </section>

        {/* ПРИНТЕРЫ */}
        <section>
          <Заголовок icon="Server" text="Принтеры" />
          <div className="grid gap-3 md:grid-cols-2">
            {ПРИНТЕРЫ.map((p, i) => (
              <div
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`animate-fade-in cursor-pointer rounded-md border-2 bg-card p-4 shadow-sm transition-all active:scale-[0.98] ${
                  selected === p.id ? 'border-aperture-orange' : 'border-border hover:border-aperture-blue'
                }`}
                style={{ animationDelay: `${i * 70}ms`, opacity: 0 }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide leading-none">{p.name}</h3>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.model} • {p.ip}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase ${СТАТУС_ЦВЕТ[p.status]}`}>
                    <span className={`h-2 w-2 rounded-full ${p.status === 'печать' ? 'animate-pulse-glow' : ''} ${
                      p.status === 'печать' ? 'bg-aperture-orange' : p.status === 'пауза' ? 'bg-aperture-blue' : p.status === 'ошибка' ? 'bg-red-500' : 'bg-muted-foreground'
                    }`} />
                    {p.status}
                  </span>
                </div>

                {/* Прогресс */}
                <div className="mb-3">
                  <div className="mb-1 flex justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground truncate max-w-[60%]">{p.job}</span>
                    <span className="text-aperture-orange">{p.progress}% • {p.eta}</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-aperture-orange transition-all duration-700"
                      style={{ width: `${p.progress}%` }}
                    />
                    {p.status === 'печать' && (
                      <div className="absolute inset-0 w-1/3 animate-scan bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    )}
                  </div>
                </div>

                {/* Температуры */}
                <div className="mb-3 flex gap-4 font-mono text-[11px]">
                  <span className="flex items-center gap-1"><Icon name="Flame" size={13} className="text-aperture-orange" /> Сопло {p.nozzle}°</span>
                  <span className="flex items-center gap-1"><Icon name="Grid3x3" size={13} className="text-aperture-blue" /> Стол {p.bed}°</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Icon name="Clock" size={13} /> {p.hours}ч</span>
                </div>

                {/* Кнопки управления */}
                <div className="grid grid-cols-3 gap-2">
                  <КнопкаУпр icon="Play" text="Старт" cls="bg-aperture-orange text-white" />
                  <КнопкаУпр icon="Pause" text="Пауза" cls="bg-aperture-blue text-aperture-dark" />
                  <КнопкаУпр icon="Square" text="Стоп" cls="bg-muted text-foreground border border-border" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* КАТУШКИ */}
        <section>
          <Заголовок icon="Disc3" text="Катушки пластика" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {КАТУШКИ.map((k, i) => (
              <div
                key={k.id}
                className="animate-fade-in flex flex-col items-center rounded-md border border-border bg-card p-4 text-center shadow-sm"
                style={{ animationDelay: `${i * 70}ms`, opacity: 0 }}
              >
                <Кольцо value={k.remain} color={k.remain < 20 ? '#EF4444' : k.color} />
                <p className="mt-2 font-display text-sm font-semibold uppercase">{k.brand}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{k.type} • {k.weightG}г</p>
                {k.remain < 20 && (
                  <span className="mt-1 flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-red-500">
                    <Icon name="TriangleAlert" size={11} /> Низкий уровень
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ТО + ЗАПЧАСТИ */}
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <Заголовок icon="Wrench" text="График ТО" />
            <div className="space-y-2">
              {ТО.map((t, i) => (
                <div
                  key={t.id}
                  className="animate-fade-in rounded-md border border-border bg-card p-3 shadow-sm"
                  style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[12px] font-medium">{t.task}</span>
                    <span className={`font-mono text-[11px] font-bold ${t.due > 90 ? 'text-red-500' : t.due > 75 ? 'text-aperture-orange' : 'text-muted-foreground'}`}>
                      {t.due}%
                    </span>
                  </div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase text-muted-foreground">{t.printer}</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${t.due > 90 ? 'bg-red-500' : t.due > 75 ? 'bg-aperture-orange' : 'bg-aperture-blue'}`}
                      style={{ width: `${t.due}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Заголовок icon="Package" text="Запчасти" />
            <div className="space-y-2">
              {ЗАПЧАСТИ.map((p, i) => (
                <div
                  key={p.id}
                  className="animate-fade-in flex items-center justify-between rounded-md border border-border bg-card p-3 shadow-sm"
                  style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Cog" size={16} className={p.qty < p.min ? 'text-red-500' : 'text-aperture-blue'} />
                    <span className="font-mono text-[12px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-bold ${p.qty < p.min ? 'text-red-500' : 'text-foreground'}`}>
                      {p.qty} шт
                    </span>
                    {p.qty < p.min && (
                      <p className="font-mono text-[9px] uppercase text-red-500">мин. {p.min}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ЖУРНАЛ ПЕЧАТЕЙ */}
        <section>
          <Заголовок icon="ScrollText" text="Журнал печатей" />
          <div className="overflow-x-auto rounded-md border border-border bg-card shadow-sm">
            <table className="w-full font-mono text-[12px]">
              <thead className="border-b border-border bg-muted/50">
                <tr className="text-left uppercase text-[10px] tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Модель</th>
                  <th className="px-3 py-2">Дата</th>
                  <th className="px-3 py-2 text-right">Вес</th>
                  <th className="px-3 py-2 text-right">Затраты</th>
                  <th className="px-3 py-2 text-center">Статус</th>
                </tr>
              </thead>
              <tbody>
                {ЖУРНАЛ.map((j, i) => (
                  <tr key={j.id} className="animate-fade-in border-b border-border/50 last:border-0" style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}>
                    <td className="px-3 py-2.5 font-medium">{j.model}.gcode</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{j.date}</td>
                    <td className="px-3 py-2.5 text-right">{j.weight}г</td>
                    <td className="px-3 py-2.5 text-right">₽{j.cost}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        j.status === 'успех' ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                      }`}>
                        <Icon name={j.status === 'успех' ? 'Check' : 'X'} size={10} />
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="border-t border-border pt-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Aperture Science • Farm Control System v0.1
          </p>
        </footer>
      </main>
    </div>
  );
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================

function Заголовок({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon name={icon} size={18} className="text-aperture-orange" />
      <h2 className="font-display text-lg font-semibold uppercase tracking-widest">{text}</h2>
      <div className="ml-2 h-px flex-1 bg-border" />
    </div>
  );
}

function КнопкаУпр({ icon, text, cls }: { icon: string; text: string; cls: string }) {
  return (
    <button
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center justify-center gap-1 rounded-sm py-2 font-display text-[12px] font-semibold uppercase tracking-wide transition-transform active:scale-95 ${cls}`}
    >
      <Icon name={icon} size={13} />
      {text}
    </button>
  );
}
