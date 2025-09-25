import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricToggle from '../../components/MetricToggle.vue'
import type { MetricType } from '../../types/metrics'

describe('MetricToggle Component', () => {
  const defaultProps = {
    selectedMetric: 'temperature' as MetricType,
    availableMetrics: [
      { key: 'temperature' as MetricType, label: 'TEMP', unit: '°F' },
      { key: 'feelsLike' as MetricType, label: 'FEELS-LIKE', unit: '°F' },
      { key: 'precipitationProbability' as MetricType, label: 'PRECIP PROB', unit: '%' },
      { key: 'precipitationIntensity' as MetricType, label: 'PRECIP', unit: 'in' },
      { key: 'humidity' as MetricType, label: 'HUMIDITY', unit: '%' },
      { key: 'windSpeed' as MetricType, label: 'WIND', unit: 'mph' },
      { key: 'windGust' as MetricType, label: 'GUST', unit: 'mph' },
      { key: 'pressure' as MetricType, label: 'PRESSURE', unit: 'mb' },
      { key: 'uvIndex' as MetricType, label: 'UV INDEX', unit: '' },
      { key: 'cloudCover' as MetricType, label: 'CLOUDS', unit: '%' },
      { key: 'visibility' as MetricType, label: 'VISIBILITY', unit: 'mi' }
    ]
  }

  it('renders all available metric buttons', () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    const buttons = wrapper.findAll('.metric-button')
    expect(buttons).toHaveLength(defaultProps.availableMetrics.length)

    defaultProps.availableMetrics.forEach((metric) => {
      expect(wrapper.text()).toContain(metric.label)
    })
  })

  it('highlights the selected metric', () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    const selectedButton = wrapper.find(`.metric-${defaultProps.selectedMetric}`)
    expect(selectedButton.classes()).toContain('selected')
  })

  it('does not highlight non-selected metrics', () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    const nonSelectedMetrics = defaultProps.availableMetrics.filter(
      (metric) => metric.key !== defaultProps.selectedMetric
    )

    nonSelectedMetrics.forEach((metric) => {
      const button = wrapper.find(`.metric-${metric.key}`)
      expect(button.classes()).not.toContain('selected')
    })
  })

  it('emits metric-change event when a different metric is clicked', async () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    const differentMetric = defaultProps.availableMetrics.find(
      (metric) => metric.key !== defaultProps.selectedMetric
    )!

    const button = wrapper.find(`.metric-${differentMetric.key}`)
    await button.trigger('click')

    expect(wrapper.emitted('metric-change')).toBeTruthy()
    expect(wrapper.emitted('metric-change')![0]).toEqual([differentMetric.key])
  })

  it('does not emit event when clicking the already selected metric', async () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    const selectedButton = wrapper.find(`.metric-${defaultProps.selectedMetric}`)
    await selectedButton.trigger('click')

    expect(wrapper.emitted('metric-change')).toBeFalsy()
  })

  it('displays correct button labels with units', () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    defaultProps.availableMetrics.forEach((metric) => {
      const button = wrapper.find(`.metric-${metric.key}`)
      const expectedText = metric.unit ? `${metric.label} (${metric.unit})` : metric.label
      expect(button.text()).toBe(expectedText)
    })
  })

  it('handles selection changes correctly', async () => {
    const wrapper = mount(MetricToggle, {
      props: {
        ...defaultProps,
        selectedMetric: 'humidity' as MetricType
      }
    })

    // Check that humidity is highlighted
    const humidityButton = wrapper.find('.metric-humidity')
    expect(humidityButton.classes()).toContain('selected')

    // Check that temperature is not highlighted
    const tempButton = wrapper.find('.metric-temperature')
    expect(tempButton.classes()).not.toContain('selected')
  })

  it('works with different sets of metrics', () => {
    const customProps = {
      selectedMetric: 'windSpeed' as MetricType,
      availableMetrics: [
        { key: 'windSpeed' as MetricType, label: 'WIND', unit: 'mph' },
        { key: 'pressure' as MetricType, label: 'PRESSURE', unit: 'mb' }
      ]
    }

    const wrapper = mount(MetricToggle, {
      props: customProps
    })

    const buttons = wrapper.findAll('.metric-button')
    expect(buttons).toHaveLength(2)

    const selectedButton = wrapper.find('.metric-windSpeed')
    expect(selectedButton.classes()).toContain('selected')
  })

  it('has correct ARIA pressed attributes', () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    // Selected metric should have aria-pressed="true"
    const selectedButton = wrapper.find(`.metric-${defaultProps.selectedMetric}`)
    expect(selectedButton.attributes('aria-pressed')).toBe('true')

    // Non-selected metrics should have aria-pressed="false"
    const nonSelectedMetrics = defaultProps.availableMetrics.filter(
      (metric) => metric.key !== defaultProps.selectedMetric
    )

    nonSelectedMetrics.forEach((metric) => {
      const button = wrapper.find(`.metric-${metric.key}`)
      expect(button.attributes('aria-pressed')).toBe('false')
    })
  })

  it('has descriptive ARIA labels for all metrics', () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    defaultProps.availableMetrics.forEach((metric) => {
      const button = wrapper.find(`.metric-${metric.key}`)
      const ariaLabel = button.attributes('aria-label')

      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel).toContain('Switch to')
      expect(ariaLabel).toContain(metric.label.toLowerCase())
      expect(ariaLabel).toContain('metric')

      if (metric.unit) {
        expect(ariaLabel).toContain(metric.unit)
      }
    })
  })

  it('updates ARIA pressed state when selection changes', async () => {
    const wrapper = mount(MetricToggle, {
      props: defaultProps
    })

    const initialSelected = wrapper.find('.metric-temperature')
    const toSelect = wrapper.find('.metric-humidity')

    // Initial state
    expect(initialSelected.attributes('aria-pressed')).toBe('true')
    expect(toSelect.attributes('aria-pressed')).toBe('false')

    // Click to change selection
    await toSelect.trigger('click')

    // Check that event was emitted (component itself doesn't change state)
    expect(wrapper.emitted('metric-change')).toBeTruthy()
    expect(wrapper.emitted('metric-change')![0]).toEqual(['humidity'])
  })

  it('generates correct ARIA labels for metrics with and without units', () => {
    const propsWithMixedUnits = {
      selectedMetric: 'uvIndex' as MetricType,
      availableMetrics: [
        { key: 'temperature' as MetricType, label: 'TEMP', unit: '°F' },
        { key: 'uvIndex' as MetricType, label: 'UV INDEX', unit: '' } // No unit
      ]
    }

    const wrapper = mount(MetricToggle, {
      props: propsWithMixedUnits
    })

    // Metric with unit
    const tempButton = wrapper.find('.metric-temperature')
    expect(tempButton.attributes('aria-label')).toBe('Switch to temp metric in °F')

    // Metric without unit
    const uvButton = wrapper.find('.metric-uvIndex')
    expect(uvButton.attributes('aria-label')).toBe('Switch to uv index metric')
  })
})
