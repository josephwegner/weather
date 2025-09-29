<template>
  <div class="day-forecast-row" :class="{ expanded: isExpanded }">
    <button
      class="day-summary"
      @click="toggleExpanded"
      data-testid="day-row-button"
      :aria-expanded="isExpanded"
      :aria-controls="`hourly-${dayForecast.date}`"
    >
      <div class="left-content">
        <div class="day-info">
          <div class="day-name">{{ dayName }}</div>
          <div class="precipitation">
            <span class="water-drop">💧</span>
            <span class="precip-percentage"
              >{{ Math.round(dayForecast.precipitationProbability) }}%</span
            >
          </div>
        </div>
        <img :src="iconUrl" :alt="dayForecast.description" class="weather-icon" />
      </div>

      <div class="temperature-range" v-if="!temperatureRangePosition">
        <span class="low">{{ Math.round(dayForecast.temperatureLow) }}°</span>
        <span class="high">{{ Math.round(dayForecast.temperatureHigh) }}°</span>
      </div>

      <div class="temperature-range-visual" v-else>
        <div
          class="range-container"
          :style="{
            left: `${temperatureRangePosition.lowPosition * 100}%`,
            minWidth: `${temperatureRangePosition.rangeWidth * 100}%`
          }"
        >
          <span class="temp-value temp-low">{{ Math.round(dayForecast.temperatureLow) }}°</span>
          <span class="temp-value temp-high">{{ Math.round(dayForecast.temperatureHigh) }}°</span>
        </div>
      </div>
    </button>

    <transition name="accordion">
      <div
        v-if="isExpanded"
        class="hourly-section"
        data-testid="hourly-detail"
        :id="`hourly-${dayForecast.date}`"
      >
        <div
          v-if="isLoadingHourly"
          class="loading-hourly hourly-state-container"
          data-testid="hourly-loading"
        >
          Loading hourly forecast...
        </div>

        <div
          v-else-if="hourlyError"
          class="error-hourly hourly-state-container"
          data-testid="hourly-error"
        >
          {{ hourlyError }}
        </div>

        <div v-else-if="hourlyDataWithConditionLabels" class="hourly-forecast">
          <div class="hourly-content">
            <table
              class="hourly-list"
              data-testid="hourly-list"
              aria-label="Hourly weather forecast"
            >
              <tbody>
                <HourlyForecastRow
                  v-for="hour in hourlyDataWithConditionLabels"
                  :key="hour.timestamp"
                  :hour-data="hour"
                  :selected-metric="selectedMetric"
                  :show-condition-label="hour.showConditionLabel"
                  :relative-value-offset="relativeValueOffsets[hour.timestamp] || 0"
                />
              </tbody>
            </table>
          </div>

          <MetricToggle
            :selected-metric="selectedMetric"
            :available-metrics="availableMetrics"
            @metric-change="handleMetricChange"
          />
        </div>

        <div v-else class="no-hourly-data hourly-state-container">
          No hourly data available for this day
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { DailyForecast } from '../types/weather'
  import type { MetricType, MetricOption } from '../types/metrics'
  import { useWeatherStore } from '../stores/weather'
  import { getWeatherCategory } from '../utils/weatherConditions'
  import MetricToggle from './MetricToggle.vue'
  import HourlyForecastRow from './HourlyForecastRow.vue'
  import type { TemperatureRangePosition } from '../utils/temperatureRange'

  interface Props {
    dayForecast: DailyForecast
    temperatureRangePosition?: TemperatureRangePosition
  }

  const props = defineProps<Props>()
  const store = useWeatherStore()

  const isExpanded = ref(false)
  const hourlyError = ref<string | null>(null)
  const selectedMetric = ref<MetricType>('temperature')

  const availableMetrics: MetricOption[] = [
    { key: 'temperature', label: 'TEMP', unit: '°F' },
    { key: 'feelsLike', label: 'FEELS-LIKE', unit: '°F' },
    { key: 'precipitationProbability', label: 'PRECIP PROB', unit: '%' },
    { key: 'precipitationIntensity', label: 'PRECIP', unit: 'in' },
    { key: 'humidity', label: 'HUMIDITY', unit: '%' },
    { key: 'windSpeed', label: 'WIND', unit: 'mph' },
    { key: 'windGust', label: 'GUST', unit: 'mph' },
    { key: 'pressure', label: 'PRESSURE', unit: 'mb' },
    { key: 'uvIndex', label: 'UV INDEX', unit: '' },
    { key: 'cloudCover', label: 'CLOUDS', unit: '%' },
    { key: 'visibility', label: 'VISIBILITY', unit: 'mi' }
  ]

  const dayName = computed(() => {
    const date = new Date(props.dayForecast.timestamp * 1000)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  })

  const iconUrl = computed(() => {
    return `https://openweathermap.org/img/w/${props.dayForecast.icon}.png`
  })

  const hourlyData = computed(() => {
    return store.hourlyForecastByDate[props.dayForecast.date] || null
  })

  const hourlyDataWithConditionLabels = computed(() => {
    if (!hourlyData.value) return null

    return hourlyData.value.map((hour, index) => {
      const currentCondition = getWeatherCategory(hour.icon)
      const previousCondition =
        index > 0 ? getWeatherCategory(hourlyData.value![index - 1].icon) : null

      return {
        ...hour,
        showConditionLabel: index === 0 || currentCondition !== previousCondition
      }
    })
  })

  const isLoadingHourly = computed(() => {
    return store.isLoadingHourlyForDate(props.dayForecast.date)
  })

  const toggleExpanded = async () => {
    isExpanded.value = !isExpanded.value

    if (isExpanded.value && !hourlyData.value) {
      hourlyError.value = null
      try {
        await store.loadHourlyForecastForDay(props.dayForecast.date)
      } catch (error) {
        hourlyError.value = 'Failed to load hourly forecast'
      }
    }
  }

  const relativeValueOffsets = computed(() => {
    if (!hourlyDataWithConditionLabels.value) return {}

    let minTemp = Infinity
    let maxTemp = -Infinity
    const offsets: Record<number, number> = {}

    // Find min and max temperatures
    hourlyDataWithConditionLabels.value.forEach((hour) => {
      if (hour.temperature < minTemp) {
        minTemp = hour.temperature
      }
      if (hour.temperature > maxTemp) {
        maxTemp = hour.temperature
      }
    })

    // Calculate relative offsets for each hour
    hourlyDataWithConditionLabels.value.forEach((hour) => {
      const range = maxTemp - minTemp
      if (range === 0) {
        offsets[hour.timestamp] = 0
      } else {
        offsets[hour.timestamp] = (hour.temperature - minTemp) / range
      }
    })

    return offsets
  })

  const handleMetricChange = (metric: MetricType) => {
    selectedMetric.value = metric
  }

  // Expose for testing
  defineExpose({
    selectedMetric
  })
