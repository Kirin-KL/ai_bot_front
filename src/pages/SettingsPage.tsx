import { Input } from '@/components/ui/Input'

const STUB_SETTINGS = [
  {
    key: 'account_attempts',
    label: 'Количество попыток при распознавании лицевого счёта',
    value: '3',
    type: 'number',
  },
  {
    key: 'welcome',
    label: 'Текст приветственной речи',
    value: 'Добро пожаловать в систему приёма показаний.',
    type: 'textarea',
  },
  {
    key: 'farewell',
    label: 'Текст прощальной речи',
    value: 'Спасибо за обращение. До свидания.',
    type: 'textarea',
  },
  {
    key: 'main_menu',
    label: 'Текст речи главного меню',
    value: 'Выберите действие: передать показания или связаться с оператором.',
    type: 'textarea',
  },
  {
    key: 'water',
    label: 'Текст при приёме показаний счётчиков воды',
    value: 'Назовите показания счётчика холодной или горячей воды.',
    type: 'textarea',
  },
  {
    key: 'electricity',
    label: 'Текст при приёме показаний счётчиков электроэнергии',
    value: 'Назовите показания счётчика электроэнергии.',
    type: 'textarea',
  },
]

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Настройки системы</h1>
        <p className="mt-1 text-slate-500">
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {STUB_SETTINGS.map((s) =>
          s.type === 'textarea' ? (
            <label key={s.key} className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">
                {s.label}
              </span>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
                defaultValue={s.value}
                disabled
              />
            </label>
          ) : (
            <Input
              key={s.key}
              label={s.label}
              defaultValue={s.value}
              disabled
            />
          ),
        )}
      </div>
    </div>
  )
}
