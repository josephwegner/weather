<template>
  <div id="app" class="min-h-screen bg-slate-900 text-white">
    <div class="container mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="text-3xl font-light text-center">Personal Weather</h1>
      </header>

      <main>
        <div class="max-w-md mx-auto">
          <div class="bg-slate-800 rounded-lg p-6 mb-6">
            <div class="text-center">
              <div v-if="weatherStore.isLoading" class="text-6xl font-thin mb-2">--°</div>
              <div v-else-if="weatherStore.currentWeather" class="text-6xl font-thin mb-2">
                {{ weatherStore.currentWeather.temperature }}°
              </div>
              <div v-else class="text-6xl font-thin mb-2">--°</div>

              <div v-if="weatherStore.isLoading" class="text-slate-300">
                Loading weather data...
              </div>
              <div v-else-if="weatherStore.error" class="text-red-400">
                {{ weatherStore.error }}
              </div>
              <div v-else-if="weatherStore.currentWeather" class="text-slate-300">
                {{ weatherStore.currentWeather.description }}
              </div>
              <div v-else class="text-slate-300">No weather data available</div>
            </div>
          </div>

          <div class="bg-slate-800 rounded-lg p-6">
            <WeeklyForecast />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useWeatherStore } from './stores/weather'
  import WeeklyForecast from './components/WeeklyForecast.vue'

  const weatherStore = useWeatherStore()

  const fetchWeatherData = async () => {
    try {
      weatherStore.setLoading(true)
      weatherStore.setError(null)

      const currentWeather = await weatherStore.weatherApi.getCurrentWeather(
        weatherStore.currentLocation
      )
      weatherStore.setCurrentWeather(currentWeather)
    } catch (error) {
      weatherStore.setError(error instanceof Error ? error.message : 'Failed to fetch weather data')
    } finally {
      weatherStore.setLoading(false)
    }
  }

  onMounted(() => {
    fetchWeatherData()
  })
</script>
