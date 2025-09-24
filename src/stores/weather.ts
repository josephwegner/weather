import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Location, CurrentWeather, HourlyForecast, DailyForecast } from '../types/weather'
import { WeatherApiService } from '../services/weatherApi'

export const useWeatherStore = defineStore('weather', () => {
  const currentLocation = ref<Location>({
    lat: 41.8781, // Chicago default
    lng: -87.6298,
    name: 'Chicago, IL'
  })

  const currentWeather = ref<CurrentWeather | null>(null)
  const hourlyForecast = ref<HourlyForecast[]>([])
  const dailyForecast = ref<DailyForecast[]>([])
  const hourlyForecastByDate = ref<Record<string, HourlyForecast[]>>({})
  const hourlyLoadingByDate = ref<Record<string, boolean>>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Weather API service instance
  const weatherApi = new WeatherApiService()

  const setLocation = (location: Location) => {
    currentLocation.value = location
  }

  const setCurrentWeather = (weather: CurrentWeather) => {
    currentWeather.value = weather
  }

  const setHourlyForecast = (forecast: HourlyForecast[]) => {
    hourlyForecast.value = forecast
  }

  const setDailyForecast = (forecast: DailyForecast[]) => {
    dailyForecast.value = forecast
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const loadDailyForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      const forecast = await weatherApi.getDailyForecast(currentLocation.value)
      setDailyForecast(forecast)
    } catch (err) {
      setError('Failed to load daily forecast')
    } finally {
      setLoading(false)
    }
  }

  const loadHourlyForecastForDay = async (date: string) => {
    try {
      hourlyLoadingByDate.value[date] = true
      const forecast = await weatherApi.getHourlyForecastForDay(currentLocation.value, date)
      hourlyForecastByDate.value[date] = forecast
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hourly forecast for day')
      throw err // Re-throw for component error handling
    } finally {
      hourlyLoadingByDate.value[date] = false
    }
  }

  const isLoadingHourlyForDate = (date: string) => {
    return hourlyLoadingByDate.value[date] || false
  }

  const clearLocationData = () => {
    currentWeather.value = null
    hourlyForecast.value = []
    dailyForecast.value = []
    hourlyForecastByDate.value = {}
    hourlyLoadingByDate.value = {}
    error.value = null
  }

  const setLocationAndClear = (location: Location) => {
    clearLocationData()
    setLocation(location)
  }

  const next7Days = computed(() => {
    return dailyForecast.value.slice(0, 7)
  })

  const todaysForecast = computed(() => {
    return dailyForecast.value[0] || null
  })

  const tomorrowsForecast = computed(() => {
    return dailyForecast.value[1] || null
  })

  return {
    currentLocation,
    currentWeather,
    hourlyForecast,
    dailyForecast,
    hourlyForecastByDate,
    hourlyLoadingByDate,
    isLoading,
    error,
    weatherApi,
    setLocation,
    setLocationAndClear,
    setCurrentWeather,
    setHourlyForecast,
    setDailyForecast,
    setLoading,
    setError,
    loadDailyForecast,
    loadHourlyForecastForDay,
    isLoadingHourlyForDate,
    clearLocationData,
    next7Days,
    todaysForecast,
    tomorrowsForecast
  }
})
