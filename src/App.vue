<template>
  <div id="app" class="min-h-screen bg-slate-900 text-white">
    <div class="max-w-md mx-auto">
      <main>
        <!-- Location Search Section -->
        <div class="bg-slate-800 p-4">
          <!-- Search bar and radar icon container -->
          <div class="flex items-center space-x-3">
            <!-- Search bar style location picker -->
            <div class="relative flex-1">
              <input
                v-model="locationDisplayText"
                @click="showLocationSearch = true"
                @focus="showLocationSearch = true"
                type="text"
                readonly
                :placeholder="weatherStore.currentLocation.name || 'Choose location...'"
                class="w-full py-2 pl-4 pr-12 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 text-sm cursor-pointer"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <!-- Radar Icon -->
            <RadarIcon
              :is-active="radarStore.isDrawerVisible"
              :is-loading="radarStore.isLoading"
              @click="handleRadarIconClick"
            />
          </div>

          <!-- Location Search Modal -->
          <div
            v-if="showLocationSearch"
            class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-8"
            @click="closeLocationSearchIfOutside"
          >
            <div
              class="bg-slate-800 rounded-lg max-w-md w-full mx-4 max-h-80 overflow-hidden"
              @click.stop
            >
              <div class="p-3">
                <LocationSearch v-model="selectedLocation" @locationSelected="onLocationSelected" />
              </div>
            </div>
          </div>
        </div>

        <!-- Current Weather Section -->
        <div class="bg-slate-800 p-4">
          <div class="text-center">
            <div v-if="weatherStore.isLoading" class="text-6xl font-thin mb-2">--°</div>
            <div v-else-if="weatherStore.currentWeather" class="text-6xl font-thin mb-2">
              {{ weatherStore.currentWeather.temperature }}°
            </div>
            <div v-else class="text-6xl font-thin mb-2">--°</div>

            <div v-if="weatherStore.isLoading" class="text-slate-300">Loading weather data...</div>
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
        <div class="bg-slate-800">
          <WeeklyForecast />
        </div>
      </main>
    </div>

    <!-- Radar Drawer -->
    <RadarDrawer
      :visible="radarStore.isDrawerVisible"
      :is-loading="radarStore.isLoading"
      :error="radarStore.error"
      :location="weatherStore.currentLocation"
      :active-layer-types="radarStore.activeLayerTypes"
      :is-animation-playing="radarStore.isAnimationPlaying"
      :animation-speed="radarStore.animationSpeed"
      :current-frame-index="radarStore.currentFrameIndex"
      :frame-count="radarStore.frames.length"
      @close="handleRadarDrawerClose"
      @layer-toggle="handleLayerToggle"
      @animation-toggle="handleAnimationToggle"
      @speed-change="handleSpeedChange"
      @frame-change="handleFrameChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import type { Location } from './types/weather'
  import type { RadarLayerType } from './types/radar'
  import { useWeatherStore } from './stores/weather'
  import { useRadarStore } from './stores/radar'
  import WeeklyForecast from './components/WeeklyForecast.vue'
  import LocationSearch from './components/LocationSearch.vue'
  import RadarIcon from './components/RadarIcon.vue'
  import RadarDrawer from './components/RadarDrawer.vue'

  const weatherStore = useWeatherStore()
  const radarStore = useRadarStore()
  const showLocationSearch = ref(false)
  const selectedLocation = ref<Location | null>(null)
  const locationDisplayText = ref('')

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

  const closeLocationSearchIfOutside = (event: Event) => {
    if (event.target === event.currentTarget) {
      showLocationSearch.value = false
    }
  }

  const onLocationSelected = async (location: Location) => {
    // Update the weather store with new location and reload daily forecast
    await weatherStore.setLocationAndReload(location)

    // Update the display text and hide location search
    locationDisplayText.value = location.name
    showLocationSearch.value = false

    // Fetch current weather data for new location
    fetchWeatherData()
  }

  // Radar event handlers
  const handleRadarIconClick = async () => {
    if (!radarStore.isDrawerVisible) {
      // Load radar data when opening drawer
      await radarStore.loadRadarFrames(weatherStore.currentLocation)
    }
    radarStore.toggleDrawer()
  }

  const handleRadarDrawerClose = () => {
    radarStore.closeDrawer()
  }

  const handleLayerToggle = (layerType: RadarLayerType, enabled: boolean) => {
    if (enabled) {
      radarStore.addLayerType(layerType)
    } else {
      radarStore.removeLayerType(layerType)
    }
    // Reload radar data with new layer configuration
    radarStore.loadRadarFrames(weatherStore.currentLocation)
  }

  const handleAnimationToggle = () => {
    radarStore.toggleAnimation()
  }

  const handleSpeedChange = (speed: number) => {
    radarStore.setAnimationSpeed(speed)
  }

  const handleFrameChange = (frameIndex: number) => {
    radarStore.setCurrentFrameIndex(frameIndex)
  }

  onMounted(() => {
    fetchWeatherData()
  })
</script>
