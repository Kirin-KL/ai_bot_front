export const SETTINGS_LABELS: Record<string, string> = {
    // -----------------------------
    // Общие
    // -----------------------------
    'bot_enabled': 'Включить голосового бота',
    'defaults.zone_id': 'ID зоны по умолчанию',
  
    // -----------------------------
    // Запись
    // -----------------------------
    'recording.format': 'Формат записи аудио',
  
    'recording.timeout_ms.account': 'Таймаут записи лицевого счёта (мс)',
    'recording.timeout_ms.reading': 'Таймаут записи показаний (мс)', 
    'recording.timeout_ms.command': 'Таймаут записи команд (мс)',
  
    'recording.silence_sec.account': 'Пауза тишины при вводе лицевого счёта (сек)',
    'recording.silence_sec.reading': 'Пауза тишины при вводе показаний (сек)',
    'recording.silence_sec.command': 'Пауза тишины при вводе команд (сек)',
  
    // -----------------------------
    // Лимиты
    // -----------------------------
    'limits.max_attempts': 'Максимальное количество попыток',
  
    // -----------------------------
    // Команды
    // -----------------------------
    'commands.yes': 'Команда «Да»',
    'commands.no': 'Команда «Нет»',
    'commands.water': 'Команда «Вода»',
    'commands.electricity': 'Команда «Электричество»',
  
    // -----------------------------
    // Фразы (все фразы ниже)
    // -----------------------------
    'phrases.bot_disabled': 'Фраза при недоступности сервиса',
    'phrases.welcome': 'Фраза приветствия',
    'phrases.repeat_account': 'Фраза: повторите лицевой счёт',
    'phrases.account_wrong_length': 'Фраза при неверной длинне лицевого счёта' + '\n' +
    '{count} - количество распознанных цифр при вводе лицевого счета',
    'phrases.confirm_account': 'Фраза подтверждения лицевого счёта',
    'phrases.account_confirm_fail': 'Фраза: не удалось подтвердить лицевой счёт',
    'phrases.account_not_obtained': 'Фраза: не удалось получить лицевой счёт',
    'phrases.account_not_found': 'Фраза: лицевой счёт не найден',
    'phrases.account_found_with_name': 'Фраза: лицевой счёт найден',
    'phrases.account_found': 'Фраза: лицевой счёт найден',
    'phrases.yes_no_not_recognized': 'Фраза: не удалось распознать ответ',
  
    'phrases.main_menu': 'Главное меню: фраза при переходе в главное меню',
    'phrases.main_menu_need_section': 'Главное меню: фраза выбора типа коммунального ресурса',
    'phrases.main_menu_not_recognized': 'Главное меню: команда не распознана',
  
    'phrases.no_meters': 'Фраза: счётчики не найдены',
    'phrases.no_water_meters': 'Фраза: счётчики воды не найдены',
    'phrases.no_electric_meters': 'Фраза: счётчики электроэнергии не найдены',
  
    'phrases.start_water': 'Фраза при начале передачи показаний воды',
    'phrases.start_electricity': 'Фраза при начале передачи показаний электроэнергии',
  
    'phrases.meter_intro': 'Фраза при вводе показаний по счётчику',
  
    'phrases.reading_not_recognized': 'Фраза при нераспознании показаний',
    'phrases.confirm_reading': 'Фраза подтверждения показаний',
    'phrases.reading_confirm_repeat': 'Фраза: повторим ввод показаний',
    'phrases.reading_confirm_fail': 'Фраза: не удалось подтвердить показания',
    'phrases.reading_meter_fail': 'Фраза: ошибка при получении показаний',
    'phrases.reading_saved': 'Фраза: показания приняты',
    'phrases.reading_save_error': 'Фраза: ошибка сохранения показаний',
    'phrases.reading_finish': 'Фраза завершения передачи показаний',
  
    'phrases.ask_electricity': 'Фраза: спросить о передаче показаний электроэнергии',
    'phrases.ask_water': 'Фраза: спросить о передаче показаний воды',
  
    'phrases.command_not_recognized_goodbye': 'Фраза: команда не распознана, завершение',
    'phrases.goodbye': 'Фраза прощания',
    'phrases.tech_error': 'Фраза: техническая ошибка',
  }

  export const SETTINGS_DESCRIPTIONS: Record<string, string> = {
    'phrases.account_wrong_length': '{count} — количество распознанных цифр при вводе лицевого счёта',
  
    'phrases.confirm_account':'{digits} — распознанные цифры лицевого счёта',
  
    'phrases.meter_intro': '{serial} — номер счётчика\n{type} — тип счётчика\n{name} — подпись счётчика',
  
    'phrases.reading_finish': '{count} — количество успешно принятых показаний',

    'phrases.account_found_with_name': '{full_name} — ФИО клиента - хозяина лицевого счета',
    
    'phrases.confirm_reading': '{digits} — распознанные цифры показаний',
  }
  
  