import { useState } from 'react';
import Icon from '@/components/ui/icon';

export interface Поле {
  key: string;
  label: string;
  type?: 'text' | 'number';
  placeholder?: string;
}

interface Props {
  title: string;
  fields: Поле[];
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}

export default function ModalForm({ title, fields, onClose, onSave }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});

  const сохранить = () => {
    onSave(values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-in w-full max-w-md rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-light tracking-wide text-farm-blue">
            {title}
          </h3>
          <button onClick={onClose} className="text-muted-foreground transition-transform active:scale-90 hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                {f.label}
              </label>
              <input
                type={f.type ?? 'text'}
                placeholder={f.placeholder}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-farm-blue"
              />
            </div>
          ))}
        </div>

        <button
          onClick={сохранить}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-farm-blue py-3 font-display text-sm font-medium uppercase tracking-widest text-white transition-transform active:scale-95"
        >
          <Icon name="Check" size={16} />
          Сохранить
        </button>
      </div>
    </div>
  );
}