import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import ModalForm, { Поле } from '@/components/ModalForm';
import {
  useStore,
  ДЕФОЛТЫ,
  Принтер,
  Катушка,
  ЗадачаТО,
  Запчасть,
  Печать,
} from '@/lib/useStore';

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

const newId = () => Date.now();

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
  const [selected, setSelected] = useState<number | null>(null);
  const [модалка, setМодалка] = useState<string | null>(null);

  const [принтеры, setПринтеры] = useStore<Принтер[]>('af_printers', ДЕФОЛТЫ.принтеры);
  const [катушки, setКатушки] = useStore<Катушка[]>('af_filaments', ДЕФОЛТЫ.катушки);
  const [то, setТО] = useStore<ЗадачаТО[]>('af_maintenance', ДЕФОЛТЫ.то);
  const [запчасти, setЗапчасти] = useStore<Запчасть[]>('af_parts', ДЕФОЛТЫ.запчасти);
  const [журнал] = useStore<Печать[]>('af_jobs', ДЕФОЛТЫ.журнал);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const t = setInterval(() => setGlados((g) => (g + 1) % GLADOS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const активных = принтеры.filter((p) => p.status === 'печать').length;
  const катушекНизко = катушки.filter((k) => k.remain < 20).length;

  // ---- обработчики управления принтером ----
  const управлять = (id: number, действие: 'печать' | 'пауза' | 'простой') => {
    setПринтеры(
      принтеры.map((p) =>
        p.id === id
          ? {
              ...p,
              status: действие,
              progress: действие === 'простой' ? 0 : p.progress,
              job: действие === 'простой' ? '—' : p.job === '—' ? 'new_print.gcode' : p.job,
              nozzle: действие === 'простой' ? 24 : действие === 'печать' ? 210 : p.nozzle,
              bed: действие === 'простой' ? 23 : действие === 'печать' ? 60 : p.bed,
            }
          : p,
      ),
    );
  };

  const удалитьПринтер = (id: number) => {
    setПринтеры(принтеры.filter((p) => p.id !== id));
    if (selected === id) setSelected(null);
  };

  // ---- сохранение из модалок ----
  const сохранить = (v: Record<string, string>) => {
    if (модалка === 'printer') {
      setПринтеры([
        ...принтеры,
        {
          id: newId(),
          name: v.name || 'НОВЫЙ ПРИНТЕР',
          model: v.model || 'Custom',
          status: 'простой',
          progress: 0,
          nozzle: 24,
          bed: 23,
          ip: v.ip || '192.168.1.1',
          port: v.port || '7125',
          hours: 0,
          job: '—',
          eta: '—',
        },
      ]);
    } else if (модалка === 'filament') {
      const w = Number(v.weight) || 1000;
      setКатушки([
        ...катушки,
        {
          id: newId(),
          brand: v.brand || 'Без бренда',
          type: v.type || 'PLA',
          color: v.color || '#FF6B00',
          remain: 100,
          weightG: w,
        },
      ]);
    } else if (модалка === 'maintenance') {
      setТО([
        ...то,
        { id: newId(), task: v.task || 'Задача ТО', printer: v.printer || '—', due: Number(v.due) || 0 },
      ]);
    } else if (модалка === 'part') {
      setЗапчасти([
        ...запчасти,
        { id: newId(), name: v.name || 'Запчасть', qty: Number(v.qty) || 0, min: Number(v.min) || 1 },
      ]);
    }
  };

  const поляМодалки: Record<string, { title: string; fields: Поле[] }> = {
    printer: {
      title: 'Добавить принтер',
      fields: [
        { key: 'name', label: 'Название', placeholder: 'APERTURE-05' },
        { key: 'model', label: 'Модель', placeholder: 'Bambu X1C' },
        { key: 'ip', label: 'IP-адрес', placeholder: '192.168.1.105' },
        { key: 'port', label: 'Порт', placeholder: '7125', type: 'number' },
      ],
    },
    filament: {
      title: 'Добавить катушку',
      fields: [
        { key: 'brand', label: 'Бренд', placeholder: 'eSun' },
        { key: 'type', label: 'Тип пластика', placeholder: 'PLA+' },
        { key: 'color', label: 'Цвет (HEX)', placeholder: '#FF6B00' },
        { key: 'weight', label: 'Вес, г', placeholder: '1000', type: 'number' },
      ],
    },
    maintenance: {
      title: 'Добавить задачу ТО',
      fields: [
        { key: 'task', label: 'Задача', placeholder: 'Смазка направляющих' },
        { key: 'printer', label: 'Принтер', placeholder: 'APERTURE-01' },
        { key: 'due', label: 'Готовность, %', placeholder: '50', type: 'number' },
      ],
    },
    part: {
      title: 'Добавить запчасть',
      fields: [
        { key: 'name', label: 'Название', placeholder: 'Сопло 0.4мм' },
        { key: 'qty', label: 'Количество', placeholder: '10', type: 'number' },
        { key: 'min', label: 'Минимум', placeholder: '3', type: 'number' },
      ],
    },
  };

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
                Центр управления • {принтеры.length} станков
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
            { label: 'Катушки', value: катушки.length, unit: `${катушекНизко} на исходе`, icon: 'Disc3', color: 'text-aperture-blue' },
            { label: 'Принтеры', value: принтеры.length, unit: 'всего', icon: 'Server', color: 'text-foreground' },
            { label: 'Запчасти', value: запчасти.length, unit: 'позиций', icon: 'Package', color: 'text-green-500' },
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
          <Заголовок icon="Server" text="Принтеры" onAdd={() => setМодалка('printer')} />
          {принтеры.length === 0 ? (
            <Пусто text="Нет принтеров. Добавьте станок для начала работы." onAdd={() => setМодалка('printer')} btn="Добавить принтер" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {принтеры.map((p, i) => (
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
                      <p className="font-mono text-[11px] text-muted-foreground">{p.model} • {p.ip}:{p.port}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase ${СТАТУС_ЦВЕТ[p.status]}`}>
                        <span className={`h-2 w-2 rounded-full ${p.status === 'печать' ? 'animate-pulse-glow' : ''} ${
                          p.status === 'печать' ? 'bg-aperture-orange' : p.status === 'пауза' ? 'bg-aperture-blue' : p.status === 'ошибка' ? 'bg-red-500' : 'bg-muted-foreground'
                        }`} />
                        {p.status}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); удалитьПринтер(p.id); }}
                        className="text-muted-foreground transition-transform active:scale-90 hover:text-red-500"
                      >
                        <Icon name="Trash2" size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground truncate max-w-[60%]">{p.job}</span>
                      <span className="text-aperture-orange">{p.progress}% • {p.eta}</span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-aperture-orange transition-all duration-700" style={{ width: `${p.progress}%` }} />
                      {p.status === 'печать' && (
                        <div className="absolute inset-0 w-1/3 animate-scan bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      )}
                    </div>
                  </div>

                  <div className="mb-3 flex gap-4 font-mono text-[11px]">
                    <span className="flex items-center gap-1"><Icon name="Flame" size={13} className="text-aperture-orange" /> Сопло {p.nozzle}°</span>
                    <span className="flex items-center gap-1"><Icon name="Grid3x3" size={13} className="text-aperture-blue" /> Стол {p.bed}°</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Icon name="Clock" size={13} /> {p.hours}ч</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <КнопкаУпр icon="Play" text="Старт" cls="bg-aperture-orange text-white" onClick={() => управлять(p.id, 'печать')} />
                    <КнопкаУпр icon="Pause" text="Пауза" cls="bg-aperture-blue text-aperture-dark" onClick={() => управлять(p.id, 'пауза')} />
                    <КнопкаУпр icon="Square" text="Стоп" cls="bg-muted text-foreground border border-border" onClick={() => управлять(p.id, 'простой')} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* КАТУШКИ */}
        <section>
          <Заголовок icon="Disc3" text="Катушки пластика" onAdd={() => setМодалка('filament')} />
          {катушки.length === 0 ? (
            <Пусто text="Нет катушек. Добавьте пластик." onAdd={() => setМодалка('filament')} btn="Добавить катушку" />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {катушки.map((k, i) => (
                <div
                  key={k.id}
                  className="animate-fade-in group relative flex flex-col items-center rounded-md border border-border bg-card p-4 text-center shadow-sm"
                  style={{ animationDelay: `${i * 70}ms`, opacity: 0 }}
                >
                  <button
                    onClick={() => setКатушки(катушки.filter((x) => x.id !== k.id))}
                    className="absolute right-2 top-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
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
          )}
        </section>

        {/* ТО + ЗАПЧАСТИ */}
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <Заголовок icon="Wrench" text="График ТО" onAdd={() => setМодалка('maintenance')} />
            {то.length === 0 ? (
              <Пусто text="Нет задач ТО." onAdd={() => setМодалка('maintenance')} btn="Добавить задачу" />
            ) : (
              <div className="space-y-2">
                {то.map((t, i) => (
                  <div
                    key={t.id}
                    className="animate-fade-in group rounded-md border border-border bg-card p-3 shadow-sm"
                    style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[12px] font-medium">{t.task}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[11px] font-bold ${t.due > 90 ? 'text-red-500' : t.due > 75 ? 'text-aperture-orange' : 'text-muted-foreground'}`}>
                          {t.due}%
                        </span>
                        <button onClick={() => setТО(то.filter((x) => x.id !== t.id))} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500">
                          <Icon name="Check" size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="mb-1.5 font-mono text-[10px] uppercase text-muted-foreground">{t.printer}</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${t.due > 90 ? 'bg-red-500' : t.due > 75 ? 'bg-aperture-orange' : 'bg-aperture-blue'}`} style={{ width: `${t.due}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Заголовок icon="Package" text="Запчасти" onAdd={() => setМодалка('part')} />
            {запчасти.length === 0 ? (
              <Пусто text="Нет запчастей." onAdd={() => setМодалка('part')} btn="Добавить запчасть" />
            ) : (
              <div className="space-y-2">
                {запчасти.map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-in group flex items-center justify-between rounded-md border border-border bg-card p-3 shadow-sm"
                    style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="Cog" size={16} className={p.qty < p.min ? 'text-red-500' : 'text-aperture-blue'} />
                      <span className="font-mono text-[12px]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`font-mono text-sm font-bold ${p.qty < p.min ? 'text-red-500' : 'text-foreground'}`}>{p.qty} шт</span>
                        {p.qty < p.min && <p className="font-mono text-[9px] uppercase text-red-500">мин. {p.min}</p>}
                      </div>
                      <button onClick={() => setЗапчасти(запчасти.filter((x) => x.id !== p.id))} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                {журнал.map((j, i) => (
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
            Aperture Science • Farm Control System v0.2
          </p>
        </footer>
      </main>

      {модалка && поляМодалки[модалка] && (
        <ModalForm
          title={поляМодалки[модалка].title}
          fields={поляМодалки[модалка].fields}
          onClose={() => setМодалка(null)}
          onSave={сохранить}
        />
      )}
    </div>
  );
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================

function Заголовок({ icon, text, onAdd }: { icon: string; text: string; onAdd?: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon name={icon} size={18} className="text-aperture-orange" />
      <h2 className="font-display text-lg font-semibold uppercase tracking-widest">{text}</h2>
      <div className="ml-2 h-px flex-1 bg-border" />
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded-sm border border-aperture-orange px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-wide text-aperture-orange transition-transform active:scale-95 hover:bg-aperture-orange hover:text-white"
        >
          <Icon name="Plus" size={13} /> Добавить
        </button>
      )}
    </div>
  );
}

function Пусто({ text, onAdd, btn }: { text: string; onAdd: () => void; btn: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-border bg-card/50 py-10 text-center">
      <Icon name="Inbox" size={32} className="text-muted-foreground" />
      <p className="font-mono text-[12px] text-muted-foreground">{text}</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 rounded-sm bg-aperture-orange px-4 py-2 font-display text-[12px] font-semibold uppercase tracking-wide text-white transition-transform active:scale-95"
      >
        <Icon name="Plus" size={14} /> {btn}
      </button>
    </div>
  );
}

function КнопкаУпр({ icon, text, cls, onClick }: { icon: string; text: string; cls: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex items-center justify-center gap-1 rounded-sm py-2 font-display text-[12px] font-semibold uppercase tracking-wide transition-transform active:scale-95 ${cls}`}
    >
      <Icon name={icon} size={13} />
      {text}
    </button>
  );
}
