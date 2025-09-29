<template>
  <div class="weekly-forecast">
    <div v-if="store.isLoading" class="loading">Loading forecast...</div>

    <div v-else-if="store.error" class="error">
      {{ store.error }}
    </div>

    <div v-else-if="!store.dailyForecast || store.dailyForecast.length === 0" class="no-data">
      No forecast data available
    </div>

    <div v-else class="forecast-list">
      <DayForecastRow
        v-for="day in store.dailyForecast.slice(0, 7)"
        :key="day.date"
        :dayForecast="day"
        data-testid="day-forecast-row"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useWeatherStore } from '../stores/weather'
  import DayForecastRow from './DayForecastRow.vue'

  const store = useWeatherStore()

  onMounted(() => {
    store.loadDailyForecast()
  })
</script>

<style scoped>
  .weekly-forecast {
    padding: 0;
  }

  .weekly-forecast h2 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 500;
    color: white;
  }

  .loading,
  .error,
  .no-data {
    padding: 1rem;
    text-align: center;
    border-radius: 4px;
  }

  .loading {
    background-color: rgba(148, 163, 184, 0.1);
    color: rgb(148, 163, 184);
  }

  .error {
    background-color: rgba(248, 113, 113, 0.1);
    color: rgb(248, 113, 113);
  }

  .no-data {
    background-color: rgba(148, 163, 184, 0.1);
    color: rgb(148, 163, 184);
  }

  .forecast-list {
    background: transparent;
  }
</style>
