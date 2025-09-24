export interface Location {
  lat: number
  lng: number
  name: string
}

export interface CurrentWeather {
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  visibility: number
  uvIndex: number
  description: string
  icon: string
  timestamp: number
}

export interface HourlyForecast {
  timestamp: number
  temperature: number
  feelsLike: number
  humidity: number
  precipitationProbability: number
  precipitationIntensity: number
  windSpeed: number
  windDirection: number
  description: string
  icon: string
}

export interface DailyForecast {
  date: string
  timestamp: number
  temperatureHigh: number
  temperatureLow: number
  precipitationProbability: number
  precipitationIntensity: number
  windSpeed: number
  windDirection: number
  humidity: number
  uvIndex: number
  description: string
  icon: string
}

export interface WeatherState {
  currentLocation: Location
  currentWeather: CurrentWeather | null
  hourlyForecast: HourlyForecast[]
  dailyForecast: DailyForecast[]
  isLoading: boolean
  error: string | null
}
