<template>
  <tr
    class="hourly-row"
    :style="{
      borderLeftColor: weatherBorderColor,
      borderLeftWidth: '.5rem',
      borderLeftStyle: 'solid'
    }"
    :aria-label="accessibilityLabel"
  >
    <td class="hour-time">{{ formatHour(hourData.timestamp) }}</td>
    <td class="hour-condition" v-if="showConditionLabel && conditionLabel">
      {{ conditionLabel }}
    </td>
    <td class="hour-condition" v-else></td>
    <td class="hour-metric">
      <div class="metric-container">
        <div
          class="metric-bar"
          :style="{ width: `${relativeValueOffset ? Math.max(relativeValueOffset * 100, 4) : 4}%` }"
        ></div>
        <span class="hour-metric-value">{{ getMetricValue(hourData) }}</span>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { HourlyForecast } from '../types/weather'
  import type { MetricType } from '../types/metrics'
  import {
    getWeatherColor,
    getWeatherCategory,
    getConditionLabel
  } from '../utils/weatherConditions'

  interface Props {
    hourData: HourlyForecast
    selectedMetric: MetricType
    showConditionLabel?: boolean
    relativeValueOffset?: number
  }

  const props = defineProps<Props>()

  const weatherBorderColor = computed(() => getWeatherColor(props.hourData.icon))

  const conditionLabel = computed(() => {
    if (!props.showConditionLabel) return ''
    const category = getWeatherCategory(props.hourData.icon)
    return getConditionLabel(props.hourData.description, category)
  })

  const accessibilityLabel = computed(() => {
    const time = formatHour(props.hourData.timestamp)
    const metric = getMetricValue(props.hourData)
    const condition = conditionLabel.value || 'Weather unchanged'
    const category = getWeatherCategory(props.hourData.icon)

    return `${time}, ${condition}, ${category} conditions, ${metric}`
  })

  const formatHour = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
      timeZone: 'UTC'
    })
  }

  const getMetricValue = (hour: HourlyForecast): string => {
    const metric = props.selectedMetric
    let value: number | string

    try {
      switch (metric) {
        case 'temperature':
          value = Math.round(hour.temperature ?? 0)
          return `${value}°`
        case 'feelsLike':
          value = Math.round(hour.feelsLike ?? 0)
          return `${value}°`
        case 'precipitationProbability':
          return `${hour.precipitationProbability ?? 0}%`
        case 'precipitationIntensity':
          value = (hour.precipitationIntensity ?? 0).toFixed(2)
          return `${value}"`
        case 'humidity':
          return `${hour.humidity ?? 0}%`
        case 'windSpeed':
          value = Math.round(hour.windSpeed ?? 0)
          return `${value} mph`
        case 'windGust':
          value = Math.round(hour.windGust ?? 0)
          return `${value} mph`
        case 'pressure':
          value = Math.round(hour.pressure ?? 0)
          return `${value} mb`
        case 'uvIndex':
          return `${hour.uvIndex ?? 0}`
        case 'cloudCover':
          return `${hour.cloudCover ?? 0}%`
        case 'visibility':
          value = (hour.visibility ?? 0).toFixed(1)
          return `${value} mi`
        default:
          return `${Math.round(hour.temperature ?? 0)}°`
      }
    } catch (error) {
      console.warn('Error formatting metric value:', error, { metric, hour })
      return 'N/A'
    }
  }
</script>

<style scoped>
  .hourly-row {
    border-bottom: 1px solid rgb(71, 85, 105);
  }

  .hourly-row:hover {
    background: rgba(71, 85, 105, 0.3);
  }

  .hour-time {
    font-size: 0.85rem;
    color: white;
    font-weight: 500;
    padding: 0.75rem 0.5rem 0.75rem 0.75rem;
    white-space: nowrap;
  }

  .hour-condition {
    font-size: 0.75rem;
    color: rgb(148, 163, 184);
    font-weight: 400;
    padding: 0.75rem 0.75rem 0.5rem 0;
    font-style: italic;
    white-space: nowrap;
  }

  .hour-metric {
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
    padding: 0.75rem 2.5rem 0 0.75rem;
    width: 100%;
    position: relative;
  }

  .metric-container {
    display: flex;
    align-items: center;
    width: 100%;
    position: relative;
  }

  .metric-bar {
    height: 2px;
    background-color: rgb(107, 114, 128);
    margin-right: 8px;
    flex-shrink: 0;
  }

  .hour-metric-value {
    position: relative;
    right: 0;
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .hour-time {
      padding: 0.5rem;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .hour-condition {
      padding: 0.5rem;
      font-size: 0.7rem;
      white-space: nowrap;
    }

    .hour-metric {
      padding: 0.5rem;
      font-size: 0.8rem;
      width: 100%;
    }
  }
</style>
