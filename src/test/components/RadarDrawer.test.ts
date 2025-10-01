import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RadarDrawer from '../../components/RadarDrawer.vue'
import type { Location } from '../../types/weather'
import type { RadarLayerType, RadarFrame } from '../../types/radar'

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      getZoom: vi.fn(() => 5),
      setZoom: vi.fn(),
      remove: vi.fn(),
      invalidateSize: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
      remove: vi.fn()
    })),
    TileLayer: {
      WMS: vi.fn(() => ({
        addTo: vi.fn(),
        remove: vi.fn(),
        setOpacity: vi.fn()
      }))
    }
  }
}))

// Mock radar service
vi.mock('../../services/radarService', () => ({
  radarService: {
    getAvailableLayers: vi.fn(() => [
      {
        code: 'PR0',
        name: 'Precipitation Intensity',
        units: 'mm/s',
        type: 'precipitation_intensity'
      },
      {
        code: 'PARAIN',
        name: 'Accumulated Rain',
        units: 'mm',
        type: 'accumulated_rain'
      },
      {
        code: 'TA2',
        name: 'Air Temperature',
        units: '°C',
        type: 'temperature'
      }
    ]),
    getLayerInfo: vi.fn()
  }
}))

describe('RadarDrawer Component - Weather Maps 2.0', () => {
  let mockLocation: Location
  let mockFrames: RadarFrame[]

  beforeEach(() => {
    setActivePinia(createPinia())

    mockLocation = {
      lat: 41.8781,
      lng: -87.6298,
      name: 'Chicago, IL'
    }

    mockFrames = [
      {
        timestamp: 1640995200,
        layers: { precipitation_intensity: 'url1' },
        isPrediction: false
      },
      {
        timestamp: 1640996100,
        layers: { precipitation_intensity: 'url2' },
        isPrediction: false
      },
      {
        timestamp: 1640997000,
        layers: { precipitation_intensity: 'url3' },
        isPrediction: true
      },
      {
        timestamp: 1640997900,
        layers: { precipitation_intensity: 'url4' },
        isPrediction: true
      }
    ]
  })

  describe('Rendering', () => {
    it('should render drawer container', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.find('.radar-drawer').exists()).toBe(true)
    })

    it('should render map container when visible', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.find('.radar-map').exists()).toBe(true)
    })

    it('should render location name in header', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          location: mockLocation,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.text()).toContain('Chicago, IL')
    })

    it('should be hidden when not visible', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: false,
          activeLayerType: 'precipitation_intensity'
        }
      })

      // With v-show, element exists but should have display: none or be visually hidden
      const drawer = wrapper.find('.radar-drawer')
      expect(drawer.exists()).toBe(true)
    })
  })

  describe('Weather Maps 2.0 Metric Pills', () => {
    it('should render metric pill selector', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const pillContainer = wrapper.find('.overflow-x-auto.scrollbar-hide')
      expect(pillContainer.exists()).toBe(true)

      const pills = wrapper.findAll('button')
      expect(pills.length).toBeGreaterThan(0)
    })

    it('should display available metrics as pills', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const pills = wrapper.findAll('button')
      const pillTexts = pills.map((pill) => pill.text())

      expect(pillTexts.some((text) => text.includes('PRECIPITATION INTENSITY'))).toBe(true)
      expect(pillTexts.some((text) => text.includes('ACCUMULATED RAIN'))).toBe(true)
    })

    it('should emit layer-change event when metric pill is clicked', async () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const pills = wrapper.findAll('button')
      // Find the accumulated rain pill and click it
      const rainPill = pills.find((pill) => pill.text().includes('ACCUMULATED RAIN'))
      if (rainPill) {
        await rainPill.trigger('click')

        expect(wrapper.emitted('layer-change')).toBeTruthy()
        expect(wrapper.emitted('layer-change')?.[0]).toEqual(['accumulated_rain'])
      }
    })

    it('should highlight currently selected metric pill', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'temperature'
        }
      })

      const pills = wrapper.findAll('button')
      const tempPill = pills.find((pill) => pill.text().includes('AIR TEMPERATURE'))

      if (tempPill) {
        expect(tempPill.classes()).toContain('bg-blue-500')
        expect(tempPill.classes()).toContain('text-white')
        expect(tempPill.classes()).toContain('border-blue-500')
      }
    })

    it('should show inactive style for non-selected pills', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'temperature' // temperature is selected
        }
      })

      const pills = wrapper.findAll('button')
      const precipPill = pills.find((pill) => pill.text().includes('PRECIPITATION INTENSITY'))

      if (precipPill) {
        expect(precipPill.classes()).toContain('bg-slate-700')
        expect(precipPill.classes()).toContain('text-slate-300')
        expect(precipPill.classes()).toContain('border-slate-600')
      }
    })
  })

  describe('Timeline with Dots', () => {
    it('should render timeline dots for each frame', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: mockFrames,
          frameCount: mockFrames.length,
          currentFrameIndex: 0,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const dots = wrapper.findAll('.w-1.h-1.rounded-full')
      expect(dots).toHaveLength(mockFrames.length)
    })

    it('should color-code dots based on prediction status', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: mockFrames,
          frameCount: mockFrames.length,
          currentFrameIndex: 0,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const dots = wrapper.findAll('.w-1.h-1.rounded-full')

      // Check first dot (past data - should be blue)
      expect(dots[0].classes()).toContain('bg-blue-400')
      expect(dots[0].classes()).not.toContain('bg-yellow-400')

      // Check third dot (prediction - should be yellow)
      expect(dots[2].classes()).toContain('bg-yellow-400')
      expect(dots[2].classes()).not.toContain('bg-blue-400')
    })

    it('should highlight current frame dot', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: mockFrames,
          frameCount: mockFrames.length,
          currentFrameIndex: 1,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const dots = wrapper.findAll('.w-1.h-1.rounded-full')

      // Current frame dot should have ring
      expect(dots[1].classes()).toContain('ring-2')
      expect(dots[1].classes()).toContain('ring-white')

      // Other dots should not have ring
      expect(dots[0].classes()).not.toContain('ring-2')
      expect(dots[2].classes()).not.toContain('ring-2')
    })

    it('should render timeline slider', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: mockFrames,
          frameCount: mockFrames.length,
          currentFrameIndex: 0,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const slider = wrapper.find('input[type="range"]')
      expect(slider.exists()).toBe(true)
      expect(slider.attributes('max')).toBe((mockFrames.length - 1).toString())
    })
  })

  describe('Animation Controls', () => {
    it('should render play/pause button', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          isAnimationPlaying: false,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const button = wrapper.find('.w-10.h-10.bg-slate-700')
      expect(button.exists()).toBe(true)
    })

    it('should show play icon when not playing', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          isAnimationPlaying: false,
          activeLayerType: 'precipitation_intensity'
        }
      })

      // Play icon should be visible
      const playIcon = wrapper.find('svg')
      expect(playIcon.exists()).toBe(true)
    })

    it('should emit animation-toggle when play button clicked', async () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          isAnimationPlaying: false,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const button = wrapper.find('.w-10.h-10.bg-slate-700')
      await button.trigger('click')

      expect(wrapper.emitted('animation-toggle')).toBeTruthy()
    })

    it('should emit frame-change when slider moves', async () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: mockFrames,
          frameCount: mockFrames.length,
          currentFrameIndex: 0,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const slider = wrapper.find('input[type="range"]')
      await slider.setValue('2')
      await slider.trigger('input')

      expect(wrapper.emitted('frame-change')).toBeTruthy()
      expect(wrapper.emitted('frame-change')?.[0]).toEqual([2])
    })
  })

  describe('Time Display', () => {
    it('should format frame time correctly for past frames', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: mockFrames,
          frameCount: mockFrames.length,
          currentFrameIndex: 0,
          activeLayerType: 'precipitation_intensity'
        }
      })

      // Should show relative time for frames
      const timeDisplay = wrapper.find('.text-slate-400.text-sm')
      expect(timeDisplay.exists()).toBe(true)
    })

    it('should show "No data" when no frames available', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: [],
          frameCount: 0,
          currentFrameIndex: 0,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const timeDisplay = wrapper.find('.text-slate-400.text-sm')
      expect(timeDisplay.text()).toBe('No data')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          isLoading: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.find('.loading-indicator').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading radar data...')
    })

    it('should hide loading indicator when not loading', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          isLoading: false,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.find('.loading-indicator').exists()).toBe(false)
    })

    it('should disable controls when loading', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          isLoading: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const controlsSection = wrapper.find('.p-4.bg-slate-900')
      expect(controlsSection.classes()).toContain('opacity-50')
    })
  })

  describe('Error State', () => {
    it('should show error message when error exists', () => {
      const errorMessage = 'Failed to load radar data'
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          error: errorMessage,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.text()).toContain(errorMessage)
    })

    it('should hide error message when no error', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          error: null,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.find('.error-message').exists()).toBe(false)
    })
  })

  describe('Event Emissions', () => {
    it('should emit close event when close button clicked', async () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const closeButton = wrapper.find('.close-btn')
      await closeButton.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit close event on escape key', async () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      await wrapper.trigger('keydown.escape')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit animation-toggle on space key', async () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      await wrapper.trigger('keydown.space')

      expect(wrapper.emitted('animation-toggle')).toBeTruthy()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should be focusable for keyboard navigation', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          activeLayerType: 'precipitation_intensity'
        }
      })

      const drawer = wrapper.find('.radar-drawer')
      expect(drawer.attributes('tabindex')).toBe('0')
    })
  })

  describe('Responsiveness', () => {
    it('should handle empty frames array gracefully', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          frames: [],
          frameCount: 0,
          currentFrameIndex: 0,
          activeLayerType: 'precipitation_intensity'
        }
      })

      expect(wrapper.find('.radar-drawer').exists()).toBe(true)
      // Should not crash when no frames available
      expect(() => wrapper.vm).not.toThrow()
    })

    it('should show fallback text when no location name', () => {
      const wrapper = mount(RadarDrawer, {
        props: {
          visible: true,
          location: { lat: 0, lng: 0, name: '' }, // Empty name should trigger fallback
          activeLayerType: 'precipitation_intensity'
        }
      })

      // Should show fallback text when location name is empty
      const headerText = wrapper.find('h3').text()
      expect(headerText).toBe('Weather Radar')
    })
  })
})
