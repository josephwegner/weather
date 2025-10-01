<template>
  <div
    v-show="visible || isClosing"
    :class="drawerClasses"
    @keydown.escape="handleClose"
    @keydown.space.prevent="handleSpaceKey"
    tabindex="0"
    class="radar-drawer"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
      <h3 class="text-lg font-semibold text-white">{{ location?.name || 'Weather Radar' }}</h3>
      <button
        @click="handleClose"
        class="close-btn p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
        aria-label="Close radar view"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Loading Indicator -->
    <div
      v-if="isLoading"
      class="loading-indicator absolute inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center z-20"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"
        ></div>
        <p class="text-white text-sm">Loading radar data...</p>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="error-message bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-4 py-3 text-sm"
    >
      {{ error }}
    </div>

    <!-- Map Container -->
    <div class="radar-map flex-1 relative">
      <div ref="mapContainer" class="w-full h-64 bg-slate-800"></div>
    </div>

    <!-- Bottom Animation Controls -->
    <div
      class="p-4 bg-slate-900 border-t-2 border-slate-600 shadow-xl"
      :class="{ 'opacity-50': isLoading }"
    >
      <!-- Radar Metric Pills (Single Selection) -->
      <div class="flex items-center space-x-2 mb-6 overflow-x-auto scrollbar-hide px-4">
        <div class="flex items-center space-x-2 min-w-max">
          <button
            v-for="layer in availableLayers"
            :key="layer.type"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer',
              activeLayerType === layer.type
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-white'
            ]"
            @click="handleLayerChange(layer.type)"
          >
            {{ layer.name.toUpperCase() }}
          </button>
        </div>
      </div>

      <!-- Timeline Controls -->
      <div class="flex items-center space-x-4">
        <!-- Play/Pause Button -->
        <button
          @click="handleAnimationToggle"
          class="flex-shrink-0 w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg v-if="!isAnimationPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
            />
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"
            />
          </svg>
        </button>

        <!-- Timeline Scrubber with Dots -->
        <div class="flex-1 relative">
          <!-- Frame position dots -->
          <div
            class="frame-dots absolute left-0 right-0 h-2 flex items-center justify-between px-1 pointer-events-none"
          >
            <div
              v-for="(frame, index) in frames"
              :key="index"
              :class="[
                'w-1 h-1 rounded-full transition-colors',
                frame.isPrediction ? 'bg-yellow-400' : 'bg-blue-400',
                index === currentFrameIndex ? 'ring-2 ring-white ring-opacity-75' : ''
              ]"
            ></div>
          </div>
          <!-- Slider -->
          <input
            type="range"
            min="0"
            :max="frameCount - 1"
            :value="currentFrameIndex"
            @input="handleFrameChange"
            class="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider relative z-10"
          />
        </div>
      </div>

      <!-- Time Display -->
      <div class="text-center mt-4">
        <span class="text-slate-400 text-sm">{{ formatFrameTime(currentFrameIndex) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
  import L from 'leaflet'
  import type { Map as LeafletMap } from 'leaflet'
  import type { Location } from '../types/weather'
  import type { RadarLayerType } from '../types/radar'
  import { radarService } from '../services/radarService'

  // Props
  interface Props {
    visible: boolean
    isLoading?: boolean
    error?: string | null
    location?: Location
    activeLayerType?: RadarLayerType
    isAnimationPlaying?: boolean
    animationSpeed?: number
    currentFrameIndex?: number
    frameCount?: number
    frames?: Array<{
      timestamp: number
      layers: Partial<Record<RadarLayerType, string>>
      isPrediction?: boolean
    }>
  }

  const props = withDefaults(defineProps<Props>(), {
    isLoading: false,
    error: null,
    location: () => ({ lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' }),
    activeLayerType: 'precipitation_intensity',
    isAnimationPlaying: false,
    animationSpeed: 1000,
    currentFrameIndex: 0,
    frameCount: 0,
    frames: () => []
  })

  // Emits
  const emit = defineEmits<{
    close: []
    'layer-change': [layerType: RadarLayerType]
    'animation-toggle': []
    'speed-change': [speed: number]
    'frame-change': [frameIndex: number]
  }>()

  // Refs
  const mapContainer = ref<HTMLElement>()
  const isClosing = ref(false)
  let map: LeafletMap | null = null
  let baseTileLayer: L.TileLayer | null = null
  const radarLayers: Record<RadarLayerType, L.TileLayer | null> = {
    precipitation_intensity: null,
    accumulated_rain: null,
    accumulated_snow: null,
    wind_speed: null,
    pressure: null,
    temperature: null,
    humidity: null,
    cloudiness: null
  }

  // Computed
  const drawerClasses = computed(() => {
    const classes = [
      'fixed',
      'top-0',
      'left-0',
      'right-0',
      'bg-slate-800',
      'shadow-lg',
      'z-50',
      'flex',
      'flex-col',
      'max-h-screen'
    ]

    if (props.visible && !isClosing.value) {
      classes.push('slide-down')
    } else if (!props.visible || isClosing.value) {
      classes.push('slide-up')
      if (!props.visible && !isClosing.value) {
        classes.push('hidden')
      }
    }

    return classes
  })

  const speedLabel = computed(() => {
    if (props.animationSpeed >= 1500) return 'Slow'
    if (props.animationSpeed >= 750) return 'Normal'
    return 'Fast'
  })

  const availableLayers = computed(() => {
    return radarService.getAvailableLayers()
  })

  const currentFrame = computed(() => {
    if (!props.frames || props.frames.length === 0) return null
    return props.frames[props.currentFrameIndex] || null
  })

  const formatFrameTime = (frameIndex: number) => {
    if (!props.frames || props.frames.length === 0) return 'No data'

    const frame = props.frames[frameIndex]
    if (!frame) return 'No data'

    const now = Math.floor(Date.now() / 1000)
    const frameDiff = now - frame.timestamp

    if (frameDiff < 0) {
      const hours = Math.ceil(Math.abs(frameDiff) / 3600)
      return `+${hours}h`
    } else if (frameDiff === 0) {
      return 'Now'
    } else {
      const hours = Math.floor(frameDiff / 3600)
      const minutes = Math.floor((frameDiff % 3600) / 60)

      if (hours > 0) {
        return `-${hours}h ${minutes}m`
      } else {
        return `-${minutes}m`
      }
    }
  }

  // Event handlers
  const handleClose = () => {
    emit('close')
  }

  const handleSpaceKey = () => {
    emit('animation-toggle')
  }

  const handleLayerChange = (layerType: RadarLayerType) => {
    emit('layer-change', layerType)
  }

  const handleAnimationToggle = () => {
    emit('animation-toggle')
  }

  const handleSpeedChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('speed-change', parseInt(target.value))
  }

  const handleFrameChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('frame-change', parseInt(target.value))
  }

  // Map functions
  const initializeMap = async () => {
    if (!mapContainer.value || map) {
      console.log('Cannot initialize map:', {
        containerExists: !!mapContainer.value,
        mapAlreadyExists: !!map
      })
      return
    }

    await nextTick()

    console.log('Initializing map with container:', mapContainer.value, 'location:', props.location)

    try {
      // Initialize Leaflet map
      map = L.map(mapContainer.value, {
        center: [props.location.lat, props.location.lng],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
      })

      console.log('Map initialized successfully:', !!map)

      // Add base tile layer (OpenStreetMap)
      baseTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        opacity: 0.6
      })
      baseTileLayer.addTo(map)

      // Initialize radar layers (these would be populated with actual radar data)
      // For now, we'll set up the structure
      initializeRadarLayers()

      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        if (map) {
          map.invalidateSize()
        }
      }, 100)
    } catch (error) {
      console.error('Failed to initialize map:', error)
    }
  }

  const initializeRadarLayers = () => {
    if (!map || !currentFrame.value) {
      console.log('Cannot initialize radar layers:', {
        map: !!map,
        currentFrame: !!currentFrame.value
      })
      return
    }

    console.log('Initializing radar layers with frame:', currentFrame.value)
    console.log('Available layers in frame:', Object.keys(currentFrame.value.layers))
    console.log('Active layer type:', props.activeLayerType)

    // Remove existing radar layers
    Object.values(radarLayers).forEach((layer) => {
      if (layer && map) {
        map.removeLayer(layer)
      }
    })

    // Clear radar layers
    Object.keys(radarLayers).forEach((key) => {
      radarLayers[key as RadarLayerType] = null
    })

    // Create new radar layer from current frame
    const layerType = props.activeLayerType

    // Handle legacy layer names - the server is returning old format
    // Map all new Weather Maps 2.0 layer types to available legacy types
    const legacyLayerMap: Record<string, string> = {
      precipitation_intensity: 'precipitation',
      accumulated_rain: 'precipitation',
      accumulated_snow: 'precipitation',
      wind_speed: 'wind',
      pressure: 'pressure',
      temperature: 'temperature',
      humidity: 'clouds', // Use clouds as fallback for humidity
      cloudiness: 'clouds'
    }

    const legacyLayerName = legacyLayerMap[layerType] || layerType
    const availableLayer =
      currentFrame.value?.layers[layerType] || currentFrame.value?.layers[legacyLayerName]

    console.log(
      'Looking for layer:',
      layerType,
      'mapped to legacy:',
      legacyLayerName,
      'found:',
      !!availableLayer
    )

    if (!availableLayer) {
      console.warn(
        'No layer data found for',
        layerType,
        '- available layers:',
        Object.keys(currentFrame.value?.layers || {})
      )
      return
    }

    if (layerType && availableLayer && map) {
      const layerUrl = availableLayer

      if (layerUrl) {
        console.log('Loading radar layer:', layerType, 'URL:', layerUrl)

        // Create Leaflet tile layer
        const tileLayer = L.tileLayer(layerUrl, {
          opacity: 0.8, // Increased opacity to make it more visible
          attribution: '',
          errorTileUrl: '', // Don't show error tiles
          crossOrigin: true,
          zIndex: 1000 // Ensure it's on top of the base map
        })

        // Add event listeners for debugging
        tileLayer.on('tileerror', (e: any) => {
          console.error('Tile load error:', e.tile.src, e.error)
        })

        tileLayer.on('tileload', (e: any) => {
          console.log('Tile loaded successfully:', e.tile.src)
        })

        // Add to map
        tileLayer.addTo(map)

        // Store reference
        radarLayers[layerType] = tileLayer
      }
    }
  }

  const updateMapLocation = () => {
    if (map && props.location) {
      map.setView([props.location.lat, props.location.lng], map.getZoom())
    }
  }

  const cleanupMap = () => {
    if (map) {
      map.remove()
      map = null
    }
    baseTileLayer = null
    Object.keys(radarLayers).forEach((key) => {
      radarLayers[key as RadarLayerType] = null
    })
  }

  // Watchers
  watch(
    () => props.visible,
    async (newVisible, oldVisible) => {
      if (newVisible) {
        isClosing.value = false
        await nextTick()
        await initializeMap()
      } else if (oldVisible && !newVisible) {
        // Start closing animation
        isClosing.value = true
        // After animation completes, hide the drawer
        setTimeout(() => {
          isClosing.value = false
        }, 300) // Match animation duration
      }
    },
    { immediate: true }
  )

  watch(
    () => props.location,
    () => {
      updateMapLocation()
    },
    { deep: true }
  )

  watch(
    [() => props.currentFrameIndex, () => props.activeLayerType, () => props.frames],
    () => {
      initializeRadarLayers()
    },
    { deep: true, immediate: false }
  )

  // Lifecycle
  onMounted(async () => {
    if (props.visible) {
      await initializeMap()
    }
  })

  onUnmounted(() => {
    cleanupMap()
  })
