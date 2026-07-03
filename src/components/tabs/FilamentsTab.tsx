import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import ModalForm, { Поле } from '@/components/ModalForm';
import { Катушка } from '@/lib/useStore';

interface Props {
  катушки: Катушка[];
  setКатушки: (v: Катушка[]) => void;
}

const newId = () => Date.now();

function Кольцо({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="4" fill="none" className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="4"
          fill="none"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-semibold text-foreground">
        {value}%
      </span>
    </div>
  );
}

export default function FilamentsTab({ катушки, setКатушки }: Props) {
  const [открытаФорма, setОткрытаФорма] = useState(false);

  const пулы = useMemo(() => {
    const группы: Record<string, Катушка[]> = {};
    катушки.forEach((k) => {
      const key = k.pool || 'Без пула';
      if (!группы[key]) группы[key] = [];
      группы[key].push(k);
    });
    return группы;
  }, [катушки]);

  const поля: Поле[] = [
    { key: 'brand', label: 'Бренд', placeholder: 'eSun' },
    { key: 'type', label: 'Тип пластика', placeholder: 'PLA+' },
    { key: 'color', label: 'Цвет (HEX)', placeholder: '#1565C0' },
    { key: 'totalWeight', label: 'Вес катушки, г', placeholder: '1000', type: 'number' },
    { key: 'pricePerKg', label: 'Цена за кг, ₽', placeholder: '1400', type: 'number' },
    { key: 'vendor', label: 'Поставщик', placeholder: 'Top3DShop' },
    { key: 'pool', label: 'Пул', placeholder: 'Синий PLA' },
  ];

  const сохранить = (v: Record<string, string>) => {
    const w = Number(v.totalWeight) || 1000;
    setКатушки([
      ...катушки,
      {
        id: newId(),
        brand: v.brand || 'Без бренда',
        type: v.type || 'PLA',
        color: v.color || '#1565C0',
        totalWeight: w,
        currentWeight: w,
        pricePerKg: Number(v.pricePerKg) || 0,
        purchaseDate: new Date().toISOString().slice(0, 10),
        vendor: v.vendor || '—',
        pool: v.pool || 'Без пула',
      },
    ]);
  };

  const низкий = катушки.filter((k) => k.currentWeight / k.totalWeight < 0.2).length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-light text-foreground">Катушки</h2>
          <p className="text-xs text-muted-foreground">
            {катушки.length} шт. {низкий > 0 && <span className="text-destructive">• {низкий} на исходе</span>}
          </p>
        </div>
        <button
          onClick={() => setОткрытаФорма(true)}
          className="flex items-center gap-1.5 rounded-lg bg-farm-blue px-3.5 py-2 text-xs font-medium uppercase tracking-wide text-white transition-transform active:scale-95"
        >
          <Icon name="Plus" size={14} /> Добавить
        </button>
      </div>

      {катушки.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <Icon name="CircleDashed" size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Нет катушек. Добавьте первую.</p>
        </div>
      ) : (
        Object.entries(пулы).map(([pool, list]) => (
          <div key={pool} className="animate-fade-in">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="Layers" size={14} className="text-farm-teal" />
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{pool}</h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {list.map((k) => {
                const процент = Math.round((k.currentWeight / k.totalWeight) * 100);
                const низкийУровень = процент < 20;
                return (
                  <div key={k.id} className="group flex items-center gap-3 overflow-hidden rounded-2xl bg-card p-3 shadow-sm">
                    <div className="h-14 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: k.color }} />
                    <Кольцо value={процент} color={низкийУровень ? '#E53935' : k.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{k.brand} {k.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {k.currentWeight} / {k.totalWeight} г • {k.vendor}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">₽{k.pricePerKg}/кг</p>
                      {низкийУровень && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-destructive">
                          <Icon name="TriangleAlert" size={11} /> Низкий уровень пластика
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setКатушки(катушки.filter((x) => x.id !== k.id))}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {открытаФорма && (
        <ModalForm title="Новая катушка" fields={поля} onClose={() => setОткрытаФорма(false)} onSave={сохранить} />
      )}
    </div>
  );
}
