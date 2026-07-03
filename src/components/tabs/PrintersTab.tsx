import { useState } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import ModalForm, { Поле } from '@/components/ModalForm';
import { Принтер, ЗадачаТО, Запчасть } from '@/lib/useStore';
import { запросMoonraker } from '@/lib/moonraker';

interface Props {
  принтеры: Принтер[];
  setПринтеры: (v: Принтер[]) => void;
  то: ЗадачаТО[];
  setТО: (v: ЗадачаТО[]) => void;
  запчасти: Запчасть[];
  setЗапчасти: (v: Запчасть[]) => void;
}

const newId = () => Date.now();

const СТАТУС_ЦВЕТ: Record<string, string> = {
  'печать': 'text-farm-blue',
  'пауза': 'text-farm-teal',
  'простой': 'text-muted-foreground',
  'ошибка': 'text-destructive',
};

const СТАТУС_ФОН: Record<string, string> = {
  'печать': 'bg-farm-blue',
  'пауза': 'bg-farm-teal',
  'простой': 'bg-muted-foreground',
  'ошибка': 'bg-destructive',
};

export default function PrintersTab({ принтеры, setПринтеры, то, setТО, запчасти, setЗапчасти }: Props) {
  const [форма, setФорма] = useState<'printer' | 'maintenance' | 'part' | null>(null);
  const [раздел, setРаздел] = useState<'printers' | 'maintenance' | 'parts'>('printers');
  const [загрузка, setЗагрузка] = useState<number | null>(null);

  // Проверка связи с принтером и обновление статуса на основе реального ответа Moonraker
  const проверитьСвязь = async (p: Принтер) => {
    setЗагрузка(p.id);
    const ответ = await запросMoonraker(p.ip, p.port, p.apiKey, 'status');
    setЗагрузка(null);

    if (!ответ.connected) {
      toast.error(`${p.name}: нет связи`, { description: ответ.error });
      setПринтеры(принтеры.map((x) => (x.id === p.id ? { ...x, status: 'ошибка' } : x)));
      return null;
    }

    const st = ответ.data?.result?.status;
    if (st) {
      const обновлённый: Принтер = {
        ...p,
        nozzle: Math.round(st.extruder?.temperature ?? p.nozzle),
        bed: Math.round(st.heater_bed?.temperature ?? p.bed),
        progress: Math.round((st.virtual_sdcard?.progress ?? 0) * 100),
        job: st.print_stats?.filename || '—',
        status: st.print_stats?.state === 'printing' ? 'печать' : st.print_stats?.state === 'paused' ? 'пауза' : 'простой',
      };
      setПринтеры(принтеры.map((x) => (x.id === p.id ? обновлённый : x)));
      toast.success(`${p.name}: связь установлена`);
      return обновлённый;
    }
    return null;
  };

  // Отправка команды управления на реальный принтер через Moonraker API
  const управлять = async (p: Принтер, действие: 'start' | 'pause' | 'cancel') => {
    setЗагрузка(p.id);
    const ответ = await запросMoonraker(p.ip, p.port, p.apiKey, действие);
    setЗагрузка(null);

    if (!ответ.connected) {
      toast.error(`${p.name}: команда не отправлена`, {
        description: ответ.error || 'Принтер недоступен по указанному адресу',
      });
      setПринтеры(принтеры.map((x) => (x.id === p.id ? { ...x, status: 'ошибка' } : x)));
      return;
    }

    const статус = действие === 'start' ? 'печать' : действие === 'pause' ? 'пауза' : 'простой';
    toast.success(`${p.name}: команда выполнена`);
    setПринтеры(
      принтеры.map((x) =>
        x.id === p.id
          ? {
              ...x,
              status: статус,
              progress: статус === 'простой' ? 0 : x.progress,
              job: статус === 'простой' ? '—' : x.job === '—' ? 'new_print.gcode' : x.job,
            }
          : x,
      ),
    );
  };

  const поляПринтер: Поле[] = [
    { key: 'name', label: 'Название', placeholder: 'Принтер-04' },
    { key: 'model', label: 'Модель', placeholder: 'Bambu X1C' },
    { key: 'ip', label: 'IP-адрес', placeholder: '192.168.1.104' },
    { key: 'port', label: 'Порт', placeholder: '7125' },
    { key: 'apiKey', label: 'API-ключ (если есть)', placeholder: '' },
    { key: 'nozzleSize', label: 'Диаметр сопла, мм', placeholder: '0.4', type: 'number' },
    { key: 'powerWatt', label: 'Мощность, Вт', placeholder: '300', type: 'number' },
    { key: 'cost', label: 'Стоимость принтера, ₽', placeholder: '50000', type: 'number' },
    { key: 'lifetimeHours', label: 'Ресурс, часов', placeholder: '8000', type: 'number' },
  ];

  const поляТО: Поле[] = [
    { key: 'printerName', label: 'Принтер', placeholder: 'Принтер-01' },
    { key: 'taskType', label: 'Тип задачи', placeholder: 'Смазка направляющих' },
    { key: 'intervalHours', label: 'Интервал, ч', placeholder: '200', type: 'number' },
    { key: 'lastPerformedHours', label: 'Выполнено на моточасах', placeholder: '1000', type: 'number' },
  ];

  const поляЗапчасть: Поле[] = [
    { key: 'name', label: 'Название', placeholder: 'Сопло 0.4мм' },
    { key: 'qty', label: 'Количество', placeholder: '10', type: 'number' },
    { key: 'min', label: 'Минимум', placeholder: '3', type: 'number' },
    { key: 'compatibleWith', label: 'Совместимость', placeholder: 'Voron, Ender' },
  ];

  const сохранить = (v: Record<string, string>) => {
    if (форма === 'printer') {
      setПринтеры([
        ...принтеры,
        {
          id: newId(),
          name: v.name || 'Новый принтер',
          model: v.model || 'Custom',
          status: 'простой',
          progress: 0,
          nozzle: 24,
          bed: 23,
          ip: v.ip || '192.168.1.1',
          port: v.port || '7125',
          apiKey: v.apiKey || '',
          totalHours: 0,
          lastServiceDate: new Date().toISOString().slice(0, 10),
          nozzleSize: Number(v.nozzleSize) || 0.4,
          powerWatt: Number(v.powerWatt) || 300,
          cost: Number(v.cost) || 0,
          lifetimeHours: Number(v.lifetimeHours) || 8000,
          job: '—',
          eta: '—',
        },
      ]);
    } else if (форма === 'maintenance') {
      const interval = Number(v.intervalHours) || 200;
      const last = Number(v.lastPerformedHours) || 0;
      setТО([
        ...то,
        {
          id: newId(),
          printerName: v.printerName || '—',
          taskType: v.taskType || 'Задача ТО',
          intervalHours: interval,
          lastPerformedHours: last,
          nextDueHours: last + interval,
        },
      ]);
    } else if (форма === 'part') {
      setЗапчасти([
        ...запчасти,
        { id: newId(), name: v.name || 'Запчасть', qty: Number(v.qty) || 0, min: Number(v.min) || 1, compatibleWith: v.compatibleWith || '—' },
      ]);
    }
  };

  const модалка = {
    printer: { title: 'Новый принтер', fields: поляПринтер },
    maintenance: { title: 'Новая задача ТО', fields: поляТО },
    part: { title: 'Новая запчасть', fields: поляЗапчасть },
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h2 className="font-display text-2xl font-light text-foreground">Принтеры</h2>
        <p className="text-xs text-muted-foreground">{принтеры.length} станков в ферме</p>
      </div>

      {/* переключатель разделов */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {([
          ['printers', 'Станки', 'Server'],
          ['maintenance', 'ТО', 'Wrench'],
          ['parts', 'Запчасти', 'Package'],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setРаздел(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
              раздел === key ? 'bg-card text-farm-blue shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Icon name={icon} size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* СТАНКИ */}
      {раздел === 'printers' && (
        <div className="space-y-3">
          <button
            onClick={() => setФорма('printer')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-farm-blue py-2.5 text-xs font-medium uppercase tracking-wide text-farm-blue transition-transform active:scale-95"
          >
            <Icon name="Plus" size={14} /> Добавить принтер
          </button>

          {принтеры.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
              <Icon name="Server" size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Нет принтеров. Подключите первый станок.</p>
            </div>
          ) : (
            принтеры.map((p) => (
              <div key={p.id} className="animate-fade-in group rounded-2xl bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-medium text-foreground">{p.name}</h3>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.model} • {p.ip}:{p.port}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-[11px] font-medium uppercase ${СТАТУС_ЦВЕТ[p.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'печать' ? 'animate-pulse-soft' : ''} ${СТАТУС_ФОН[p.status]}`} />
                      {p.status}
                    </span>
                    <button
                      onClick={() => проверитьСвязь(p)}
                      disabled={загрузка === p.id}
                      className="text-muted-foreground transition-transform active:scale-90 hover:text-farm-blue disabled:opacity-50"
                      title="Проверить связь"
                    >
                      <Icon name={загрузка === p.id ? 'Loader2' : 'RefreshCw'} size={15} className={загрузка === p.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => setПринтеры(принтеры.filter((x) => x.id !== p.id))}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="truncate text-muted-foreground">{p.job}</span>
                    <span className="font-mono text-farm-blue">{p.progress}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-farm-blue transition-all duration-700" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                <div className="mb-3 flex gap-4 font-mono text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="Flame" size={12} className="text-farm-blue" /> {p.nozzle}°</span>
                  <span className="flex items-center gap-1"><Icon name="Grid3x3" size={12} className="text-farm-teal" /> {p.bed}°</span>
                  <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> {p.totalHours}ч</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => управлять(p, 'start')} disabled={загрузка === p.id} className="flex items-center justify-center gap-1 rounded-lg bg-farm-blue py-2 text-[11px] font-medium uppercase text-white transition-transform active:scale-95 disabled:opacity-50">
                    <Icon name="Play" size={12} /> Старт
                  </button>
                  <button onClick={() => управлять(p, 'pause')} disabled={загрузка === p.id} className="flex items-center justify-center gap-1 rounded-lg bg-farm-teal py-2 text-[11px] font-medium uppercase text-white transition-transform active:scale-95 disabled:opacity-50">
                    <Icon name="Pause" size={12} /> Пауза
                  </button>
                  <button onClick={() => управлять(p, 'cancel')} disabled={загрузка === p.id} className="flex items-center justify-center gap-1 rounded-lg bg-muted py-2 text-[11px] font-medium uppercase text-foreground transition-transform active:scale-95 disabled:opacity-50">
                    <Icon name="Square" size={12} /> Стоп
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ТО */}
      {раздел === 'maintenance' && (
        <div className="space-y-3">
          <button
            onClick={() => setФорма('maintenance')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-farm-blue py-2.5 text-xs font-medium uppercase tracking-wide text-farm-blue transition-transform active:scale-95"
          >
            <Icon name="Plus" size={14} /> Добавить задачу
          </button>
          {то.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
              <Icon name="Wrench" size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Нет задач ТО.</p>
            </div>
          ) : (
            то.map((t) => {
              const printer = принтеры.find((p) => p.name === t.printerName);
              const текущиеЧасы = printer?.totalHours ?? t.lastPerformedHours;
              const прогресс = Math.min(100, Math.round(((текущиеЧасы - t.lastPerformedHours) / t.intervalHours) * 100));
              return (
                <div key={t.id} className="group rounded-2xl bg-card p-3.5 shadow-sm">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{t.taskType}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[11px] font-semibold ${прогресс > 90 ? 'text-destructive' : прогресс > 75 ? 'text-farm-blue' : 'text-muted-foreground'}`}>
                        {прогресс}%
                      </span>
                      <button onClick={() => setТО(то.filter((x) => x.id !== t.id))} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive">
                        <Icon name="Check" size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="mb-1.5 text-[11px] text-muted-foreground">{t.printerName} • до {t.nextDueHours}ч</p>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${прогресс > 90 ? 'bg-destructive' : 'bg-farm-blue'}`} style={{ width: `${прогресс}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ЗАПЧАСТИ */}
      {раздел === 'parts' && (
        <div className="space-y-3">
          <button
            onClick={() => setФорма('part')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-farm-blue py-2.5 text-xs font-medium uppercase tracking-wide text-farm-blue transition-transform active:scale-95"
          >
            <Icon name="Plus" size={14} /> Добавить запчасть
          </button>
          {запчасти.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
              <Icon name="Package" size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Нет запчастей.</p>
            </div>
          ) : (
            запчасти.map((p) => (
              <div key={p.id} className="group flex items-center justify-between rounded-2xl bg-card p-3.5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Icon name="Cog" size={16} className={p.qty < p.min ? 'text-destructive' : 'text-farm-teal'} />
                  <div>
                    <p className="text-sm text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.compatibleWith}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`font-mono text-sm font-semibold ${p.qty < p.min ? 'text-destructive' : 'text-foreground'}`}>{p.qty} шт</span>
                    {p.qty < p.min && <p className="text-[10px] text-destructive">мин. {p.min}</p>}
                  </div>
                  <button onClick={() => setЗапчасти(запчасти.filter((x) => x.id !== p.id))} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive">
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {форма && (
        <ModalForm title={модалка[форма].title} fields={модалка[форма].fields} onClose={() => setФорма(null)} onSave={сохранить} />
      )}
    </div>
  );
}