import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import App from '../../App.vue'
import { useWeatherStore } from '../../stores/weather'

vi.mock('../../stores/weather', () => ({
  useWeatherStore: vi.fn()
}))

vi.mock('../../services/cache', () => ({
  cacheService: {
    clear: vi.fn()
  }
}))

vi.mock('../../components/WeeklyForecast.vue', () => ({
  default: { template: '<div>Weekly Forecast</div>' }
}))

vi.mock('../../components/LocationSearch.vue', () => ({
  default: { template: '<div>Location Search</div>' }
}))

describe('Pull to Refresh', () => {
  let mockStore: any

  beforeEach(() => {
    setActivePinia(createPinia())

    // Reset scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

    mockStore = {
      currentLocation: { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
      currentWeather: { temperature: 72, description: 'sunny' },
      isLoading: false,
      error: null,
      weatherApiService: {
        getCurrentWeather: vi.fn().mockResolvedValue({ temperature: 75, description: 'clear' })
      },
      setLoading: vi.fn(),
      setError: vi.fn(),
      setCurrentWeather: vi.fn(),
      loadDailyForecast: vi.fn().mockResolvedValue(undefined)
    }

    vi.mocked(useWeatherStore).mockReturnValue(mockStore)
  })

  it('shows pull-to-refresh indicator element', () => {
    const wrapper = mount(App)
    expect(wrapper.find('.pull-refresh-indicator').exists()).toBe(true)
  })

  it('indicator starts at zero height', () => {
    const wrapper = mount(App)
    const indicator = wrapper.find('.pull-refresh-indicator')
    expect(indicator.attributes('style')).toContain('height: 0px')
  })

  it('shows indicator when pulling down from top', async () => {
    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 250 }] })

    const indicator = wrapper.find('.pull-refresh-indicator')
    // 150 * 0.4 = 60, capped at 80
    expect(indicator.attributes('style')).toContain('height: 60px')
  })

  it('does not activate when scrolled away from top', async () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })

    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 300 }] })

    const indicator = wrapper.find('.pull-refresh-indicator')
    expect(indicator.attributes('style')).toContain('height: 0px')
  })

  it('shows "Pull to refresh" text before threshold', async () => {
    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 200 }] })

    // 100 * 0.4 = 40, below threshold of 60
    expect(wrapper.text()).toContain('Pull to refresh')
  })

  it('shows "Release to refresh" text past threshold', async () => {
    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 260 }] })

    // 160 * 0.4 = 64, past threshold of 60
    expect(wrapper.text()).toContain('Release to refresh')
  })

  it('snaps back without refreshing when released before threshold', async () => {
    const { cacheService } = await import('../../services/cache')

    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 200 }] })
    await app.trigger('touchend')

    expect(cacheService.clear).not.toHaveBeenCalled()
    const indicator = wrapper.find('.pull-refresh-indicator')
    expect(indicator.attributes('style')).toContain('height: 0px')
  })

  it('triggers refresh when released past threshold', async () => {
    const { cacheService } = await import('../../services/cache')

    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 260 }] })
    await app.trigger('touchend')

    await vi.waitFor(() => {
      expect(cacheService.clear).toHaveBeenCalled()
    })
    expect(mockStore.weatherApiService.getCurrentWeather).toHaveBeenCalled()
    expect(mockStore.loadDailyForecast).toHaveBeenCalled()
  })

  it('flips arrow icon when past threshold', async () => {
    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 260 }] })

    expect(wrapper.find('.pull-refresh-arrow--flipped').exists()).toBe(true)
  })

  it('resets indicator after refresh completes', async () => {
    const wrapper = mount(App)
    const app = wrapper.find('#app')

    await app.trigger('touchstart', { touches: [{ clientY: 100 }] })
    await app.trigger('touchmove', { touches: [{ clientY: 260 }] })
    await app.trigger('touchend')

    await vi.waitFor(() => {
      const indicator = wrapper.find('.pull-refresh-indicator')
      expect(indicator.attributes('style')).toContain('height: 0px')
    })
  })
})
