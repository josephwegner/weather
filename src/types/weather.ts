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
  precipitationType?: string
  windSpeed: number
  windDirection: number
  windGust: number
  pressure: number
  uvIndex: number
  cloudCover: number
  visibility: number
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

export interface LocationSearchResult {
  lat: number
  lng: number
  name: string
  displayName: string
  country?: string
  state?: string
  city?: string
  type: 'city' | 'county' | 'state' | 'country' | 'postcode' | 'address'
}

export interface GeocodingResponse {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
  address?: {
    house_number?: string
    road?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
}

export interface RecentLocation extends Location {
  lastUsed: number
  usageCount: number
}

export interface LocationStorageState {
  currentLocation: Location | null
  recentLocations: RecentLocation[]
  maxRecentLocations: number
}

export interface GeolocationResult {
  location: Location
  accuracy: number
}

export interface LocationError {
  type:
    | 'GEOLOCATION_UNAVAILABLE'
    | 'GEOLOCATION_PERMISSION_DENIED'
    | 'GEOLOCATION_TIMEOUT'
    | 'GEOCODING_FAILED'
    | 'NETWORK_ERROR'
  message: string
  originalError?: any
}

export interface LocationSearchOptions {
  query: string
  limit?: number
  countrycodes?: string
  language?: string
}
