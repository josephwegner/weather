import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WeatherState, Location, CurrentWeather, HourlyForecast, DailyForecast } from '../types/weather'

export const useWeatherStore = defineStore('weather', () => {
  const currentLocation = ref<Location>({
    lat: 41.8781, // Chicago default
    lng: -87.6298,
    name: 'Chicago, IL'
  })

  const currentWeather = ref<CurrentWeather | null>(null)
  const hourlyForecast = ref<HourlyForecast[]>([])
  const dailyForecast = ref<DailyForecast[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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

  return {
    currentLocation,
    currentWeather,
    hourlyForecast,
    dailyForecast,
    isLoading,
    error,
    setLocation,
    setCurrentWeather,
    setHourlyForecast,
    setDailyForecast,
    setLoading,
    setError
  }
})