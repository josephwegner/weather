<template>
  <div class="day-forecast-row" :class="{ expanded: isExpanded }">
    <button
      class="day-summary"
      @click="toggleExpanded"
      data-testid="day-row-button"
      :aria-expanded="isExpanded"
      :aria-controls="`hourly-${dayForecast.date}`"
    >
      <div class="day-info">
        <div class="day-name">{{ dayName }}</div>
        <div class="weather-icon" data-testid="weather-icon">
          <img :src="iconUrl" :alt="dayForecast.description" />
        </div>
        <div class="description">{{ dayForecast.description }}</div>
      </div>

      <div class="temperature">
        <span class="high">{{ Math.round(dayForecast.temperatureHigh) }}°</span>
        <span class="low">{{ Math.round(dayForecast.temperatureLow) }}°</span>
      </div>

      <div class="precipitation">
        <span class="precip-probability">{{ dayForecast.precipitationProbability }}%</span>
        <span class="precip-icon">🌧️</span>
      </div>

      <div class="expand-arrow" :class="{ rotated: isExpanded }">▼</div>
    </button>

    <div
      v-if="isExpanded"
      class="hourly-section"
      data-testid="hourly-detail"
      :id="`hourly-${dayForecast.date}`"
    >
      <div v-if="isLoadingHourly" class="loading-hourly" data-testid="hourly-loading">
        Loading hourly forecast...
      </div>

      <div v-else-if="hourlyError" class="error-hourly" data-testid="hourly-error">
        {{ hourlyError }}
      </div>

      <div v-else-if="hourlyData" class="hourly-forecast">
        <table class="hourly-table" data-testid="hourly-table">
          <tbody>
            <tr
              v-for="hour in hourlyData"
              :key="hour.timestamp"
              class="hourly-row"
              data-testid="hourly-row"
            >
              <td class="hour-time">{{ formatHour(hour.timestamp) }}</td>
              <td class="hour-weather">
                <img :src="getHourlyIconUrl(hour.icon)" :alt="hour.description" />
              </td>
              <td class="hour-temp">{{ Math.round(hour.temperature) }}°</td>
              <td class="hour-precip">{{ hour.precipitationProbability }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-hourly-data">No hourly data available for this day</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { DailyForecast } from '../types/weather'
  import { useWeatherStore } from '../stores/weather'

  interface Props {
    dayForecast: DailyForecast
  }

  const props = defineProps<Props>()
  const store = useWeatherStore()

  const isExpanded = ref(false)
  const hourlyError = ref<string | null>(null)

  const dayName = computed(() => {
    const date = new Date(props.dayForecast.timestamp * 1000)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // Compare dates by converting to YYYY-MM-DD strings to avoid time zone issues
    const dateStr = date.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    if (dateStr === todayStr) {
      return 'Today'
    } else if (dateStr === tomorrowStr) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    }
  })

  const iconUrl = computed(() => {
    return `https://openweathermap.org/img/w/${props.dayForecast.icon}.png`
  })

  const hourlyData = computed(() => {
    return store.hourlyForecastByDate[props.dayForecast.date] || null
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
</script>

<style scoped>
  .day-forecast-row {
    background: rgb(51, 65, 85);
    border: 1px solid rgb(71, 85, 105);
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .day-forecast-row:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .day-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border: none;
    width: 100%;
    text-align: left;
    background: transparent;
  }

  .day-summary:hover {
    background-color: rgb(71, 85, 105);
  }

  .day-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .day-name {
    font-weight: 600;
    font-size: 1rem;
    min-width: 80px;
    color: white;
  }

  .weather-icon img {
    width: 40px;
    height: 40px;
  }

  .description {
    color: rgb(148, 163, 184);
    text-transform: capitalize;
  }

  .temperature {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 1rem;
  }

  .temperature .high {
    font-weight: 600;
    font-size: 1.1rem;
    color: white;
  }

  .temperature .low {
    font-size: 0.9rem;
    color: rgb(148, 163, 184);
  }

  .precipitation {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 1rem;
  }

  .precip-probability {
    font-size: 0.9rem;
    color: #4a90e2;
  }

  .precip-icon {
    font-size: 1rem;
  }

  .expand-arrow {
    font-size: 0.8rem;
    color: rgb(148, 163, 184);
    transition: transform 0.3s ease;
    margin-left: 0.5rem;
  }

  .expand-arrow.rotated {
    transform: rotate(180deg);
  }

  .hourly-section {
    border-top: 1px solid rgb(71, 85, 105);
    background-color: rgb(30, 41, 59);
    padding: 1rem;
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

  .hourly-table {
    width: 100%;
    border-collapse: collapse;
    background: rgb(51, 65, 85);
    border-radius: 4px;
    overflow: hidden;
    max-height: 300px;
    display: block;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .hourly-table::-webkit-scrollbar {
    display: none;
  }

  .hourly-table tbody {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  .hourly-table td {
    padding: 0.75rem;
    border-bottom: 1px solid rgb(71, 85, 105);
    vertical-align: middle;
  }

  .hourly-row:hover {
    background: rgba(71, 85, 105, 0.3);
  }

  .hour-time {
    font-size: 0.85rem;
    color: white;
    font-weight: 500;
  }

  .hour-weather img {
    width: 24px;
    height: 24px;
    vertical-align: middle;
  }

  .hour-temp {
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
  }

  .hour-precip {
    font-size: 0.85rem;
    color: #4a90e2;
    font-weight: 500;
  }

  .no-hourly-data {
    text-align: center;
    color: rgb(148, 163, 184);
    padding: 1rem;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .day-summary {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }

    .day-info {
      justify-content: space-between;
    }

    .hourly-table th,
    .hourly-table td {
      padding: 0.5rem;
      font-size: 0.8rem;
    }

    .hour-weather img {
      width: 20px;
      height: 20px;
    }
  }
</style>
