import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DayForecastRow from '../../components/DayForecastRow.vue'
import { useWeatherStore } from '../../stores/weather'
import type { DailyForecast, HourlyForecast } from '../../types/weather'
import type { TemperatureRangePosition } from '../../utils/temperatureRange'

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
    precipitationType: 'rain',
    windSpeed: 8,
    windDirection: 180,
    windGust: 12,
    pressure: 1013,
    uvIndex: 3,
    cloudCover: 25,
    visibility: 10,
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
    expect(wrapper.find('[data-testid="day-row-button"]').attributes('aria-expanded')).toBe('false')
  })

  it('expands when clicked and loads hourly data', async () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    expect(wrapper.find('[data-testid="day-row-button"]').attributes('aria-expanded')).toBe('true')
    expect(mockStore.loadHourlyForecastForDay).toHaveBeenCalledWith('2022-01-01')
  })

  it('collapses when clicked while expanded', async () => {
    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    // Expand first
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')
    expect(wrapper.find('[data-testid="day-row-button"]').attributes('aria-expanded')).toBe('true')

    // Then collapse
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')
    expect(wrapper.find('[data-testid="day-row-button"]').attributes('aria-expanded')).toBe('false')
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

    // Check that list and rows exist
    expect(wrapper.find('[data-testid="hourly-list"]').exists()).toBe(true)
    const hourlyRows = wrapper.findAll('.hourly-row')
    expect(hourlyRows.length).toBeGreaterThan(0)
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

  it('displays hourly forecast as table with correct structure', async () => {
    mockStore.hourlyForecastByDate = {
      '2022-01-01': sampleHourlyForecast.slice(0, 3) // First 3 hours
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    // Check list structure exists
    const list = wrapper.find('[data-testid="hourly-list"]')
    expect(list.exists()).toBe(true)

    // Check that HourlyForecastRow components are rendered
    const rows = list.findAll('.hourly-row')
    expect(rows).toHaveLength(3)
  })

  it('displays metric toggle component when expanded', async () => {
    mockStore.hourlyForecastByDate = {
      '2022-01-01': sampleHourlyForecast.slice(0, 3)
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    const metricToggle = wrapper.find('.metric-toggle')
    expect(metricToggle.exists()).toBe(true)
  })

  it('displays temperature metric by default', async () => {
    mockStore.hourlyForecastByDate = {
      '2022-01-01': sampleHourlyForecast.slice(0, 1)
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    const tempButton = wrapper.find('.metric-temperature')
    expect(tempButton.classes()).toContain('selected')
  })

  it('changes selected metric when metric toggle is used', async () => {
    mockStore.hourlyForecastByDate = {
      '2022-01-01': sampleHourlyForecast.slice(0, 1)
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    // Initially temperature should be selected
    const tempButton = wrapper.find('.metric-temperature')
    expect(tempButton.classes()).toContain('selected')

    // Change to humidity metric
    wrapper.vm.selectedMetric = 'humidity'
    await wrapper.vm.$nextTick()

    const humidityButton = wrapper.find('.metric-humidity')
    expect(humidityButton.classes()).toContain('selected')
    expect(tempButton.classes()).not.toContain('selected')
  })

  it('shows condition labels only when weather conditions change', async () => {
    // Create test data with changing weather conditions
    const testHourlyData = [
      { timestamp: 1641081600, icon: '01d', description: 'clear sky', temperature: 70 }, // Clear
      { timestamp: 1641085200, icon: '01d', description: 'clear sky', temperature: 72 }, // Clear (same)
      { timestamp: 1641088800, icon: '02d', description: 'partly cloudy', temperature: 74 }, // Cloudy (change)
      { timestamp: 1641092400, icon: '10d', description: 'light rain', temperature: 68 }, // Rain (change)
      { timestamp: 1641096000, icon: '10d', description: 'light rain', temperature: 66 } // Rain (same)
    ]

    // Mock the hourly data in the store
    mockStore.hourlyForecastByDate = {
      [sampleDayForecast.date]: testHourlyData
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast },
      global: { plugins: [createPinia()] }
    })

    // Expand the row
    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    // Get all hourly forecast rows
    const hourlyRows = wrapper.findAll('.hourly-row')
    expect(hourlyRows).toHaveLength(5)

    // Check condition labels - should appear on 1st, 3rd, and 4th rows (condition changes)
    const expectedLabels = [
      { index: 0, shouldShow: true, expectedText: 'Clear Sky' }, // First row always shows
      { index: 1, shouldShow: false }, // Same as previous (clear)
      { index: 2, shouldShow: true, expectedText: 'Partly Cloudy' }, // Changed to cloudy
      { index: 3, shouldShow: true, expectedText: 'Light Rain' }, // Changed to rain
      { index: 4, shouldShow: false } // Same as previous (rain)
    ]

    expectedLabels.forEach(({ index, shouldShow, expectedText }) => {
      const row = hourlyRows[index]
      const conditionCell = row.find('.hour-condition')

      if (shouldShow) {
        expect(conditionCell.text()).toBe(expectedText)
        expect(conditionCell.text()).not.toBe('')
      } else {
        expect(conditionCell.text()).toBe('')
      }
    })
  })

  it('properly calculates accessibility labels for screen readers', async () => {
    const testHourlyData = [
      {
        timestamp: 1641081600,
        icon: '01d',
        description: 'clear sky',
        temperature: 70,
        feelsLike: 72,
        humidity: 65,
        precipitationProbability: 0,
        precipitationIntensity: 0,
        windSpeed: 5,
        windDirection: 180,
        windGust: 8,
        pressure: 1013,
        uvIndex: 3,
        cloudCover: 10,
        visibility: 10
      }
    ]

    mockStore.hourlyForecastByDate = {
      [sampleDayForecast.date]: testHourlyData
    }

    const wrapper = mount(DayForecastRow, {
      props: { dayForecast: sampleDayForecast },
      global: { plugins: [createPinia()] }
    })

    await wrapper.find('[data-testid="day-row-button"]').trigger('click')

    const hourlyRow = wrapper.find('.hourly-row')
    const ariaLabel = hourlyRow.attributes('aria-label')

    // Should include time, condition, category, and metric value
    expect(ariaLabel).toContain('12 AM') // Time
    expect(ariaLabel).toContain('Clear Sky') // Condition
    expect(ariaLabel).toContain('clear-day conditions') // Category
    expect(ariaLabel).toContain('70°') // Temperature metric
  })

  describe('Temperature Range Visual Positioning', () => {
    const sampleRangePosition: TemperatureRangePosition = {
      lowPosition: 0.25,
      highPosition: 0.75,
      rangeWidth: 0.5
    }

    it('renders temperature range with relative positioning when temperatureRangePosition prop is provided', () => {
      const wrapper = mount(DayForecastRow, {
        props: {
          dayForecast: sampleDayForecast,
          temperatureRangePosition: sampleRangePosition
        }
      })

      const temperatureRange = wrapper.find('.temperature-range-visual')
      expect(temperatureRange.exists()).toBe(true)

      // Check if the visual container has correct positioning styles
      const rangeContainer = wrapper.find('.range-container')
      expect(rangeContainer.exists()).toBe(true)
      expect(rangeContainer.attributes('style')).toContain('left: 25%') // lowPosition * 100
      expect(rangeContainer.attributes('style')).toContain('width: 50%') // rangeWidth * 100
    })

    it('renders temperature values in rounded grey containers with correct positioning', () => {
      const wrapper = mount(DayForecastRow, {
        props: {
          dayForecast: sampleDayForecast,
          temperatureRangePosition: sampleRangePosition
        }
      })

      const lowTemp = wrapper.find('.temp-low')
      const highTemp = wrapper.find('.temp-high')

      expect(lowTemp.exists()).toBe(true)
      expect(highTemp.exists()).toBe(true)

      // Should have rounded styling classes
      expect(lowTemp.classes()).toContain('temp-value')
      expect(highTemp.classes()).toContain('temp-value')

      // Should display correct temperature values
      expect(lowTemp.text()).toBe('55°')
      expect(highTemp.text()).toBe('75°')
    })

    it('falls back to original temperature display when temperatureRangePosition prop is not provided', () => {
      const wrapper = mount(DayForecastRow, {
        props: { dayForecast: sampleDayForecast }
      })

      // Should not render the visual positioning elements
      expect(wrapper.find('.temperature-range-visual').exists()).toBe(false)
      expect(wrapper.find('.range-container').exists()).toBe(false)

      // Should still render the basic temperature range
      const temperatureRange = wrapper.find('.temperature-range')
      expect(temperatureRange.exists()).toBe(true)
      expect(temperatureRange.text()).toContain('75°')
      expect(temperatureRange.text()).toContain('55°')
    })

    it('handles edge case positioning values correctly', () => {
      const edgeCasePosition: TemperatureRangePosition = {
        lowPosition: 0,
        highPosition: 1,
        rangeWidth: 1
      }

      const wrapper = mount(DayForecastRow, {
        props: {
          dayForecast: sampleDayForecast,
          temperatureRangePosition: edgeCasePosition
        }
      })

      const rangeContainer = wrapper.find('.range-container')
      expect(rangeContainer.attributes('style')).toContain('left: 0%')
      expect(rangeContainer.attributes('style')).toContain('width: 100%')
    })

    it('handles zero width range correctly (same high and low temp)', () => {
      const zeroWidthPosition: TemperatureRangePosition = {
        lowPosition: 0.5,
        highPosition: 0.5,
        rangeWidth: 0
      }

      const sameTempDay: DailyForecast = {
        ...sampleDayForecast,
        temperatureHigh: 65,
        temperatureLow: 65
      }

      const wrapper = mount(DayForecastRow, {
        props: {
          dayForecast: sameTempDay,
          temperatureRangePosition: zeroWidthPosition
        }
      })

      const rangeContainer = wrapper.find('.range-container')
      expect(rangeContainer.attributes('style')).toContain('left: 50%')
      expect(rangeContainer.attributes('style')).toContain('width: 0%')

      // Both temp values should be the same
      const lowTemp = wrapper.find('.temp-low')
      const highTemp = wrapper.find('.temp-high')
      expect(lowTemp.text()).toBe('65°')
      expect(highTemp.text()).toBe('65°')
    })
  })
})
