<template>
  <div class="metric-toggle">
    <button
      v-for="metric in availableMetrics"
      :key="metric.key"
      class="metric-button"
      :class="{ selected: selectedMetric === metric.key, [`metric-${metric.key}`]: true }"
      :aria-pressed="selectedMetric === metric.key"
      :aria-label="`Switch to ${metric.label.toLowerCase()} metric${metric.unit ? ' in ' + metric.unit : ''}`"
      @click="handleMetricClick(metric.key)"
    >
      {{ metric.unit ? `${metric.label} (${metric.unit})` : metric.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
  import type { MetricType, MetricOption } from '../types/metrics'

  interface Props {
    selectedMetric: MetricType
    availableMetrics: MetricOption[]
  }

  interface Emits {
    (e: 'metric-change', metric: MetricType): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const handleMetricClick = (metric: MetricType) => {
    if (metric !== props.selectedMetric) {
      emit('metric-change', metric)
    }
  }
</script>

<style scoped>
  .metric-toggle {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: rgb(30, 41, 59);
    border-top: 1px solid rgb(71, 85, 105);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .metric-toggle::-webkit-scrollbar {
    display: none;
  }

  .metric-button {
    background: rgb(51, 65, 85);
    color: rgb(148, 163, 184);
    border: 1px solid rgb(71, 85, 105);
    border-radius: 20px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
  }

  .metric-button:hover {
    background: rgb(71, 85, 105);
    color: white;
  }

  .metric-button.selected {
    background: #4a90e2;
    color: white;
    border-color: #4a90e2;
  }

  .metric-button.selected:hover {
    background: #357abd;
  }
</style>
