import func2url from '../../backend/func2url.json';

// ==================== КЛИЕНТ TELEGRAM УВЕДОМЛЕНИЙ ====================

interface ОтветTelegram {
  ok: boolean;
  error?: string;
}

const NOTIFY_URL = (func2url as Record<string, string>)['telegram-notify'];

export async function отправитьTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<ОтветTelegram> {
  try {
    const res = await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, chatId, text }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Не удалось связаться с сервером отправки' };
  }
}
