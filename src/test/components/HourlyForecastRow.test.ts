import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HourlyForecastRow from '../../components/HourlyForecastRow.vue'
import type { HourlyForecast } from '../../types/weather'
import type { MetricType } from '../../types/metrics'

describe('HourlyForecastRow Component', () => {
  const sampleHourlyData: HourlyForecast = {
    timestamp: 1641081600, // 2022-01-02 00:00:00 UTC
    temperature: 65,
    feelsLike: 68,
    humidity: 70,
    precipitationProbability: 20,
    precipitationIntensity: 0.1,
    precipitationType: 'rain',
    windSpeed: 8,
    windDirection: 180,
    windGust: 12,
    pressure: 1013,
    uvIndex: 3,
    cloudCover: 40,
    visibility: 10,
    description: 'partly cloudy',
    icon: '02d'
  }

  const availableMetrics = [
    { key: 'temperature' as MetricType, expectedText: '65°' },
    { key: 'feelsLike' as MetricType, expectedText: '68°' },
    { key: 'precipitationProbability' as MetricType, expectedText: '20%' },
    { key: 'precipitationIntensity' as MetricType, expectedText: '0.10"' },
    { key: 'humidity' as MetricType, expectedText: '70%' },
    { key: 'windSpeed' as MetricType, expectedText: '8 mph' },
    { key: 'windGust' as MetricType, expectedText: '12 mph' },
    { key: 'pressure' as MetricType, expectedText: '1013 mb' },
    { key: 'uvIndex' as MetricType, expectedText: '3' },
    { key: 'cloudCover' as MetricType, expectedText: '40%' },
    { key: 'visibility' as MetricType, expectedText: '10.0 mi' }
  ]

  it('renders hour time correctly', () => {
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType
      }
    })

    const timeCell = wrapper.find('.hour-time')
    expect(timeCell.text()).toMatch(/\d{1,2}\s?(AM|PM)/i)
  })

  it('applies correct colored left border based on weather condition', () => {
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType
      }
    })

    const row = wrapper.find('.hourly-row')
    // '02d' should be cloudy (#6b7280 = rgb(107, 114, 128))
    expect(row.attributes('style')).toContain('border-left-color: rgb(107, 114, 128)')
    expect(row.attributes('style')).toContain('border-left-width: 0.5rem')
  })

  it('displays correct metric values for all available metrics', () => {
    availableMetrics.forEach(({ key, expectedText }) => {
      const wrapper = mount(HourlyForecastRow, {
        props: {
          hourData: sampleHourlyData,
          selectedMetric: key
        }
      })

      const metricCell = wrapper.find('.hour-metric')
      expect(metricCell.text()).toBe(expectedText)
    })
  })

  it('renders 3-column layout with time, condition, and metric', () => {
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType
      }
    })

    expect(wrapper.classes()).toContain('hourly-row')
    expect(wrapper.find('.hour-time').exists()).toBe(true)
    expect(wrapper.find('.hour-condition').exists()).toBe(true)
    expect(wrapper.find('.hour-metric').exists()).toBe(true)

    // Should have exactly 3 div elements (time, condition, metric)
    const columns = wrapper.findAll('.hourly-row > div')
    expect(columns).toHaveLength(3)
  })

  it('handles zero values correctly', () => {
    const zeroData: HourlyForecast = {
      ...sampleHourlyData,
      precipitationProbability: 0,
      precipitationIntensity: 0,
      windSpeed: 0,
      uvIndex: 0,
      cloudCover: 0
    }

    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: zeroData,
        selectedMetric: 'precipitationProbability' as MetricType
      }
    })

    const metricCell = wrapper.find('.hour-metric')
    expect(metricCell.text()).toBe('0%')
  })

  it('formats time as 12-hour format with AM/PM', () => {
    // Test with different times to ensure AM/PM formatting works
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType
      }
    })

    const timeCell = wrapper.find('.hour-time')
    // Just verify it has the AM/PM format, not specific time
    expect(timeCell.text()).toMatch(/\d{1,2}\s?(AM|PM)/i)
  })

  it('displays different border colors for different weather conditions', () => {
    const weatherConditions = [
      { icon: '01d', expectedRgb: 'rgb(245, 158, 11)', category: 'clear' }, // #f59e0b
      { icon: '02d', expectedRgb: 'rgb(107, 114, 128)', category: 'cloudy' }, // #6b7280
      { icon: '09d', expectedRgb: 'rgb(74, 144, 226)', category: 'rain' }, // #4a90e2
      { icon: '11d', expectedRgb: 'rgb(139, 92, 246)', category: 'storm' }, // #8b5cf6
      { icon: '13d', expectedRgb: 'rgb(226, 232, 240)', category: 'snow' } // #e2e8f0
    ]

    weatherConditions.forEach(({ icon, expectedRgb }) => {
      const testData = { ...sampleHourlyData, icon }
      const wrapper = mount(HourlyForecastRow, {
        props: {
          hourData: testData,
          selectedMetric: 'temperature' as MetricType
        }
      })

      const row = wrapper.find('.hourly-row')
      expect(row.attributes('style')).toContain(`border-left-color: ${expectedRgb}`)
    })
  })

  it('displays condition label when showConditionLabel is true', () => {
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType,
        showConditionLabel: true
      }
    })

    const conditionCell = wrapper.find('.hour-condition')
    expect(conditionCell.text()).toBe('Partly Cloudy')
  })

  it('hides condition label when showConditionLabel is false or undefined', () => {
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType,
        showConditionLabel: false
      }
    })

    const conditionCell = wrapper.find('.hour-condition')
    expect(conditionCell.text()).toBe('')
  })

  it('properly formats different weather descriptions', () => {
    const testCases = [
      { description: 'light rain', expected: 'Light Rain' },
      { description: 'heavy snow', expected: 'Heavy Snow' },
      { description: 'clear sky', expected: 'Clear Sky' },
      { description: 'overcast clouds', expected: 'Overcast Clouds' }
    ]

    testCases.forEach(({ description, expected }) => {
      const testData = { ...sampleHourlyData, description }
      const wrapper = mount(HourlyForecastRow, {
        props: {
          hourData: testData,
          selectedMetric: 'temperature' as MetricType,
          showConditionLabel: true
        }
      })

      const conditionCell = wrapper.find('.hour-condition')
      expect(conditionCell.text()).toBe(expected)
    })
  })
})
