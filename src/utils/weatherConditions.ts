import { translateConditionIds } from './conditionTranslations'

export type WeatherCategory =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'wind'
  | 'rain'
  | 'showers-day'
  | 'showers-night'
  | 'snow'
  | 'snow-showers-day'
  | 'snow-showers-night'
  | 'thunder-rain'
  | 'thunder-showers-day'
  | 'thunder-showers-night'

export interface WeatherCondition {
  category: WeatherCategory
  color: string
  iconClass: string
}

const weatherColorMap: Record<WeatherCategory, string> = {
  'clear-day': '#ffd568',
  'clear-night': '#60a5fa',
  'partly-cloudy-day': '#94a3b8',
  'partly-cloudy-night': '#64748b',
  cloudy: '#475569',
  fog: '#9ca3af',
  wind: '#78909c',
  rain: '#1e40af',
  'showers-day': '#3b82f6',
  'showers-night': '#2563eb',
  snow: '#e2e8f0',
  'snow-showers-day': '#cbd5e1',
  'snow-showers-night': '#94a3b8',
  'thunder-rain': '#7c3aed',
  'thunder-showers-day': '#8b5cf6',
  'thunder-showers-night': '#6d28d9'
}

const weatherIconClassMap: Record<WeatherCategory, string> = {
  'clear-day': 'wi-day-sunny',
  'clear-night': 'wi-night-clear',
  'partly-cloudy-day': 'wi-day-cloudy',
  'partly-cloudy-night': 'wi-night-alt-cloudy',
  cloudy: 'wi-cloudy',
  fog: 'wi-fog',
  wind: 'wi-strong-wind',
  rain: 'wi-rain',
  'showers-day': 'wi-day-showers',
  'showers-night': 'wi-night-alt-showers',
  snow: 'wi-snow',
  'snow-showers-day': 'wi-day-snow',
  'snow-showers-night': 'wi-night-alt-snow',
  'thunder-rain': 'wi-thunderstorm',
  'thunder-showers-day': 'wi-day-thunderstorm',
  'thunder-showers-night': 'wi-night-alt-thunderstorm'
}

const DEFAULT_CATEGORY: WeatherCategory = 'cloudy'

const validCategories = new Set<string>(Object.keys(weatherColorMap))

export function getWeatherCondition(icon: string): WeatherCondition {
  if (!icon || typeof icon !== 'string' || !validCategories.has(icon)) {
    return {
      category: DEFAULT_CATEGORY,
      color: weatherColorMap[DEFAULT_CATEGORY],
      iconClass: weatherIconClassMap[DEFAULT_CATEGORY]
    }
  }

  const category = icon as WeatherCategory
  return {
    category,
    color: weatherColorMap[category],
    iconClass: weatherIconClassMap[category]
  }
}

export function getWeatherColor(icon: string): string {
  return getWeatherCondition(icon).color
}

export function getWeatherCategory(icon: string): WeatherCategory {
  return getWeatherCondition(icon).category
}

export function getWeatherIconClass(icon: string): string {
  return getWeatherCondition(icon).iconClass
}

export function getConditionLabel(description: string, _category: WeatherCategory): string {
  if (!description || typeof description !== 'string') return ''
  return translateConditionIds(description)
}
