<template>
  <div id="app" class="min-h-screen bg-slate-900 text-white">
    <div class="container mx-auto px-4 py-8">
      <main>
        <div class="max-w-md mx-auto">
          <!-- Location Search Section -->
          <div class="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 class="text-lg font-medium mb-4 text-slate-200">Location</h2>
            <div class="flex items-center justify-between mb-4">
              <div class="text-white font-medium">{{ weatherStore.currentLocation.name }}</div>
              <button
                @click="toggleLocationSearch"
                class="text-blue-400 hover:text-blue-300 text-sm"
              >
                {{ showLocationSearch ? 'Cancel' : 'Change' }}
              </button>
            </div>

            <LocationSearch
              v-if="showLocationSearch"
              v-model="selectedLocation"
              @locationSelected="onLocationSelected"
              class="mt-4"
            />
          </div>

          <!-- Current Weather Section -->
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

          <!-- Forecast Section -->
          <div class="bg-slate-800 rounded-lg p-6">
            <WeeklyForecast />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import type { Location } from './types/weather'
  import { useWeatherStore } from './stores/weather'
  import WeeklyForecast from './components/WeeklyForecast.vue'
  import LocationSearch from './components/LocationSearch.vue'

  const weatherStore = useWeatherStore()
  const showLocationSearch = ref(false)
  const selectedLocation = ref<Location | null>(null)

  const fetchWeatherData = async () => {
    try {
      weatherStore.setLoading(true)
      weatherStore.setError(null)

      const currentWeather = await weatherStore.weatherApiService.getCurrentWeather(
        weatherStore.currentLocation
      )
      weatherStore.setCurrentWeather(currentWeather)
    } catch (error) {
      weatherStore.setError(error instanceof Error ? error.message : 'Failed to fetch weather data')
    } finally {
      weatherStore.setLoading(false)
    }
  }

  const toggleLocationSearch = () => {
    showLocationSearch.value = !showLocationSearch.value
  }

  const onLocationSelected = async (location: Location) => {
    // Update the weather store with new location and reload daily forecast
    await weatherStore.setLocationAndReload(location)

    // Hide location search
    showLocationSearch.value = false

    // Fetch current weather data for new location
    fetchWeatherData()
  }

  onMounted(() => {
    fetchWeatherData()
  })
</script>
