<template>
  <div class="location-search">
    <!-- Search Input -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for a city or enter zip code..."
        class="w-full py-2 pl-8 pr-16 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 text-sm"
        @input="onSearchInput"
        @keydown.escape="clearSearch"
        @keydown.enter="selectFirstResult"
        @keydown.arrow-down="navigateResults(1)"
        @keydown.arrow-up="navigateResults(-1)"
      />

      <!-- Search Icon -->
      <div class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <!-- Current Location Icon -->
      <button
        @click="useCurrentLocation"
        :disabled="isGettingLocation"
        class="absolute right-8 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 disabled:text-slate-600"
        title="Use current location"
      >
        <svg
          v-if="!isGettingLocation"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <div
          v-if="isGettingLocation"
          class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"
        ></div>
      </button>

      <!-- Clear Button -->
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isSearching" class="mt-2 py-2 px-3 text-slate-400 text-sm">Searching...</div>

    <!-- Search Results -->
    <div
      v-if="showResults && searchResults.length > 0"
      class="mt-2 bg-slate-700 rounded-lg max-h-48 overflow-y-auto"
    >
      <button
        v-for="(result, index) in searchResults"
        :key="`search-${result.lat}-${result.lng}`"
        :class="[
          'w-full py-2 px-3 text-left hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-b-0',
          selectedResultIndex === index ? 'bg-slate-600' : ''
        ]"
        @click="selectLocation(result)"
      >
        <div class="text-white text-sm font-medium">{{ result.name }}</div>
        <div class="text-slate-400 text-xs truncate">{{ result.displayName }}</div>
      </button>
    </div>

    <!-- No Results -->
    <div
      v-if="showResults && searchResults.length === 0 && !isSearching && searchQuery"
      class="mt-2 py-2 px-3 text-slate-400 text-sm"
    >
      No locations found for "{{ searchQuery }}"
    </div>

    <!-- Error State -->
    <div v-if="searchError" class="mt-2 py-2 px-3 text-red-400 text-sm">
      {{ searchError }}
    </div>

    <!-- Recent Locations -->
    <div v-if="recentLocations.length > 0 && !showResults" class="mt-3">
      <h3 class="text-slate-300 text-xs font-medium mb-2 uppercase tracking-wide">Recent</h3>
      <div class="space-y-0.5">
        <button
          v-for="location in recentLocations"
          :key="`recent-${location.lat}-${location.lng}`"
          @click="selectRecentLocation(location)"
          class="w-full py-2 px-3 text-left bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          <div class="text-white text-sm">{{ location.name }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { debounce } from 'lodash-es'
  import type {
    Location,
    LocationSearchResult,
    RecentLocation,
    LocationError
  } from '../types/weather'
  import { geocodingService } from '../services/geocodingService'
  import { geolocationService } from '../services/geolocationService'
  import { locationStorageService } from '../services/locationStorageService'

  interface Props {
    modelValue?: Location | null
  }

  interface Emits {
    (e: 'update:modelValue', location: Location): void
    (e: 'locationSelected', location: Location): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Reactive state
  const searchQuery = ref('')
  const searchResults = ref<LocationSearchResult[]>([])
  const recentLocations = ref<RecentLocation[]>([])
  const isSearching = ref(false)
  const isGettingLocation = ref(false)
  const searchError = ref('')
  const selectedResultIndex = ref(-1)

  // Computed properties
  const showResults = computed(() => {
    return (
      searchQuery.value.length > 0 &&
      (searchResults.value.length > 0 || (!isSearching.value && searchQuery.value))
    )
  })

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      isSearching.value = false
      return
    }

    try {
      isSearching.value = true
      searchError.value = ''

      const results = await geocodingService.searchLocations({
        query: query.trim(),
        limit: 5
      })

      searchResults.value = results
      selectedResultIndex.value = -1
    } catch (error) {
      console.error('Search error:', error)
      searchError.value = error instanceof Error ? error.message : 'Failed to search locations'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)

  // Event handlers
  const onSearchInput = () => {
    selectedResultIndex.value = -1
    debouncedSearch(searchQuery.value)
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    selectedResultIndex.value = -1
    searchError.value = ''
  }

  const selectLocation = (result: LocationSearchResult) => {
    const location: Location = {
      lat: result.lat,
      lng: result.lng,
      name: result.name
    }

    // Add to recent locations
    locationStorageService.addRecentLocation(location)

    // Update recent locations display
    loadRecentLocations()

    // Clear search
    clearSearch()

    // Emit events
    emit('update:modelValue', location)
    emit('locationSelected', location)
  }

  const selectRecentLocation = (location: RecentLocation) => {
    const simpleLocation: Location = {
      lat: location.lat,
      lng: location.lng,
      name: location.name
    }

    // Update usage
    locationStorageService.addRecentLocation(simpleLocation)

    // Update recent locations display
    loadRecentLocations()

    // Emit events
    emit('update:modelValue', simpleLocation)
    emit('locationSelected', simpleLocation)
  }

  const selectFirstResult = () => {
    if (searchResults.value.length > 0) {
      selectLocation(searchResults.value[0])
    }
  }

  const navigateResults = (direction: number) => {
    if (searchResults.value.length === 0) return

    selectedResultIndex.value = Math.max(
      -1,
      Math.min(searchResults.value.length - 1, selectedResultIndex.value + direction)
    )

    if (selectedResultIndex.value >= 0) {
      selectLocation(searchResults.value[selectedResultIndex.value])
    }
  }

  const useCurrentLocation = async () => {
    try {
      isGettingLocation.value = true
      searchError.value = ''

      const result = await geolocationService.getCurrentLocation()
      const location = result.location

      // Add to recent locations
      locationStorageService.addRecentLocation(location)

      // Update recent locations display
      loadRecentLocations()

      // Emit events
      emit('update:modelValue', location)
      emit('locationSelected', location)
    } catch (error) {
      console.error('Geolocation error:', error)
      const locationError = error as LocationError
      searchError.value = locationError.message || 'Failed to get current location'
    } finally {
      isGettingLocation.value = false
    }
  }

  const loadRecentLocations = () => {
    recentLocations.value = locationStorageService.getRecentLocations()
  }

  // Lifecycle
  onMounted(() => {
    loadRecentLocations()
  })
</script>
