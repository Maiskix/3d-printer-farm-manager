import func2url from '../../backend/func2url.json';

// ==================== КЛИЕНТ MOONRAKER API ====================

type Действие = 'info' | 'status' | 'start' | 'pause' | 'resume' | 'cancel' | 'list' | 'delete' | 'upload';

export interface ФайлПринтера {
  path: string;
  size: number;
  modified: number;
}

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
  } & Partial<ФайлПринтера>[];
}

const PROXY_URL = (func2url as Record<string, string>)['moonraker-proxy'];

interface ЗапросПараметры {
  ip: string;
  port: string;
  apiKey: string;
  action: Действие;
  filename?: string;
  fileContent?: string;
}

async function запрос(params: ЗапросПараметры): Promise<ОтветПрокси> {
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch {
    return { connected: false, error: 'Не удалось связаться с сервером проверки' };
  }
}

export async function запросMoonraker(
  ip: string,
  port: string,
  apiKey: string,
  action: 'info' | 'status' | 'start' | 'pause' | 'resume' | 'cancel',
): Promise<ОтветПрокси> {
  return запрос({ ip, port, apiKey, action });
}

// Запуск печати ранее загруженного файла (или последнего активного, если filename не указан)
export async function запуститьПечать(ip: string, port: string, apiKey: string, filename: string): Promise<ОтветПрокси> {
  return запрос({ ip, port, apiKey, action: 'start', filename });
}

// Получение списка G-код файлов, загруженных на принтер
export async function списокФайлов(ip: string, port: string, apiKey: string): Promise<ОтветПрокси> {
  return запрос({ ip, port, apiKey, action: 'list' });
}

// Удаление файла с принтера
export async function удалитьФайл(ip: string, port: string, apiKey: string, filename: string): Promise<ОтветПрокси> {
  return запрос({ ip, port, apiKey, action: 'delete', filename });
}

// Загрузка G-кода на принтер (fileContent — base64 без префикса data:)
export async function загрузитьФайл(
  ip: string,
  port: string,
  apiKey: string,
  filename: string,
  fileContent: string,
): Promise<ОтветПрокси> {
  return запрос({ ip, port, apiKey, action: 'upload', filename, fileContent });
}