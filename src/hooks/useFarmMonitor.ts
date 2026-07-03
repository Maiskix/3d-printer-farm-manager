import { useEffect, useRef } from 'react';
import { Принтер, Катушка, Настройки } from '@/lib/useStore';
import { запросMoonraker } from '@/lib/moonraker';
import { отправитьTelegram } from '@/lib/telegram';

interface Параметры {
  принтеры: Принтер[];
  setПринтеры: (v: Принтер[]) => void;
  катушки: Катушка[];
  настройки: Настройки;
}

const ИНТЕРВАЛ_МС = 20000;
const ПОРОГ_НИЗКОГО_ПЛАСТИКА = 0.1;

// Фоновый мониторинг фермы: опрашивает принтеры по Moonraker и следит за остатком катушек,
// автоматически отправляя уведомления в Telegram при завершении печати, ошибке или низком пластике.
export function useFarmMonitor({ принтеры, setПринтеры, катушки, настройки }: Параметры) {
  const предыдущиеСтатусы = useRef<Record<number, Принтер['status']>>({});
  const низкиеКатушки = useRef<Set<number>>(new Set());

  const уведомить = (текст: string, событие: keyof Настройки) => {
    if (!настройки.telegramEnabled || !настройки.telegramToken || !настройки.telegramChatId) return;
    if (!настройки[событие]) return;
    отправитьTelegram(настройки.telegramToken, настройки.telegramChatId, текст);
  };

  // Опрос принтеров через Moonraker
  useEffect(() => {
    if (!настройки.telegramEnabled) return;

    const принтерыСIP = принтеры.filter((p) => p.ip);
    if (принтерыСIP.length === 0) return;

    let активен = true;

    const опросить = async () => {
      const обновления: Принтер[] = [];

      for (const p of принтерыСIP) {
        const ответ = await запросMoonraker(p.ip, p.port, p.apiKey, 'status');
        if (!активен) return;

        const предыдущий = предыдущиеСтатусы.current[p.id];

        if (!ответ.connected) {
          обновления.push({ ...p, status: 'ошибка' });
          if (предыдущий !== 'ошибка') {
            уведомить(`⚠️ ${p.name}: потеряна связь с принтером.`, 'notifyError');
          }
          предыдущиеСтатусы.current[p.id] = 'ошибка';
          continue;
        }

        const st = ответ.data?.result?.status;
        if (!st) continue;

        const новыйСтатус: Принтер['status'] =
          st.print_stats?.state === 'printing' ? 'печать' :
          st.print_stats?.state === 'paused' ? 'пауза' :
          st.print_stats?.state === 'error' ? 'ошибка' : 'простой';

        обновления.push({
          ...p,
          nozzle: Math.round(st.extruder?.temperature ?? p.nozzle),
          bed: Math.round(st.heater_bed?.temperature ?? p.bed),
          progress: Math.round((st.virtual_sdcard?.progress ?? 0) * 100),
          job: st.print_stats?.filename || p.job,
          status: новыйСтатус,
        });

        if (предыдущий === 'печать' && новыйСтатус === 'простой') {
          уведомить(`✅ ${p.name}: печать «${p.job}» завершена.`, 'notifyPrintDone');
        }
        if (новыйСтатус === 'ошибка' && предыдущий !== 'ошибка') {
          уведомить(`⚠️ ${p.name}: ошибка принтера.`, 'notifyError');
        }

        предыдущиеСтатусы.current[p.id] = новыйСтатус;
      }

      if (активен && обновления.length > 0) {
        setПринтеры(
          принтеры.map((p) => обновления.find((u) => u.id === p.id) || p),
        );
      }
    };

    опросить();
    const таймер = setInterval(опросить, ИНТЕРВАЛ_МС);
    return () => {
      активен = false;
      clearInterval(таймер);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [принтеры.map((p) => `${p.id}:${p.ip}:${p.port}`).join(','), настройки.telegramEnabled]);

  // Проверка низкого остатка пластика
  useEffect(() => {
    if (!настройки.telegramEnabled || !настройки.notifyLowFilament) return;

    катушки.forEach((k) => {
      const процент = k.totalWeight > 0 ? k.currentWeight / k.totalWeight : 1;
      const низкий = процент < ПОРОГ_НИЗКОГО_ПЛАСТИКА;

      if (низкий && !низкиеКатушки.current.has(k.id)) {
        низкиеКатушки.current.add(k.id);
        уведомить(`🧵 ${k.brand} ${k.type}: остаток пластика ${Math.round(процент * 100)}%. Пора менять катушку.`, 'notifyLowFilament');
      }
      if (!низкий && низкиеКатушки.current.has(k.id)) {
        низкиеКатушки.current.delete(k.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [катушки, настройки.telegramEnabled, настройки.notifyLowFilament]);
}
