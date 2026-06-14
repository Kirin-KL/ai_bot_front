export const SETTINGS_GROUPS: Record<string, string[]> = {
    'Общие': [
      'bot_enabled',
      //'defaults.zone_id',
    ],
  
    'Запись': [
      //'recording.format',
      'recording.timeout_ms.account',
      'recording.timeout_ms.reading',
      'recording.timeout_ms.command',
      //'recording.silence_sec.account',
      //'recording.silence_sec.reading',
      //'recording.silence_sec.command',
    ],
  
    'Лимиты': [
      'limits.max_attempts',
    ],
  
    /*'Команды': [
      //'commands.yes',
      // 'commands.no',
      // 'commands.water',
      // 'commands.electricity',
    ],*/
  
    'Фразы': [
      // фразы добавятся автоматически
    ],
  }
  