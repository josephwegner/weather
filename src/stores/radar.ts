import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Location } from '../types/weather'
import type { RadarLayerType, RadarFrame } from '../types/radar'
import { radarService } from '../services/radarService'

export const useRadarStore = defineStore('radar', () => {
  // State
  const isDrawerVisible = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const frames = ref<RadarFrame[]>([])
  const activeLayerType = ref<RadarLayerType>('precipitation_intensity')
  const currentFrameIndex = ref(0)
  const isAnimationPlaying = ref(false)
  const animationSpeed = ref(1000) // milliseconds between frames
  const animationIntervalId = ref<NodeJS.Timeout | null>(null)

  // Computed properties
  const currentFrame = computed(() => {
    if (frames.value.length === 0) return null
    return frames.value[currentFrameIndex.value] || null
  })

  const hasData = computed(() => {
    return frames.value.length > 0
  })

  // Drawer actions
  const toggleDrawer = () => {
    isDrawerVisible.value = !isDrawerVisible.value
  }

  const openDrawer = () => {
    isDrawerVisible.value = true
  }

  const closeDrawer = () => {
    isDrawerVisible.value = false
    stopAnimation() // Stop animation when closing drawer
  }

  // Loading and error actions
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
    if (loading) {
      error.value = null // Clear error when starting new operation
    }
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  // Layer management actions
  const setActiveLayerType = (layerType: RadarLayerType) => {
    activeLayerType.value = layerType
  }

  // Data loading actions
  const loadRadarFrames = async (location: Location) => {
    try {
      setLoading(true)
      const radarFrames = await radarService.getRadarFrames(location, activeLayerType.value)
      frames.value = radarFrames
      currentFrameIndex.value = 0 // Reset to first frame
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to load radar data: ${errorMessage}`)
      frames.value = []
    } finally {
      setLoading(false)
    }
  }

  // Animation actions
  const startAnimation = () => {
    if (frames.value.length < 2) return // Need at least 2 frames to animate

    isAnimationPlaying.value = true
    animationIntervalId.value = setInterval(() => {
      currentFrameIndex.value = (currentFrameIndex.value + 1) % frames.value.length
    }, animationSpeed.value)
  }

  const stopAnimation = () => {
    isAnimationPlaying.value = false
    if (animationIntervalId.value) {
      clearInterval(animationIntervalId.value)
      animationIntervalId.value = null
    }
  }

  const toggleAnimation = () => {
    if (isAnimationPlaying.value) {
      stopAnimation()
    } else {
      startAnimation()
    }
  }

  const setAnimationSpeed = (speed: number) => {
    animationSpeed.value = speed

    // Restart animation with new speed if currently playing
    if (isAnimationPlaying.value) {
      stopAnimation()
      startAnimation()
    }
  }

  const setCurrentFrameIndex = (index: number) => {
    if (index >= 0 && index < frames.value.length) {
      currentFrameIndex.value = index
    }
  }

  // Cleanup function to stop animation when store is destroyed
  const cleanup = () => {
    stopAnimation()
  }

  return {
    // State
    isDrawerVisible,
    isLoading,
    error,
    frames,
    activeLayerType,
    currentFrameIndex,
    isAnimationPlaying,
    animationSpeed,

    // Computed
    currentFrame,
    hasData,

    // Actions
    toggleDrawer,
    openDrawer,
    closeDrawer,
    setLoading,
    setError,
    setActiveLayerType,
    loadRadarFrames,
    startAnimation,
    stopAnimation,
    toggleAnimation,
    setAnimationSpeed,
    setCurrentFrameIndex,
    cleanup
  }
})
