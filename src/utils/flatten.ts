export function flattenSettings(obj: any, prefix = ''): Record<string, any> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
  
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(acc, flattenSettings(value, fullKey))
      } else {
        acc[fullKey] = value
      }
  
      return acc
    }, {} as Record<string, any>)
  }
  