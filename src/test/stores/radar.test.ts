import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRadarStore } from '../../stores/radar'
import type { Location } from '../../types/weather'
import type { RadarLayerType, RadarFrame } from '../../types/radar'

vi.mock('../../services/radarService', () => ({
  radarService: {
    getRadarFrames: vi.fn(),
    setConfig: vi.fn(),
    getCurrentConfig: vi.fn(() => ({ cacheEnabled: true, mockAPIRequests: true })),
    clearCache: vi.fn()
  }
}))

describe('Radar Store - Weather Maps 2.0', () => {
  let mockLocation: Location

  beforeEach(() => {
    setActivePinia(createPinia())
    mockLocation = {
      lat: 41.8781,
      lng: -87.6298,
      name: 'Chicago, IL'
    }
  })

  describe('Initial State', () => {
    it('should initialize with default state for Weather Maps 2.0', () => {
      const store = useRadarStore()

      expect(store.isDrawerVisible).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.frames).toEqual([])
      expect(store.activeLayerType).toBe('precipitation_intensity') // New single layer selection
      expect(store.currentFrameIndex).toBe(0)
      expect(store.isAnimationPlaying).toBe(false)
      expect(store.animationSpeed).toBe(1000)
    })
  })

  describe('Drawer State Management', () => {
    it('should toggle drawer visibility', () => {
      const store = useRadarStore()

      expect(store.isDrawerVisible).toBe(false)

      store.toggleDrawer()
      expect(store.isDrawerVisible).toBe(true)

      store.toggleDrawer()
      expect(store.isDrawerVisible).toBe(false)
    })

    it('should open drawer', () => {
      const store = useRadarStore()

      store.openDrawer()
      expect(store.isDrawerVisible).toBe(true)
    })

    it('should close drawer and stop animation', () => {
      const store = useRadarStore()

      store.openDrawer()
      store.frames = [
        { timestamp: 1, layers: {}, isPrediction: false },
        { timestamp: 2, layers: {}, isPrediction: false }
      ]
      store.startAnimation()

      expect(store.isDrawerVisible).toBe(true)
      expect(store.isAnimationPlaying).toBe(true)

      store.closeDrawer()
      expect(store.isDrawerVisible).toBe(false)
      expect(store.isAnimationPlaying).toBe(false)
    })
  })

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const store = useRadarStore()

      store.setLoading(true)
      expect(store.isLoading).toBe(true)

      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('should set error state', () => {
      const store = useRadarStore()

      store.setError('Network error')
      expect(store.error).toBe('Network error')

      store.setError(null)
      expect(store.error).toBeNull()
    })

    it('should clear error when starting new operation', () => {
      const store = useRadarStore()

      store.setError('Previous error')
      expect(store.error).toBe('Previous error')

      store.setLoading(true)
      expect(store.error).toBeNull()
    })
  })

  describe('Single Layer Management (Weather Maps 2.0)', () => {
    it('should set active layer type', () => {
      const store = useRadarStore()

      store.setActiveLayerType('accumulated_rain')
      expect(store.activeLayerType).toBe('accumulated_rain')

      store.setActiveLayerType('temperature')
      expect(store.activeLayerType).toBe('temperature')
    })

    it('should support all Weather Maps 2.0 layer types', () => {
      const store = useRadarStore()
      const validLayers: RadarLayerType[] = [
        'precipitation_intensity',
        'accumulated_rain',
        'accumulated_snow',
        'wind_speed',
        'pressure',
        'temperature',
        'humidity',
        'cloudiness'
      ]

      for (const layer of validLayers) {
        store.setActiveLayerType(layer)
        expect(store.activeLayerType).toBe(layer)
      }
    })
  })

  describe('Radar Data Loading with Weather Maps 2.0', () => {
    it('should load radar frames for single layer', async () => {
      const { radarService } = await import('../../services/radarService')
      const mockFrames: RadarFrame[] = [
        {
          timestamp: 1640995200,
          layers: { precipitation_intensity: 'url1' },
          isPrediction: false
        },
        {
          timestamp: 1640995800,
          layers: { precipitation_intensity: 'url2' },
          isPrediction: false
        },
        {
          timestamp: 1640996400,
          layers: { precipitation_intensity: 'url3' },
          isPrediction: true
        }
      ]

      vi.mocked(radarService.getRadarFrames).mockResolvedValueOnce(mockFrames)

      const store = useRadarStore()
      store.setActiveLayerType('precipitation_intensity')
      await store.loadRadarFrames(mockLocation)

      expect(radarService.getRadarFrames).toHaveBeenCalledWith(
        mockLocation,
        'precipitation_intensity'
      )
      expect(store.frames).toEqual(mockFrames)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.currentFrameIndex).toBe(0) // Reset to first frame
    })

    it('should handle different layer types in separate calls', async () => {
      vi.clearAllMocks()
      const { radarService } = await import('../../services/radarService')

      const mockPrecipFrames: RadarFrame[] = [
        {
          timestamp: 1640995200,
          layers: { precipitation_intensity: 'precip-url' },
          isPrediction: false
        }
      ]

      const mockTempFrames: RadarFrame[] = [
        {
          timestamp: 1640995200,
          layers: { temperature: 'temp-url' },
          isPrediction: false
        }
      ]

      vi.mocked(radarService.getRadarFrames)
        .mockResolvedValueOnce(mockPrecipFrames)
        .mockResolvedValueOnce(mockTempFrames)

      const store = useRadarStore()

      // Load precipitation data
      store.setActiveLayerType('precipitation_intensity')
      await store.loadRadarFrames(mockLocation)
      expect(store.frames).toEqual(mockPrecipFrames)

      // Load temperature data
      store.setActiveLayerType('temperature')
      await store.loadRadarFrames(mockLocation)
      expect(store.frames).toEqual(mockTempFrames)

      expect(radarService.getRadarFrames).toHaveBeenCalledTimes(2)
    })

    it('should handle radar loading errors', async () => {
      const { radarService } = await import('../../services/radarService')

      vi.mocked(radarService.getRadarFrames).mockRejectedValueOnce(new Error('API Error'))

      const store = useRadarStore()
      await store.loadRadarFrames(mockLocation)

      expect(store.frames).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Failed to load radar data: API Error')
    })

    it('should set loading state during radar fetch', async () => {
      const { radarService } = await import('../../services/radarService')

      let resolvePromise: (value: any) => void
      const promise = new Promise<RadarFrame[]>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(radarService.getRadarFrames).mockReturnValueOnce(promise)

      const store = useRadarStore()
      const loadPromise = store.loadRadarFrames(mockLocation)

      expect(store.isLoading).toBe(true)
      expect(store.error).toBeNull()

      resolvePromise!([])
      await loadPromise

      expect(store.isLoading).toBe(false)
    })
  })

  describe('Animation Control with Time-based Frames', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should start animation with multiple frames', () => {
      const store = useRadarStore()
      store.frames = [
        { timestamp: 1640995200, layers: {}, isPrediction: false },
        { timestamp: 1640996100, layers: {}, isPrediction: false },
        { timestamp: 1640997000, layers: {}, isPrediction: true }
      ]

      store.startAnimation()
      expect(store.isAnimationPlaying).toBe(true)
    })

    it('should not start animation with insufficient frames', () => {
      const store = useRadarStore()
      store.frames = [{ timestamp: 1640995200, layers: {}, isPrediction: false }]

      store.startAnimation()
      expect(store.isAnimationPlaying).toBe(false) // Needs at least 2 frames
    })

    it('should stop animation', () => {
      const store = useRadarStore()
      store.frames = [
        { timestamp: 1640995200, layers: {}, isPrediction: false },
        { timestamp: 1640996100, layers: {}, isPrediction: false }
      ]

      store.startAnimation()
      expect(store.isAnimationPlaying).toBe(true)

      store.stopAnimation()
      expect(store.isAnimationPlaying).toBe(false)
    })

    it('should advance frame during animation', () => {
      const store = useRadarStore()
      store.frames = [
        { timestamp: 1640995200, layers: {}, isPrediction: false },
        { timestamp: 1640996100, layers: {}, isPrediction: false },
        { timestamp: 1640997000, layers: {}, isPrediction: true }
      ]

      store.startAnimation()
      expect(store.currentFrameIndex).toBe(0)

      vi.advanceTimersByTime(1000)
      expect(store.currentFrameIndex).toBe(1)

      vi.advanceTimersByTime(1000)
      expect(store.currentFrameIndex).toBe(2)

      // Should loop back to start
      vi.advanceTimersByTime(1000)
      expect(store.currentFrameIndex).toBe(0)
    })

    it('should set animation speed', () => {
      const store = useRadarStore()

      store.setAnimationSpeed(500)
      expect(store.animationSpeed).toBe(500)

      store.frames = [
        { timestamp: 1640995200, layers: {}, isPrediction: false },
        { timestamp: 1640996100, layers: {}, isPrediction: false }
      ]

      store.startAnimation()

      vi.advanceTimersByTime(500)
      expect(store.currentFrameIndex).toBe(1)
    })

    it('should restart animation with new speed if currently playing', () => {
      const store = useRadarStore()
      store.frames = [
        { timestamp: 1640995200, layers: {}, isPrediction: false },
        { timestamp: 1640996100, layers: {}, isPrediction: false }
      ]

      store.startAnimation()
      expect(store.isAnimationPlaying).toBe(true)

      // Change speed while playing
      store.setAnimationSpeed(2000)
      expect(store.isAnimationPlaying).toBe(true)

      // Should use new speed
      vi.advanceTimersByTime(2000)
      expect(store.currentFrameIndex).toBe(1)
    })

    it('should set current frame index manually', () => {
      const store = useRadarStore()
      store.frames = [
        { timestamp: 1640995200, layers: {}, isPrediction: false },
        { timestamp: 1640996100, layers: {}, isPrediction: false },
        { timestamp: 1640997000, layers: {}, isPrediction: true }
      ]

      store.setCurrentFrameIndex(2)
      expect(store.currentFrameIndex).toBe(2)

      // Should not set index beyond frames length
      store.setCurrentFrameIndex(5)
      expect(store.currentFrameIndex).toBe(2) // Should remain unchanged

      // Should not set negative index
      store.setCurrentFrameIndex(-1)
      expect(store.currentFrameIndex).toBe(2) // Should remain unchanged
    })
  })

  describe('Computed Properties', () => {
    it('should compute current frame correctly', () => {
      const store = useRadarStore()
      const mockFrames: RadarFrame[] = [
        { timestamp: 1640995200, layers: { precipitation_intensity: 'url1' }, isPrediction: false },
        { timestamp: 1640996100, layers: { precipitation_intensity: 'url2' }, isPrediction: true }
      ]

      store.frames = mockFrames
      store.setCurrentFrameIndex(1)

      expect(store.currentFrame).toEqual(mockFrames[1])
    })

    it('should return null for current frame when no frames', () => {
      const store = useRadarStore()

      expect(store.currentFrame).toBeNull()
    })

    it('should not change index when set to out of bounds value', () => {
      const store = useRadarStore()
      store.frames = [{ timestamp: 1640995200, layers: {}, isPrediction: false }]

      // Set to valid index first
      store.setCurrentFrameIndex(0)
      expect(store.currentFrameIndex).toBe(0)

      // Try to set out of bounds - should not change
      store.setCurrentFrameIndex(5) // Out of bounds
      expect(store.currentFrameIndex).toBe(0) // Should remain 0
      expect(store.currentFrame).toEqual(store.frames[0]) // Should still return valid frame
    })

    it('should check if radar has data', () => {
      const store = useRadarStore()

      expect(store.hasData).toBe(false)

      store.frames = [{ timestamp: 1640995200, layers: {}, isPrediction: false }]
      expect(store.hasData).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should stop animation on cleanup', () => {
      const store = useRadarStore()
      store.frames = [
        { timestamp: 1640995200, layers: {}, isPrediction: false },
        { timestamp: 1640996100, layers: {}, isPrediction: false }
      ]

      store.startAnimation()
      expect(store.isAnimationPlaying).toBe(true)

      store.cleanup()
      expect(store.isAnimationPlaying).toBe(false)
    })
  })
})
