import func2url from '../../backend/func2url.json';

// ==================== КЛИЕНТ MOONRAKER API ====================

type Действие = 'info' | 'status' | 'start' | 'pause' | 'resume' | 'cancel';

interface ОтветПрокси {
  connected: boolean;
  error?: string;
  data?: {
    result?: {
      status?: {
        extruder?: { temperature: number; target: number };
        heater_bed?: { temperature: number; target: number };
        print_stats?: { state: string; filename: string; print_duration: number };
        virtual_sdcard?: { progress: number };
      };
    };
  };
}

const PROXY_URL = (func2url as Record<string, string>)['moonraker-proxy'];

export async function запросMoonraker(
  ip: string,
  port: string,
  apiKey: string,
  action: Действие,
): Promise<ОтветПрокси> {
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port, apiKey, action }),
    });
    return await res.json();
  } catch {
    return { connected: false, error: 'Не удалось связаться с сервером проверки' };
  }
}
