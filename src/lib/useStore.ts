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
  hours: number;
  job: string;
  eta: string;
}

export interface Катушка {
  id: number;
  brand: string;
  type: string;
  color: string;
  remain: number;
  weightG: number;
}

export interface ЗадачаТО {
  id: number;
  task: string;
  printer: string;
  due: number;
}

export interface Запчасть {
  id: number;
  name: string;
  qty: number;
  min: number;
}

export interface Печать {
  id: number;
  model: string;
  date: string;
  weight: number;
  cost: number;
  status: 'успех' | 'провал';
}

// ==================== СУЩЕСТВУЮЩИЕ ПРИНТЕРЫ (стартовый набор) ====================

const ПРИНТЕРЫ_ПО_УМОЛЧАНИЮ: Принтер[] = [
  { id: 1, name: 'APERTURE-01', model: 'Voron 2.4', status: 'простой', progress: 0, nozzle: 24, bed: 23, ip: '192.168.1.101', port: '7125', hours: 1284, job: '—', eta: '—' },
  { id: 2, name: 'APERTURE-02', model: 'Ender 3 V3', status: 'простой', progress: 0, nozzle: 24, bed: 23, ip: '192.168.1.102', port: '7125', hours: 842, job: '—', eta: '—' },
  { id: 3, name: 'APERTURE-03', model: 'Prusa MK4', status: 'простой', progress: 0, nozzle: 22, bed: 22, ip: '192.168.1.103', port: '7125', hours: 2013, job: '—', eta: '—' },
];

const КАТУШКИ_ПО_УМОЛЧАНИЮ: Катушка[] = [
  { id: 1, brand: 'eSun', type: 'PLA+', color: '#FF6B00', remain: 82, weightG: 820 },
  { id: 2, brand: 'Polymaker', type: 'PETG', color: '#4FC3F7', remain: 45, weightG: 450 },
  { id: 3, brand: 'Bambu', type: 'ABS', color: '#2C2C2C', remain: 18, weightG: 180 },
];

const ТО_ПО_УМОЛЧАНИЮ: ЗадачаТО[] = [
  { id: 1, task: 'Смазка направляющих', printer: 'APERTURE-01', due: 84 },
  { id: 2, task: 'Замена сопла', printer: 'APERTURE-03', due: 96 },
  { id: 3, task: 'Натяжение ремней', printer: 'APERTURE-02', due: 42 },
];

const ЗАПЧАСТИ_ПО_УМОЛЧАНИЮ: Запчасть[] = [
  { id: 1, name: 'Сопло 0.4мм латунь', qty: 8, min: 5 },
  { id: 2, name: 'Ремень GT2 6мм', qty: 2, min: 3 },
  { id: 3, name: 'Подшипник 608ZZ', qty: 14, min: 8 },
];

const ЖУРНАЛ_ПО_УМОЛЧАНИЮ: Печать[] = [
  { id: 1, model: 'aperture_cube', date: '03.07', weight: 42, cost: 18, status: 'успех' },
  { id: 2, model: 'turret_body', date: '01.07', weight: 210, cost: 89, status: 'успех' },
];

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
};
