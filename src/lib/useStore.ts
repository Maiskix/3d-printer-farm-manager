import { useState, useEffect } from 'react';

// ==================== ТИПЫ ДАННЫХ ====================

export interface Принтер {
  id: number;
  name: string;
  model: string;
  status: 'печать' | 'пауза' | 'простой' | 'ошибка';
  progress: number;
  nozzle: number;
  bed: number;
  ip: string;
  port: string;
  apiKey: string;
  totalHours: number;
  lastServiceDate: string;
  nozzleSize: number;
  powerWatt: number;
  cost: number;
  lifetimeHours: number;
  job: string;
  eta: string;
}

export interface Катушка {
  id: number;
  brand: string;
  type: string;
  color: string;
  totalWeight: number;
  currentWeight: number;
  pricePerKg: number;
  purchaseDate: string;
  vendor: string;
  pool: string;
  printerId: number | null;
}

export interface ЗадачаТО {
  id: number;
  printerName: string;
  taskType: string;
  intervalHours: number;
  lastPerformedHours: number;
  nextDueHours: number;
}

export interface Запчасть {
  id: number;
  name: string;
  qty: number;
  min: number;
  compatibleWith: string;
}

export interface Печать {
  id: number;
  printerName: string;
  filamentId: number | null;
  model: string;
  date: string;
  weightUsed: number;
  lengthUsed: number;
  durationMin: number;
  costFilament: number;
  costEnergy: number;
  status: 'успех' | 'провал';
}

export interface Настройки {
  tariffKwh: number;
  markupPercent: number;
  telegramEnabled: boolean;
  telegramToken: string;
  telegramChatId: string;
  notifyPrintDone: boolean;
  notifyError: boolean;
  notifyLowFilament: boolean;
  notifyMaintenance: boolean;
  notifyLowParts: boolean;
}

// ==================== СУЩЕСТВУЮЩИЕ ПРИНТЕРЫ (стартовый набор) ====================

const ПРИНТЕРЫ_ПО_УМОЛЧАНИЮ: Принтер[] = [
  { id: 1, name: 'Принтер-01', model: 'Voron 2.4', status: 'простой', progress: 0, nozzle: 24, bed: 23, ip: '192.168.1.101', port: '7125', apiKey: '', totalHours: 1284, lastServiceDate: '2026-05-01', nozzleSize: 0.4, powerWatt: 350, cost: 55000, lifetimeHours: 8000, job: '—', eta: '—' },
  { id: 2, name: 'Принтер-02', model: 'Ender 3 V3', status: 'простой', progress: 0, nozzle: 24, bed: 23, ip: '192.168.1.102', port: '7125', apiKey: '', totalHours: 842, lastServiceDate: '2026-04-12', nozzleSize: 0.4, powerWatt: 220, cost: 22000, lifetimeHours: 6000, job: '—', eta: '—' },
  { id: 3, name: 'Принтер-03', model: 'Prusa MK4', status: 'простой', progress: 0, nozzle: 22, bed: 22, ip: '192.168.1.103', port: '7125', apiKey: '', totalHours: 2013, lastServiceDate: '2026-03-20', nozzleSize: 0.4, powerWatt: 240, cost: 75000, lifetimeHours: 9000, job: '—', eta: '—' },
];

const КАТУШКИ_ПО_УМОЛЧАНИЮ: Катушка[] = [
  { id: 1, brand: 'eSun', type: 'PLA+', color: '#1565C0', totalWeight: 1000, currentWeight: 820, pricePerKg: 1400, purchaseDate: '2026-06-01', vendor: 'Top3DShop', pool: 'Синий PLA', printerId: 1 },
  { id: 2, brand: 'Polymaker', type: 'PETG', color: '#26C6DA', totalWeight: 1000, currentWeight: 450, pricePerKg: 1900, purchaseDate: '2026-05-15', vendor: 'Filamentarno', pool: 'Бирюзовый PETG', printerId: null },
  { id: 3, brand: 'Bambu', type: 'ABS', color: '#333333', totalWeight: 1000, currentWeight: 180, pricePerKg: 1700, purchaseDate: '2026-04-20', vendor: 'Bambu Lab', pool: 'Чёрный ABS', printerId: null },
];

const ТО_ПО_УМОЛЧАНИЮ: ЗадачаТО[] = [
  { id: 1, printerName: 'Принтер-01', taskType: 'Смазка направляющих', intervalHours: 200, lastPerformedHours: 1116, nextDueHours: 1316 },
  { id: 2, printerName: 'Принтер-03', taskType: 'Замена сопла', intervalHours: 250, lastPerformedHours: 1900, nextDueHours: 2150 },
  { id: 3, printerName: 'Принтер-02', taskType: 'Натяжение ремней', intervalHours: 150, lastPerformedHours: 780, nextDueHours: 930 },
];

const ЗАПЧАСТИ_ПО_УМОЛЧАНИЮ: Запчасть[] = [
  { id: 1, name: 'Сопло 0.4мм латунь', qty: 8, min: 5, compatibleWith: 'Voron, Ender, Prusa' },
  { id: 2, name: 'Ремень GT2 6мм', qty: 2, min: 3, compatibleWith: 'Voron 2.4' },
  { id: 3, name: 'Подшипник 608ZZ', qty: 14, min: 8, compatibleWith: 'Универсальный' },
];

const ЖУРНАЛ_ПО_УМОЛЧАНИЮ: Печать[] = [
  { id: 1, printerName: 'Принтер-01', filamentId: 1, model: 'test_cube', date: '2026-07-01', weightUsed: 42, lengthUsed: 14, durationMin: 65, costFilament: 59, costEnergy: 4, status: 'успех' },
  { id: 2, printerName: 'Принтер-03', filamentId: 2, model: 'bracket_v2', date: '2026-06-28', weightUsed: 210, lengthUsed: 70, durationMin: 240, costFilament: 399, costEnergy: 14, status: 'успех' },
];

const НАСТРОЙКИ_ПО_УМОЛЧАНИЮ: Настройки = {
  tariffKwh: 5.5,
  markupPercent: 30,
  telegramEnabled: false,
  telegramToken: '',
  telegramChatId: '',
  notifyPrintDone: true,
  notifyError: true,
  notifyLowFilament: true,
  notifyMaintenance: true,
  notifyLowParts: true,
};

// ==================== ХУК ЛОКАЛЬНОГО ХРАНИЛИЩА ====================

export function useStore<T>(ключ: string, начальное: T) {
  const [данные, setДанные] = useState<T>(() => {
    try {
      const сохранённое = localStorage.getItem(ключ);
      return сохранённое ? (JSON.parse(сохранённое) as T) : начальное;
    } catch {
      return начальное;
    }
  });

  useEffect(() => {
    localStorage.setItem(ключ, JSON.stringify(данные));
  }, [ключ, данные]);

  return [данные, setДанные] as const;
}

export const ДЕФОЛТЫ = {
  принтеры: ПРИНТЕРЫ_ПО_УМОЛЧАНИЮ,
  катушки: КАТУШКИ_ПО_УМОЛЧАНИЮ,
  то: ТО_ПО_УМОЛЧАНИЮ,
  запчасти: ЗАПЧАСТИ_ПО_УМОЛЧАНИЮ,
  журнал: ЖУРНАЛ_ПО_УМОЛЧАНИЮ,
  настройки: НАСТРОЙКИ_ПО_УМОЛЧАНИЮ,
};