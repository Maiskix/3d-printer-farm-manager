import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { Принтер } from '@/lib/useStore';
import { списокФайлов, загрузитьФайл, удалитьФайл, запуститьПечать, ФайлПринтера } from '@/lib/moonraker';

interface Props {
  принтер: Принтер;
  onClose: () => void;
  onStarted: () => void;
}

// Читает файл как base64-строку (без префикса data:...)
function файлВBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PrinterFilesModal({ принтер, onClose, onStarted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [файлы, setФайлы] = useState<ФайлПринтера[]>([]);
  const [загрузкаСписка, setЗагрузкаСписка] = useState(true);
  const [загрузкаФайла, setЗагрузкаФайла] = useState(false);
  const [прогрессЗагрузки, setПрогрессЗагрузки] = useState(0);
  const [выбранныйДляСтарта, setВыбранныйДляСтарта] = useState<string | null>(null);

  const обновитьСписок = async () => {
    setЗагрузкаСписка(true);
    const ответ = await списокФайлов(принтер.ip, принтер.port, принтер.apiKey);
    setЗагрузкаСписка(false);

    if (!ответ.connected) {
      toast.error('Нет связи с принтером', { description: ответ.error });
      setФайлы([]);
      return;
    }
    const список = (ответ.data as unknown as ФайлПринтера[]) || [];
    setФайлы(Array.isArray(список) ? список : []);
  };

  useEffect(() => {
    обновитьСписок();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const выбратьФайл = () => inputRef.current?.click();

  const загрузить = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.gcode')) {
      toast.error('Нужен файл с расширением .gcode');
      return;
    }

    setЗагрузкаФайла(true);
    setПрогрессЗагрузки(10);
    const base64 = await файлВBase64(file);
    setПрогрессЗагрузки(55);

    const ответ = await загрузитьФайл(принтер.ip, принтер.port, принтер.apiKey, file.name, base64);
    setПрогрессЗагрузки(100);

    if (!ответ.connected) {
      toast.error('Загрузка не удалась', { description: ответ.error });
    } else {
      toast.success(`Файл «${file.name}» загружен на принтер`);
      setВыбранныйДляСтарта(file.name);
      await обновитьСписок();
    }

    setЗагрузкаФайла(false);
    setПрогрессЗагрузки(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const начатьПечать = async (filename: string) => {
    const ответ = await запуститьПечать(принтер.ip, принтер.port, принтер.apiKey, filename);
    if (!ответ.connected) {
      toast.error('Не удалось начать печать', { description: ответ.error });
      return;
    }
    toast.success(`Печать «${filename}» запущена`);
    onStarted();
    onClose();
  };

  const удалить = async (filename: string) => {
    const ответ = await удалитьФайл(принтер.ip, принтер.port, принтер.apiKey, filename);
    if (!ответ.connected) {
      toast.error('Не удалось удалить файл', { description: ответ.error });
      return;
    }
    toast.success('Файл удалён');
    setФайлы(файлы.filter((f) => f.path !== filename));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="animate-fade-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-light tracking-wide text-farm-blue">Файлы печати</h3>
            <p className="text-xs text-muted-foreground">{принтер.name} • {принтер.ip}:{принтер.port}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-transform active:scale-90 hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        <input ref={inputRef} type="file" accept=".gcode" className="hidden" onChange={загрузить} />

        <button
          onClick={выбратьФайл}
          disabled={загрузкаФайла}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-farm-blue py-3 text-sm font-medium uppercase tracking-wide text-white transition-transform active:scale-95 disabled:opacity-60"
        >
          <Icon name={загрузкаФайла ? 'Loader2' : 'Upload'} size={16} className={загрузкаФайла ? 'animate-spin' : ''} />
          {загрузкаФайла ? 'Загрузка...' : 'Загрузить G-код'}
        </button>

        {загрузкаФайла && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-farm-blue transition-all duration-300" style={{ width: `${прогрессЗагрузки}%` }} />
          </div>
        )}

        {выбранныйДляСтарта && !загрузкаФайла && (
          <div className="animate-fade-in mt-3 flex items-center justify-between rounded-xl bg-farm-blue/10 px-3 py-2.5">
            <span className="truncate text-sm text-farm-blue">{выбранныйДляСтарта}</span>
            <button
              onClick={() => начатьПечать(выбранныйДляСтарта)}
              className="ml-2 flex shrink-0 items-center gap-1 rounded-lg bg-farm-blue px-3 py-1.5 text-[11px] font-medium uppercase text-white transition-transform active:scale-95"
            >
              <Icon name="Play" size={12} /> Начать печать
            </button>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Файлы на принтере</p>

          {загрузкаСписка ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : файлы.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
              <Icon name="FileX" size={26} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">На принтере нет G-код файлов</p>
            </div>
          ) : (
            <div className="space-y-2">
              {файлы.map((f) => (
                <div key={f.path} className="group flex items-center justify-between rounded-xl bg-background px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{f.path}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{Math.round((f.size || 0) / 1024)} КБ</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => начатьПечать(f.path)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-farm-blue text-white transition-transform active:scale-90"
                      title="Начать печать"
                    >
                      <Icon name="Play" size={13} />
                    </button>
                    <button
                      onClick={() => удалить(f.path)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
                      title="Удалить"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Icon name="Info" size={13} className="mt-0.5 shrink-0" />
          Те же файлы доступны через веб-интерфейс Mainsail/Fluidd по адресу http://{принтер.ip}
        </p>
      </div>
    </div>
  );
}
