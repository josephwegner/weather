import type { CurrentWeather, HourlyForecast, DailyForecast, Location } from '../types/weather'

interface CacheEntry<T> {
  data: T
  timestamp: number
  location: Location
}

class CacheService {
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
  private currentWeatherCache = new Map<string, CacheEntry<CurrentWeather>>()
  private dailyForecastCache = new Map<string, CacheEntry<DailyForecast[]>>()
  private hourlyForecastByDateCache = new Map<string, CacheEntry<HourlyForecast[]>>()

  private getCacheKey(location: Location): string {
    return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`
  }

  private getDateCacheKey(location: Location, date: string): string {
    return `${this.getCacheKey(location)}-${date}`
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


  setDailyForecast(location: Location, data: DailyForecast[]): void {
    const key = this.getCacheKey(location)
    this.dailyForecastCache.set(key, {
      data,
      timestamp: Date.now(),
      location
    })
  }

  getDailyForecast(location: Location): DailyForecast[] | null {
    const key = this.getCacheKey(location)
    const entry = this.dailyForecastCache.get(key)

    if (!entry || this.isExpired(entry)) {
      return null
    }

    return entry.data
  }

  setHourlyForecastForDay(location: Location, date: string, data: HourlyForecast[]): void {
    const key = this.getDateCacheKey(location, date)
    this.hourlyForecastByDateCache.set(key, {
      data,
      timestamp: Date.now(),
      location
    })
  }

  getHourlyForecastForDay(location: Location, date: string): HourlyForecast[] | null {
    const key = this.getDateCacheKey(location, date)
    const entry = this.hourlyForecastByDateCache.get(key)

    if (!entry || this.isExpired(entry)) {
      return null
    }

    return entry.data
  }

  clear(): void {
    this.currentWeatherCache.clear()
    this.dailyForecastCache.clear()
    this.hourlyForecastByDateCache.clear()
  }

  getCacheStats() {
    const currentWeatherEntries = Array.from(this.currentWeatherCache.values())
    const dailyForecastEntries = Array.from(this.dailyForecastCache.values())
    const hourlyForecastByDateEntries = Array.from(this.hourlyForecastByDateCache.values())

    return {
      currentWeather: {
        total: currentWeatherEntries.length,
        fresh: currentWeatherEntries.filter(entry => !this.isExpired(entry)).length
      },
      dailyForecast: {
        total: dailyForecastEntries.length,
        fresh: dailyForecastEntries.filter(entry => !this.isExpired(entry)).length
      },
      hourlyForecastByDate: {
        total: hourlyForecastByDateEntries.length,
        fresh: hourlyForecastByDateEntries.filter(entry => !this.isExpired(entry)).length
      }
    }
  }
}

export const cacheService = new CacheService()