</script>

<style scoped>
  .day-forecast-row {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(71, 85, 105, 0.3);
    overflow: hidden;
  }

  .day-forecast-row:last-child {
    border-bottom: none;
  }

  .day-summary {
    display: grid;
    grid-template-columns: minmax(100px, 1fr) 2fr;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border: none;
    width: 100%;
    text-align: left;
    background: transparent;
  }

  .left-content {
    display: grid;
    grid-template-columns: auto 40px;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .day-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .precipitation {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .water-drop {
    font-size: 0.8rem;
  }

  .precip-percentage {
    font-size: 0.8rem;
    color: #60a5fa;
    font-weight: 500;
  }

  .weather-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    justify-self: center;
  }

  .day-summary:hover {
    background-color: rgba(71, 85, 105, 0.3);
  }

  .day-name {
    font-weight: 500;
    font-size: 0.9rem;
    color: white;
    text-align: left;
  }

  .temperature-range {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: 60px;
  }

  .temperature-range .low {
    font-size: 0.9rem;
    color: rgb(148, 163, 184);
  }

  .temperature-range .high {
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
  }

  .temperature-range-visual {
    position: relative;
    height: 32px;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .range-container {
    position: absolute;
    height: 24px;
    background-color: rgb(51, 65, 85);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    min-width: 60px;
    transition: all 0.2s ease;
  }

  .temp-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: white;
    white-space: nowrap;
  }

  .temp-low {
    color: rgb(203, 213, 225);
    margin-right: 8px;
  }

  .temp-high {
    color: white;
    font-weight: 600;
  }

  .hourly-section {
    border-top: 1px solid rgb(71, 85, 105);
    background-color: rgb(30, 41, 59);
    overflow: hidden;
  }

  .accordion-enter-active,
  .accordion-leave-active {
    transition:
      max-height 0.2s ease,
      opacity 0.2s ease;
    overflow: hidden;
  }

  .accordion-enter-from,
  .accordion-leave-to {
    max-height: 0;
    opacity: 0;
  }

  .accordion-enter-to,
  .accordion-leave-from {
    max-height: 500px;
    opacity: 1;
  }

  .hourly-state-container {
    min-height: 350px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-hourly {
    text-align: center;
    color: rgb(148, 163, 184);
    padding: 1rem;
  }

  .error-hourly {
    text-align: center;
    color: rgb(248, 113, 113);
    padding: 1rem;
    background-color: rgba(248, 113, 113, 0.1);
    border-radius: 4px;
  }

  .hourly-forecast h4 {
    margin: 0 0 1rem 0;
    color: white;
    font-size: 1rem;
  }

  .hourly-forecast {
    display: flex;
    flex-direction: column;
    height: 300px;
  }

  .hourly-content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .hourly-content::-webkit-scrollbar {
    display: none;
  }

  .hourly-list {
    background: rgb(51, 65, 85);
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
    border-collapse: collapse;
  }

  .no-hourly-data {
    text-align: center;
    color: rgb(148, 163, 184);
    padding: 1rem;
    font-style: italic;
  }
</style>
