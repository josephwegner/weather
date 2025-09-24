import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DayForecastRow from '../../components/DayForecastRow.vue'
import { useWeatherStore } from '../../stores/weather'
import type { DailyForecast, HourlyForecast } from '../../types/weather'

vi.mock('../../stores/weather', () => ({
  useWeatherStore: vi.fn()
}))

describe('DayForecastRow Component', () => {
  let mockStore: any
  const sampleDayForecast: DailyForecast = {
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
  }

  const sampleHourlyForecast: HourlyForecast[] = Array.from({ length: 24 }, (_, i) => ({
    timestamp: 1641038400 + i * 3600,
    temperature: 60 + i * 2,
    feelsLike: 62 + i * 2,
    humidity: 65,
    precipitationProbability: 10,
    precipitationIntensity: 0,
    windSpeed: 8,
    windDirection: 180,
    description: 'sunny',
    icon: '01d'
  }))

  beforeEach(() => {
    setActivePinia(createPinia())

    mockStore = {
      hourlyForecastByDate: {},
      isLoadingHourlyForDate: vi.fn().mockReturnValue(false),
      loadHourlyForecastForDay: vi.fn()
    }

    vi.mocked(useWeatherStore).mockReturnValue(mockStore)
  })

  it('renders day forecast information', () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    expect(wrapper.text()).toContain('75°')
    expect(wrapper.text()).toContain('55°')
    expect(wrapper.text()).toContain('20%') // precipitation
    expect(wrapper.find('[data-testid="weather-icon"]').exists()).toBe(true)
  })

  it('displays day name correctly', () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    // Jan 1, 2022 was a Saturday
    expect(wrapper.text()).toContain('Sat')
  })

  it('starts collapsed (not expanded)', () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    expect(wrapper.find('[data-testid="hourly-detail"]').exists()).toBe(false)
    expect(wrapper.vm.isExpanded).toBe(false)
  })

  it('expands when clicked and loads hourly data', async () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    expect(wrapper.vm.isExpanded).toBe(true)
    expect(mockStore.loadHourlyForecastForDay).toHaveBeenCalledWith('2022-01-01')
  })

  it('collapses when clicked while expanded', async () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    // Expand first
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')
    expect(wrapper.vm.isExpanded).toBe(true)

    // Then collapse
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')
    expect(wrapper.vm.isExpanded).toBe(false)
  })

  it('shows loading state when fetching hourly data', async () => {
    mockStore.isLoadingHourlyForDate.mockReturnValue(true)

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    // Expand to show hourly section
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    expect(wrapper.find('[data-testid="hourly-loading"]').exists()).toBe(true)
  })

  it('displays hourly forecast when available', async () => {
    mockStore.hourlyForecastByDate = {
      '2022-01-01': sampleHourlyForecast
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    const hourlyItems = wrapper.findAll('[data-testid="hourly-item"]')
    expect(hourlyItems.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('60°') // First hour temperature
  })

  it('shows error state when hourly data fails to load', async () => {
    mockStore.loadHourlyForecastForDay.mockRejectedValue(new Error('API Error'))

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')
    // Wait for error state to appear
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="hourly-error"]').exists()).toBe(true)
  })

  it('does not reload hourly data if already cached', async () => {
    mockStore.hourlyForecastByDate = {
      '2022-01-01': sampleHourlyForecast
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    // Expand twice
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    // Should not call API since data is already cached
    expect(mockStore.loadHourlyForecastForDay).toHaveBeenCalledTimes(0)
  })

  it('formats hourly timestamps correctly', async () => {
    mockStore.hourlyForecastByDate = {
      '2022-01-01': sampleHourlyForecast.slice(0, 3) // Just first 3 hours
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    // Should show time formats like "12 AM", "1 AM", etc.
    expect(wrapper.text()).toMatch(/\d{1,2}\s?(AM|PM)/i)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    const button = wrapper.find('[data-testid="day-row-button"]')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBeDefined()
  })

  it('updates accessibility attributes when expanded', async () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    const button = wrapper.find('[data-testid="day-row-button"]')
    expect(button.attributes('aria-expanded')).toBe('true')
  })
})