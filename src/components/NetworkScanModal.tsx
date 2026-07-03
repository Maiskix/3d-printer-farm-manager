import { useState } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { найтиПринтерыВСети, НайденныйПринтер } from '@/lib/moonraker';

interface Props {
  onClose: () => void;
  onAdd: (printer: НайденныйПринтер) => void;
  существующиеIP: string[];
}

// Определяет подсеть текущего устройства недоступно из браузера напрямую,
// поэтому предлагаем частые домашние диапазоны и даём возможность ввести свой.
const ЧАСТЫЕ_ПОДСЕТИ = ['192.168.1', '192.168.0', '10.0.0'];

export default function NetworkScanModal({ onClose, onAdd, существующиеIP }: Props) {
  const [subnet, setSubnet] = useState(ЧАСТЫЕ_ПОДСЕТИ[0]);
  const [port, setPort] = useState('7125');
  const [сканирование, setСканирование] = useState(false);
  const [результаты, setРезультаты] = useState<НайденныйПринтер[] | null>(null);

  const сканировать = async () => {
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(subnet)) {
      toast.error('Введите подсеть в формате 192.168.1');
      return;
    }
    setСканирование(true);
    setРезультаты(null);

    const ответ = await найтиПринтерыВСети(subnet, port);
    setСканирование(false);

    if (!ответ.connected) {
      toast.error('Не удалось выполнить поиск', { description: ответ.error });
      setРезультаты([]);
      return;
    }

    setРезультаты(ответ.printers || []);
    if (!ответ.printers || ответ.printers.length === 0) {
      toast.info('В этой подсети принтеры не найдены');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="animate-fade-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-light tracking-wide text-farm-blue">Поиск в сети</h3>
          <button onClick={onClose} className="text-muted-foreground transition-transform active:scale-90 hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {ЧАСТЫЕ_ПОДСЕТИ.map((s) => (
            <button
              key={s}
              onClick={() => setSubnet(s)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                subnet === s ? 'bg-farm-blue text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}.x
            </button>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-muted-foreground">Подсеть</label>
            <input
              type="text"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              placeholder="192.168.1"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-farm-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">Порт</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-farm-blue"
            />
          </div>
        </div>

        <button
          onClick={сканировать}
          disabled={сканирование}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-farm-blue py-3 text-sm font-medium uppercase tracking-wide text-white transition-transform active:scale-95 disabled:opacity-60"
        >
          <Icon name={сканирование ? 'Loader2' : 'Search'} size={16} className={сканирование ? 'animate-spin' : ''} />
          {сканирование ? 'Сканирование сети...' : 'Начать поиск'}
        </button>

        {результаты !== null && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {результаты.length > 0 ? `Найдено: ${результаты.length}` : 'Ничего не найдено'}
            </p>

            {результаты.length > 0 && (
              <div className="space-y-2">
                {результаты.map((r) => {
                  const ужеДобавлен = существующиеIP.includes(r.ip);
                  return (
                    <div key={r.ip} className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{r.hostname}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{r.ip}:{r.port} • {r.state}</p>
                      </div>
                      <button
                        onClick={() => onAdd(r)}
                        disabled={ужеДобавлен}
                        className="ml-2 flex shrink-0 items-center gap-1 rounded-lg bg-farm-blue px-3 py-1.5 text-[11px] font-medium uppercase text-white transition-transform active:scale-95 disabled:opacity-40"
                      >
                        <Icon name={ужеДобавлен ? 'Check' : 'Plus'} size={12} />
                        {ужеДобавлен ? 'Добавлен' : 'Добавить'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className="mt-4 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Icon name="Info" size={13} className="mt-0.5 shrink-0" />
          Поиск опрашивает адреса от .1 до .254 в указанной подсети и может занять до 15 секунд
        </p>
      </div>
    </div>
  );
}
