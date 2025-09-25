export type WeatherCategory = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm'

export interface WeatherCondition {
  category: WeatherCategory
  color: string
}

const weatherColorMap: Record<WeatherCategory, string> = {
  clear: '#f59e0b', // Warm orange for sunny conditions
  cloudy: '#6b7280', // Gray matching existing theme
  rain: '#4a90e2', // Existing blue accent
  snow: '#e2e8f0', // Light gray/white
  storm: '#8b5cf6' // Purple for dramatic effect
}

const iconCategoryMap: Record<string, WeatherCategory> = {
  // Clear sky
  '01d': 'clear',
  '01n': 'clear',

  // Few clouds, scattered clouds, broken clouds, mist
  '02d': 'cloudy',
  '02n': 'cloudy',
  '03d': 'cloudy',
  '03n': 'cloudy',
  '04d': 'cloudy',
  '04n': 'cloudy',
  '50d': 'cloudy',
  '50n': 'cloudy',

  // Shower rain, rain
  '09d': 'rain',
  '09n': 'rain',
  '10d': 'rain',
  '10n': 'rain',

  // Thunderstorm
  '11d': 'storm',
  '11n': 'storm',

  // Snow
  '13d': 'snow',
  '13n': 'snow'
}

export function getWeatherCondition(icon: string): WeatherCondition {
  // Handle null, undefined, or empty string
  if (!icon || typeof icon !== 'string') {
    return {
      category: 'cloudy',
      color: weatherColorMap.cloudy
    }
  }

  const category = iconCategoryMap[icon] || 'cloudy' // Default to cloudy if unknown
  return {
    category,
    color: weatherColorMap[category]
  }
}

export function getWeatherColor(icon: string): string {
  return getWeatherCondition(icon).color
}

export function getWeatherCategory(icon: string): WeatherCategory {
  return getWeatherCondition(icon).category
}

export function getConditionLabel(description: string, category: WeatherCategory): string {
  if (!description || typeof description !== 'string') {
    return getCategoryLabel(category)
  }

  // Capitalize the first letter of each word
  return description
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getCategoryLabel(category: WeatherCategory): string {
  switch (category) {
    case 'clear':
      return 'Clear'
    case 'cloudy':
      return 'Cloudy'
    case 'rain':
      return 'Rain'
    case 'snow':
      return 'Snow'
    case 'storm':
      return 'Storm'
    default:
      return ''
  }
}
