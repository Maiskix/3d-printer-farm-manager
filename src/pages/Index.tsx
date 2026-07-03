import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import FilamentsTab from '@/components/tabs/FilamentsTab';
import PrintersTab from '@/components/tabs/PrintersTab';
import CalculatorTab from '@/components/tabs/CalculatorTab';
import StatsTab from '@/components/tabs/StatsTab';
import {
  useStore,
  ДЕФОЛТЫ,
  Принтер,
  Катушка,
  ЗадачаТО,
  Запчасть,
  Печать,
  Настройки,
} from '@/lib/useStore';

type Вкладка = 'filaments' | 'printers' | 'calculator' | 'stats';

const ВКЛАДКИ: { key: Вкладка; label: string; icon: string }[] = [
  { key: 'filaments', label: 'Катушки', icon: 'Disc3' },
  { key: 'printers', label: 'Принтеры', icon: 'Server' },
  { key: 'calculator', label: 'Калькулятор', icon: 'Calculator' },
  { key: 'stats', label: 'Статистика', icon: 'BarChart3' },
];

export default function Index() {
  const [dark, setDark] = useState(false);
  const [вкладка, setВкладка] = useState<Вкладка>('filaments');

  const [принтеры, setПринтеры] = useStore<Принтер[]>('af_printers', ДЕФОЛТЫ.принтеры);
  const [катушки, setКатушки] = useStore<Катушка[]>('af_filaments', ДЕФОЛТЫ.катушки);
  const [то, setТО] = useStore<ЗадачаТО[]>('af_maintenance', ДЕФОЛТЫ.то);
  const [запчасти, setЗапчасти] = useStore<Запчасть[]>('af_parts', ДЕФОЛТЫ.запчасти);
  const [журнал] = useStore<Печать[]>('af_jobs', ДЕФОЛТЫ.журнал);
  const [настройки, setНастройки] = useStore<Настройки>('af_settings', ДЕФОЛТЫ.настройки);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const экспортCSV = () => {
    const строки = [
      ['Раздел', 'Данные'],
      ...принтеры.map((p) => ['Принтер', JSON.stringify(p)]),
      ...катушки.map((k) => ['Катушка', JSON.stringify(k)]),
      ...журнал.map((j) => ['Печать', JSON.stringify(j)]),
    ];
    const csv = строки.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm_backup_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* ШАПКА */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-farm-blue">
              <Icon name="Boxes" className="text-white" size={18} />
            </div>
            <div>
              <h1 className="font-display text-base font-light leading-none text-foreground">
                Ферма <span className="font-medium text-farm-blue">принтеров</span>
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {принтеры.length} станков
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={экспортCSV}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-transform active:scale-90 hover:text-farm-blue"
              title="Экспорт CSV"
            >
              <Icon name="Download" size={17} />
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-transform active:scale-90 hover:text-farm-blue"
            >
              <Icon name={dark ? 'Sun' : 'Moon'} size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {вкладка === 'filaments' && <FilamentsTab катушки={катушки} setКатушки={setКатушки} />}
        {вкладка === 'printers' && (
          <PrintersTab
            принтеры={принтеры}
            setПринтеры={setПринтеры}
            то={то}
            setТО={setТО}
            запчасти={запчасти}
            setЗапчасти={setЗапчасти}
          />
        )}
        {вкладка === 'calculator' && (
          <CalculatorTab катушки={катушки} принтеры={принтеры} настройки={настройки} setНастройки={setНастройки} />
        )}
        {вкладка === 'stats' && <StatsTab журнал={журнал} принтеры={принтеры} катушки={катушки} />}
      </main>

      {/* НИЖНЯЯ НАВИГАЦИЯ */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
          {ВКЛАДКИ.map((t) => (
            <button
              key={t.key}
              onClick={() => setВкладка(t.key)}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-transform active:scale-90"
            >
              <Icon
                name={t.icon}
                size={20}
                className={вкладка === t.key ? 'text-farm-blue' : 'text-muted-foreground'}
              />
              <span className={`text-[10px] uppercase tracking-wide ${вкладка === t.key ? 'font-medium text-farm-blue' : 'text-muted-foreground'}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
