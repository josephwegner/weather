import type { CurrentWeather, HourlyForecast, Location } from '../types/weather'

interface CacheEntry<T> {
  data: T
  timestamp: number
  location: Location
}

class CacheService {
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
  private currentWeatherCache = new Map<string, CacheEntry<CurrentWeather>>()
  private hourlyForecastCache = new Map<string, CacheEntry<HourlyForecast[]>>()

  private getCacheKey(location: Location): string {
    return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.CACHE_DURATION
  }

  setCurrentWeather(location: Location, data: CurrentWeather): void {
    const key = this.getCacheKey(location)
    this.currentWeatherCache.set(key, {
      data,
      timestamp: Date.now(),
      location
    })
  }

  getCurrentWeather(location: Location): CurrentWeather | null {
    const key = this.getCacheKey(location)
    const entry = this.currentWeatherCache.get(key)

    if (!entry || this.isExpired(entry)) {
      return null
    }

    return entry.data
  }

  setHourlyForecast(location: Location, data: HourlyForecast[]): void {
    const key = this.getCacheKey(location)
    this.hourlyForecastCache.set(key, {
      data,
      timestamp: Date.now(),
      location
    })
  }

  getHourlyForecast(location: Location): HourlyForecast[] | null {
    const key = this.getCacheKey(location)
    const entry = this.hourlyForecastCache.get(key)

    if (!entry || this.isExpired(entry)) {
      return null
    }

    return entry.data
  }

  clear(): void {
    this.currentWeatherCache.clear()
    this.hourlyForecastCache.clear()
  }

  getCacheStats() {
    const currentWeatherEntries = Array.from(this.currentWeatherCache.values())
    const hourlyForecastEntries = Array.from(this.hourlyForecastCache.values())

    return {
      currentWeather: {
        total: currentWeatherEntries.length,
        fresh: currentWeatherEntries.filter(entry => !this.isExpired(entry)).length
      },
      hourlyForecast: {
        total: hourlyForecastEntries.length,
        fresh: hourlyForecastEntries.filter(entry => !this.isExpired(entry)).length
      }
    }
  }
}

export const cacheService = new CacheService()