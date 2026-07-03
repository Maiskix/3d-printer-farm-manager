import { useState, useMemo, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Катушка, Принтер, Настройки } from '@/lib/useStore';

interface Props {
  катушки: Катушка[];
  принтеры: Принтер[];
  настройки: Настройки;
}

export default function CalculatorTab({ катушки, принтеры, настройки }: Props) {
  const [filamentId, setFilamentId] = useState<number | null>(катушки[0]?.id ?? null);
  const [printerId, setPrinterId] = useState<number | null>(принтеры[0]?.id ?? null);

  // При первой загрузке подставляем катушку, привязанную к выбранному принтеру
  useEffect(() => {
    const привязанная = катушки.find((k) => k.printerId === printerId);
    if (привязанная) setFilamentId(привязанная.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [weight, setWeight] = useState('50');
  const [hours, setHours] = useState('2');

  const катушка = катушки.find((k) => k.id === filamentId);
  const принтер = принтеры.find((p) => p.id === printerId);

  const результат = useMemo(() => {
    const w = Number(weight) || 0;
    const h = Number(hours) || 0;

    const costFilament = катушка ? (w / 1000) * катушка.pricePerKg : 0;
    const costEnergy = принтер ? (принтер.powerWatt / 1000) * h * настройки.tariffKwh : 0;
    const costDepreciation = принтер && принтер.lifetimeHours > 0 ? (принтер.cost / принтер.lifetimeHours) * h : 0;

    const себестоимость = costFilament + costEnergy + costDepreciation;
    const цена = себестоимость * (1 + настройки.markupPercent / 100);

    return { costFilament, costEnergy, costDepreciation, себестоимость, цена };
  }, [weight, hours, катушка, принтер, настройки]);

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h2 className="font-display text-2xl font-light text-foreground">Калькулятор</h2>
        <p className="text-xs text-muted-foreground">Расчёт себестоимости печати</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Катушка пластика</label>
          <select
            value={filamentId ?? ''}
            onChange={(e) => setFilamentId(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-farm-blue"
          >
            {катушки.length === 0 && <option>Нет катушек</option>}
            {катушки.map((k) => (
              <option key={k.id} value={k.id}>{k.brand} {k.type} • ₽{k.pricePerKg}/кг</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Принтер</label>
          <select
            value={printerId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setPrinterId(id);
              const привязанная = катушки.find((k) => k.printerId === id);
              if (привязанная) setFilamentId(привязанная.id);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-farm-blue"
          >
            {принтеры.length === 0 && <option>Нет принтеров</option>}
            {принтеры.map((p) => (
              <option key={p.id} value={p.id}>{p.name} • {p.powerWatt}Вт</option>
            ))}
          </select>
          {принтер && катушка?.printerId === принтер.id && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-farm-teal">
              <Icon name="Link" size={11} /> Катушка подставлена автоматически
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Вес модели, г</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-farm-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">Время печати, ч</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-farm-blue"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Разбивка затрат</p>
        <div className="space-y-2.5">
          <Строка icon="Disc3" label="Пластик" value={результат.costFilament} />
          <Строка icon="Zap" label="Электроэнергия" value={результат.costEnergy} />
          <Строка icon="TrendingDown" label="Амортизация принтера" value={результат.costDepreciation} />
        </div>
        <div className="my-3 h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Себестоимость</span>
          <span className="font-mono text-lg font-semibold text-foreground">₽{результат.себестоимость.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-farm-blue/10 px-3 py-2.5">
          <span className="text-sm font-medium text-farm-blue">Цена продажи</span>
          <span className="font-mono text-xl font-bold text-farm-blue">₽{результат.цена.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function Строка({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name={icon} size={14} className="text-farm-teal" />
        {label}
      </span>
      <span className="font-mono text-sm text-foreground">₽{value.toFixed(2)}</span>
    </div>
  );
}