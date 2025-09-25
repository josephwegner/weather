<template>
  <tr class="hourly-row">
    <td class="hour-time">{{ formatHour(hourData.timestamp) }}</td>
    <td class="hour-weather">
      <img :src="getHourlyIconUrl(hourData.icon)" :alt="hourData.description" />
    </td>
    <td class="hour-metric">{{ getMetricValue(hourData) }}</td>
  </tr>
</template>

<script setup lang="ts">
  import type { HourlyForecast } from '../types/weather'
  import type { MetricType } from '../types/metrics'

  interface Props {
    hourData: HourlyForecast
    selectedMetric: MetricType
  }

  const props = defineProps<Props>()

  const formatHour = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
      timeZone: 'UTC'
    })
  }

  const getHourlyIconUrl = (icon: string) => {
    return `https://openweathermap.org/img/w/${icon}.png`
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
  .hourly-row:hover {
    background: rgba(71, 85, 105, 0.3);
  }

  .hour-time {
    font-size: 0.85rem;
    color: white;
    font-weight: 500;
    padding: 0.75rem;
    border-bottom: 1px solid rgb(71, 85, 105);
    vertical-align: middle;
  }

  .hour-weather {
    padding: 0.75rem;
    border-bottom: 1px solid rgb(71, 85, 105);
    vertical-align: middle;
  }

  .hour-weather img {
    width: 24px;
    height: 24px;
    vertical-align: middle;
  }

  .hour-metric {
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
    padding: 0.75rem;
    border-bottom: 1px solid rgb(71, 85, 105);
    vertical-align: middle;
  }

  @media (max-width: 768px) {
    .hour-time,
    .hour-weather,
    .hour-metric {
      padding: 0.5rem;
      font-size: 0.8rem;
    }

    .hour-weather img {
      width: 20px;
      height: 20px;
    }
  }
</style>
