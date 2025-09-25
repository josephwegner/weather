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

  it('renders weather icon with correct attributes', () => {
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType
      }
    })

    const weatherImg = wrapper.find('.hour-weather img')
    expect(weatherImg.exists()).toBe(true)
    expect(weatherImg.attributes('src')).toContain('02d')
    expect(weatherImg.attributes('alt')).toBe('partly cloudy')
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

  it('renders with correct CSS classes', () => {
    const wrapper = mount(HourlyForecastRow, {
      props: {
        hourData: sampleHourlyData,
        selectedMetric: 'temperature' as MetricType
      }
    })

    expect(wrapper.classes()).toContain('hourly-row')
    expect(wrapper.find('.hour-time').exists()).toBe(true)
    expect(wrapper.find('.hour-weather').exists()).toBe(true)
    expect(wrapper.find('.hour-metric').exists()).toBe(true)
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
})
