import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WeeklyForecast from '../../components/WeeklyForecast.vue'
import { useWeatherStore } from '../../stores/weather'
import type { DailyForecast } from '../../types/weather'

// Mock the weather store
vi.mock('../../stores/weather', () => ({
  useWeatherStore: vi.fn()
}))

describe('WeeklyForecast Component', () => {
  let mockStore: any
  const sampleDailyForecast: DailyForecast[] = [
    {
      date: '2022-01-01',
      timestamp: 1641038400,
      temperatureHigh: 75,
      temperatureLow: 55,
      precipitationProbability: 20,
      precipitationIntensity: 0,
      windSpeed: 10,
      windDirection: 180,
      humidity: 60,
      uvIndex: 5,
      description: 'sunny',
      icon: '01d'
    },
    {
      date: '2022-01-02',
      timestamp: 1641124800,
      temperatureHigh: 80,
      temperatureLow: 60,
      precipitationProbability: 10,
      precipitationIntensity: 0,
      windSpeed: 8,
      windDirection: 200,
      humidity: 65,
      uvIndex: 6,
      description: 'partly cloudy',
      icon: '02d'
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())

    mockStore = {
      dailyForecast: [],
      isLoading: false,
      error: null,
      currentLocation: {
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL'
      },
      loadDailyForecast: vi.fn(),
      loadHourlyForecastForDay: vi.fn()
    }

    vi.mocked(useWeatherStore).mockReturnValue(mockStore)
  })

  it('renders loading state', () => {
    mockStore.isLoading = true

    const wrapper = mount(WeeklyForecast)

    expect(wrapper.text()).toContain('Loading forecast...')
  })

  it('renders error state', () => {
    mockStore.error = 'Failed to load forecast'

    const wrapper = mount(WeeklyForecast)

    expect(wrapper.text()).toContain('Failed to load forecast')
  })

  it('renders daily forecast rows', () => {
    mockStore.dailyForecast = sampleDailyForecast

    const wrapper = mount(WeeklyForecast)

    expect(wrapper.findAll('[data-testid="day-forecast-row"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('75°')
    expect(wrapper.text()).toContain('55°')
    expect(wrapper.text()).toContain('80°')
    expect(wrapper.text()).toContain('60°')
  })

  it('displays day names correctly', () => {
    mockStore.dailyForecast = sampleDailyForecast

    const wrapper = mount(WeeklyForecast)

    // Should show formatted day names (Sat, Sun for Jan 1-2, 2022)
    expect(wrapper.text()).toContain('Sat')
    expect(wrapper.text()).toContain('Sun')
  })

  it('loads daily forecast on mount', () => {
    mount(WeeklyForecast)

    expect(mockStore.loadDailyForecast).toHaveBeenCalledOnce()
  })

  it('handles empty forecast gracefully', () => {
    mockStore.dailyForecast = []

    const wrapper = mount(WeeklyForecast)

    expect(wrapper.text()).toContain('No forecast data available')
  })
})
