export type WeatherCategory =
  | 'clear-day'
  | 'clear-night'
  | 'few-clouds'
  | 'scattered-clouds'
  | 'broken-clouds'
  | 'overcast-clouds'
  | 'mist'
  | 'light-rain'
  | 'heavy-rain'
  | 'snow'
  | 'thunderstorm'

export interface WeatherCondition {
  category: WeatherCategory
  color: string
  iconClass: string
}

const weatherColorMap: Record<WeatherCategory, string> = {
  'clear-day': '#ffd568', // Bright yellow-orange for sunny day
  'clear-night': '#60a5fa', // Soft blue for clear night
  'few-clouds': '#94a3b8', // Light gray for few clouds
  'scattered-clouds': '#64748b', // Medium gray for scattered clouds
  'broken-clouds': '#475569', // Darker gray for broken clouds
  'overcast-clouds': '#334155', // Dark gray for overcast
  mist: '#9ca3af', // Muted gray for mist/fog
  'light-rain': '#3b82f6', // Blue for light rain
  'heavy-rain': '#1e40af', // Darker blue for heavy rain
  snow: '#e2e8f0', // Light gray/white for snow
  thunderstorm: '#8b5cf6' // Purple for storms
}

const weatherIconClassMap: Record<WeatherCategory, string> = {
  'clear-day': 'wi-day-sunny',
  'clear-night': 'wi-night-clear',
  'few-clouds': 'wi-day-cloudy',
  'scattered-clouds': 'wi-cloudy',
  'broken-clouds': 'wi-cloudy',
  'overcast-clouds': 'wi-cloudy',
  mist: 'wi-fog',
  'light-rain': 'wi-rain',
  'heavy-rain': 'wi-rain',
  snow: 'wi-snow',
  thunderstorm: 'wi-thunderstorm'
}

const iconCategoryMap: Record<string, WeatherCategory> = {
  // Clear sky - differentiate day/night
  '01d': 'clear-day',
  '01n': 'clear-night',

  // Few clouds
  '02d': 'few-clouds',
  '02n': 'few-clouds',

  // Scattered clouds
  '03d': 'scattered-clouds',
  '03n': 'scattered-clouds',

  // Broken clouds
  '04d': 'broken-clouds',
  '04n': 'broken-clouds',

  // Mist
  '50d': 'mist',
  '50n': 'mist',

  // Light rain (shower rain)
  '09d': 'light-rain',
  '09n': 'light-rain',

  // Heavy rain
  '10d': 'heavy-rain',
  '10n': 'heavy-rain',

  // Thunderstorm
  '11d': 'thunderstorm',
  '11n': 'thunderstorm',

  // Snow
  '13d': 'snow',
  '13n': 'snow'
}

export function getWeatherCondition(icon: string): WeatherCondition {
  // Handle null, undefined, or empty string
  if (!icon || typeof icon !== 'string') {
    return {
      category: 'overcast-clouds',
      color: weatherColorMap['overcast-clouds'],
      iconClass: weatherIconClassMap['overcast-clouds']
    }
  }

  const category = iconCategoryMap[icon] || 'overcast-clouds' // Default to overcast-clouds if unknown
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
    case 'clear-day':
      return 'Clear'
    case 'clear-night':
      return 'Clear'
    case 'few-clouds':
      return 'Few Clouds'
    case 'scattered-clouds':
      return 'Scattered Clouds'
    case 'broken-clouds':
      return 'Broken Clouds'
    case 'overcast-clouds':
      return 'Overcast'
    case 'mist':
      return 'Mist'
    case 'light-rain':
      return 'Light Rain'
    case 'heavy-rain':
      return 'Heavy Rain'
    case 'snow':
      return 'Snow'
    case 'thunderstorm':
      return 'Thunderstorm'
    default:
      return ''
  }
}
