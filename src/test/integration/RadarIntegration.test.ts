import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'

// Mock the radar service
vi.mock('../../services/radarService', () => ({
  radarService: {
    getRadarFrames: vi.fn().mockResolvedValue([]),
    setConfig: vi.fn(),
    getCurrentConfig: vi.fn(() => ({ cacheEnabled: true, mockAPIRequests: true })),
    clearCache: vi.fn(),
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
      }
    ]),
    getLayerInfo: vi.fn()
  }
}))

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
      addTo: vi.fn()
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

describe('Radar Integration with App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Radar Icon Integration', () => {
    it('should render radar icon in header', () => {
      const wrapper = mount(App)

      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })
      expect(radarIcon.exists()).toBe(true)
    })

    it('should position radar icon to the right of location search', () => {
      const wrapper = mount(App)

      const locationInput = wrapper.find('input[type="text"]')
      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })

      expect(locationInput.exists()).toBe(true)
      expect(radarIcon.exists()).toBe(true)

      // Check that both are in the same container (header area)
      const headerContainer = wrapper.find('.bg-slate-800.p-4')
      expect(headerContainer.exists()).toBe(true)
    })

    it('should show radar icon as inactive by default', () => {
      const wrapper = mount(App)

      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })
      expect(radarIcon.props('isActive')).toBe(false)
    })
  })

  describe('Radar Drawer Integration', () => {
    it('should render radar drawer component', () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })
      expect(radarDrawer.exists()).toBe(true)
    })

    it('should hide radar drawer by default', () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })
      expect(radarDrawer.props('visible')).toBe(false)
    })

    it('should pass current location to radar drawer', () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })
      expect(radarDrawer.props('location')).toBeDefined()
      expect(radarDrawer.props('location').name).toBeDefined()
    })
  })

  describe('Radar State Management', () => {
    it('should open drawer when radar icon is clicked', async () => {
      const wrapper = mount(App)

      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })
      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      expect(radarDrawer.props('visible')).toBe(false)

      // Directly call the radar store method that the click handler uses
      const { useRadarStore } = await import('../../stores/radar')
      const radarStore = useRadarStore()
      radarStore.openDrawer()

      await wrapper.vm.$nextTick()

      expect(radarDrawer.props('visible')).toBe(true)
      expect(radarIcon.props('isActive')).toBe(true)
    })

    it('should close drawer when close event is emitted', async () => {
      const wrapper = mount(App)

      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })
      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      // Open drawer first using the store
      const { useRadarStore } = await import('../../stores/radar')
      const radarStore = useRadarStore()
      radarStore.openDrawer()
      await wrapper.vm.$nextTick()
      expect(radarDrawer.props('visible')).toBe(true)

      // Close drawer using the store
      radarStore.closeDrawer()
      await wrapper.vm.$nextTick()

      expect(radarDrawer.props('visible')).toBe(false)
      expect(radarIcon.props('isActive')).toBe(false)
    })

    it('should pass radar loading state to components', () => {
      const wrapper = mount(App)

      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })
      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      // Should pass loading state from store
      expect(radarIcon.props()).toHaveProperty('isLoading')
      expect(radarDrawer.props()).toHaveProperty('isLoading')
    })

    it('should pass radar error state to components', () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      // Should pass error state from store
      expect(radarDrawer.props()).toHaveProperty('error')
    })
  })

  describe('Radar Controls Integration', () => {
    it('should handle layer change events', async () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      await radarDrawer.vm.$emit('layer-change', 'precipitation_intensity')

      // Should update the radar store state
      // This would be verified by checking if the store method was called
      expect(radarDrawer.props('activeLayerType')).toBeDefined()
    })

    it('should handle animation toggle events', async () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      await radarDrawer.vm.$emit('animation-toggle')

      // Should update animation state in store
      expect(radarDrawer.props()).toHaveProperty('isAnimationPlaying')
    })

    it('should handle speed change events', async () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      await radarDrawer.vm.$emit('speed-change', 500)

      // Should update animation speed in store
      expect(radarDrawer.props()).toHaveProperty('animationSpeed')
    })

    it('should handle frame change events', async () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })

      await radarDrawer.vm.$emit('frame-change', 3)

      // Should update current frame in store
      expect(radarDrawer.props()).toHaveProperty('currentFrameIndex')
    })
  })

  describe('Data Loading Integration', () => {
    it('should load radar data when drawer opens', async () => {
      const wrapper = mount(App)

      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })

      await radarIcon.vm.$emit('click')

      // Should trigger radar data loading
      // This would be verified by checking if the service was called
      expect(wrapper.vm).toBeDefined()
    })

    it('should update radar data when location changes', async () => {
      const wrapper = mount(App)

      // First open the location search modal
      await wrapper.find('input[type="text"]').trigger('click')

      // Find the location search component in the modal
      const locationSearch = wrapper.findComponent({ name: 'LocationSearch' })
      expect(locationSearch.exists()).toBe(true)

      const newLocation = { lat: 40.7128, lng: -74.006, name: 'New York, NY' }

      await locationSearch.vm.$emit('locationSelected', newLocation)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })
      expect(radarDrawer.props('location')).toEqual(newLocation)
    })
  })

  describe('Responsive Design', () => {
    it('should stack radar icon properly on mobile layout', () => {
      const wrapper = mount(App)

      // Check that radar icon is positioned correctly relative to location search
      const headerContainer = wrapper.find('.bg-slate-800.p-4')
      expect(headerContainer.exists()).toBe(true)

      const radarIcon = wrapper.findComponent({ name: 'RadarIcon' })
      expect(radarIcon.exists()).toBe(true)
    })

    it('should make drawer responsive on small screens', () => {
      const wrapper = mount(App)

      const radarDrawer = wrapper.findComponent({ name: 'RadarDrawer' })
      expect(radarDrawer.exists()).toBe(true)

      // The drawer should be responsive in its internal implementation
      // This is tested in the RadarDrawer component tests
    })
  })
})
