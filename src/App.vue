<template>
  <div
    id="app"
    class="min-h-screen bg-slate-900 text-white"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
  >
    <div class="max-w-md mx-auto">
      <main>
        <RadarDrawer
          :is-open="isRadarOpen"
          :location="weatherStore.currentLocation"
          @close="isRadarOpen = false"
        />

        <!-- Pull to Refresh Indicator -->
        <div
          class="pull-refresh-indicator"
          :class="{ 'pull-refresh-indicator--refreshing': isRefreshing }"
          :style="{ height: pullIndicatorHeight + 'px', opacity: pullIndicatorOpacity }"
        >
          <div class="pull-refresh-indicator__content">
            <svg
              v-if="!isRefreshing"
              class="pull-refresh-arrow"
              :class="{ 'pull-refresh-arrow--flipped': isPastThreshold }"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <svg
              v-else
              class="pull-refresh-spinner"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              />
            </svg>
            <span class="text-xs text-slate-400 ml-2">
              {{
                isRefreshing
                  ? 'Refreshing...'
                  : isPastThreshold
                    ? 'Release to refresh'
                    : 'Pull to refresh'
              }}
            </span>
          </div>
        </div>

        <!-- Location Search Section -->
        <div class="bg-slate-800 p-4">
          <!-- Search bar + radar icon -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input
                v-model="locationDisplayText"
                @click="showLocationSearch = true"
                @focus="showLocationSearch = true"
                type="text"
                readonly
                :placeholder="weatherStore.currentLocation.name || 'Choose location...'"
                class="w-full py-2 pl-4 pr-10 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 text-sm cursor-pointer"
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
            <button
              class="radar-toggle"
              @click.stop="isRadarOpen = !isRadarOpen"
              aria-label="Open radar map"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2" />
                <circle cx="12" cy="12" r="6" stroke-width="2" />
                <circle cx="12" cy="12" r="2" stroke-width="2" />
                <path stroke-width="2" d="M12 2v4M12 18v4" />
              </svg>
            </button>
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
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import type { Location } from './types/weather'
  import { useWeatherStore } from './stores/weather'
  import { cacheService } from './services/cache'
  import WeeklyForecast from './components/WeeklyForecast.vue'
  import LocationSearch from './components/LocationSearch.vue'
  import RadarDrawer from './components/RadarDrawer.vue'

  const weatherStore = useWeatherStore()
  const isRadarOpen = ref(false)
  const showLocationSearch = ref(false)
  const selectedLocation = ref<Location | null>(null)
  const locationDisplayText = ref('')

  // Pull-to-refresh state
  const pullStartY = ref(0)
  const pullDistance = ref(0)
  const isPulling = ref(false)
  const isRefreshing = ref(false)
  const PULL_THRESHOLD = 60
  const DAMPEN_FACTOR = 0.4

  const isPastThreshold = computed(() => pullDistance.value >= PULL_THRESHOLD)
  const pullIndicatorHeight = computed(() => Math.min(pullDistance.value, 80))
  const pullIndicatorOpacity = computed(() => Math.min(pullDistance.value / PULL_THRESHOLD, 1))

  const onTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing.value) {
      pullStartY.value = e.touches[0].clientY
      isPulling.value = true
    }
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!isPulling.value) return
    const delta = e.touches[0].clientY - pullStartY.value
    if (delta > 0 && window.scrollY === 0) {
      pullDistance.value = delta * DAMPEN_FACTOR
    } else {
      pullDistance.value = 0
    }
  }

  const onTouchEnd = async () => {
    if (!isPulling.value) return
    isPulling.value = false

    if (isPastThreshold.value) {
      isRefreshing.value = true
      pullDistance.value = PULL_THRESHOLD
      await refreshData()
      isRefreshing.value = false
    }

    pullDistance.value = 0
  }

  const refreshData = async () => {
    cacheService.clear()
    await Promise.all([fetchWeatherData(), weatherStore.loadDailyForecast()])
  }

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

  onMounted(() => {
    fetchWeatherData()
  })
</script>

<style scoped>
  .radar-toggle {
    flex-shrink: 0;
    color: rgb(148, 163, 184);
    padding: 6px;
    border-radius: 8px;
    background: rgb(51, 65, 85);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pull-refresh-indicator {
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      height 0.2s ease,
      opacity 0.2s ease;
  }

  .pull-refresh-indicator--refreshing {
    transition: none;
  }

  .pull-refresh-indicator__content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pull-refresh-arrow {
    color: #94a3b8;
    transition: transform 0.2s ease;
  }

  .pull-refresh-arrow--flipped {
    transform: rotate(180deg);
  }

  .pull-refresh-spinner {
    color: #94a3b8;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