</script>

<style scoped>
  .frame-dots {
    top: 10px;
  }

  .slide-down {
    animation: slideDown 0.3s ease-out;
  }

  .slide-up {
    animation: slideUp 0.3s ease-in;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }

  .slider {
    background: transparent !important;
  }

  .slider::-webkit-slider-track {
    background: transparent;
  }

  .slider::-moz-range-track {
    background: transparent;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  /* Customize Leaflet zoom controls */
  :deep(.leaflet-control-zoom) {
    border: none;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  :deep(.leaflet-control-zoom a) {
    background-color: rgba(51, 65, 85, 0.9);
    backdrop-filter: blur(4px);
    color: white;
    border: none;
    border-radius: 50% !important;
    margin: 2px 0;
    width: 32px;
    height: 32px;
    font-size: 18px;
    font-weight: bold;
    transition: all 0.2s ease;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-decoration: none !important;
  }

  :deep(.leaflet-control-zoom a:first-child) {
    border-radius: 50% !important;
  }

  :deep(.leaflet-control-zoom a:last-child) {
    border-radius: 50% !important;
  }

  :deep(.leaflet-control-zoom a:hover) {
    background-color: rgba(71, 85, 105, 0.9);
    color: white;
  }

  /* Hide scrollbar for layer pills container */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
