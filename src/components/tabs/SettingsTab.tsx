import { useState } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Настройки } from '@/lib/useStore';
import { отправитьTelegram } from '@/lib/telegram';

interface Props {
  настройки: Настройки;
  setНастройки: (v: Настройки) => void;
}

const СОБЫТИЯ: { key: keyof Настройки; label: string; icon: string }[] = [
  { key: 'notifyPrintDone', label: 'Окончание печати', icon: 'CheckCircle2' },
  { key: 'notifyError', label: 'Ошибка принтера', icon: 'TriangleAlert' },
  { key: 'notifyLowFilament', label: 'Низкий уровень пластика', icon: 'Disc3' },
  { key: 'notifyMaintenance', label: 'Приближение ТО', icon: 'Wrench' },
  { key: 'notifyLowParts', label: 'Низкий запас запчастей', icon: 'Package' },
];

export default function SettingsTab({ настройки, setНастройки }: Props) {
  const [отправка, setОтправка] = useState(false);

  const тест = async () => {
    if (!настройки.telegramToken || !настройки.telegramChatId) {
      toast.error('Заполните токен бота и ID чата');
      return;
    }
    setОтправка(true);
    const ответ = await отправитьTelegram(
      настройки.telegramToken,
      настройки.telegramChatId,
      'Ферма принтеров: тестовое уведомление. Связь установлена.',
    );
    setОтправка(false);

    if (ответ.ok) {
      toast.success('Сообщение отправлено в Telegram');
    } else {
      toast.error('Не удалось отправить', { description: ответ.error });
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h2 className="font-display text-2xl font-light text-foreground">Настройки</h2>
        <p className="text-xs text-muted-foreground">Тарифы, наценка и уведомления</p>
      </div>

      {/* РАСЧЁТЫ */}
      <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Параметры расчёта</p>
        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">Тариф электроэнергии, ₽/кВт·ч</label>
          <input
            type="number"
            value={настройки.tariffKwh}
            onChange={(e) => setНастройки({ ...настройки, tariffKwh: Number(e.target.value) })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-farm-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">Наценка для продажи, %</label>
          <input
            type="number"
            value={настройки.markupPercent}
            onChange={(e) => setНастройки({ ...настройки, markupPercent: Number(e.target.value) })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-farm-blue"
          />
        </div>
      </div>

      {/* TELEGRAM */}
      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Send" size={16} className="text-farm-blue" />
            <p className="text-sm font-medium text-foreground">Telegram-уведомления</p>
          </div>
          <Switch
            checked={настройки.telegramEnabled}
            onCheckedChange={(v) => setНастройки({ ...настройки, telegramEnabled: v })}
          />
        </div>

        {настройки.telegramEnabled && (
          <div className="animate-fade-in space-y-3">
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">Токен бота</label>
              <input
                type="text"
                placeholder="123456789:AA...получить у @BotFather"
                value={настройки.telegramToken}
                onChange={(e) => setНастройки({ ...настройки, telegramToken: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-farm-blue"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">ID чата</label>
              <input
                type="text"
                placeholder="узнать у @userinfobot"
                value={настройки.telegramChatId}
                onChange={(e) => setНастройки({ ...настройки, telegramChatId: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-farm-blue"
              />
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">События для уведомлений</p>
              {СОБЫТИЯ.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    <Icon name={s.icon} size={14} className="text-farm-teal" />
                    {s.label}
                  </span>
                  <Switch
                    checked={Boolean(настройки[s.key])}
                    onCheckedChange={(v) => setНастройки({ ...настройки, [s.key]: v })}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={тест}
              disabled={отправка}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-farm-teal py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-transform active:scale-95 disabled:opacity-50"
            >
              <Icon name={отправка ? 'Loader2' : 'Send'} size={14} className={отправка ? 'animate-spin' : ''} />
              Отправить тестовое сообщение
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
