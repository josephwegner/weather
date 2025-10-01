<template>
  <button
    :class="buttonClasses"
    :aria-label="ariaLabel"
    :aria-pressed="isActive"
    :aria-disabled="disabled"
    :disabled="disabled || isLoading"
    role="button"
    @click="handleClick"
    @keydown.enter="handleKeyboard"
    @keydown.space.prevent="handleKeyboard"
  >
    <!-- Loading Spinner -->
    <div v-if="isLoading" class="loading-spinner animate-spin w-5 h-5">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </div>

    <!-- Radar Icon -->
    <div v-else class="relative">
      <!-- Radar Scanner Base -->
      <svg class="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <!-- Radar base circle -->
        <circle cx="12" cy="12" r="9" stroke-width="1.5" />
        <circle cx="12" cy="12" r="6" stroke-width="1" opacity="0.6" />
        <circle cx="12" cy="12" r="3" stroke-width="1" opacity="0.4" />
        <circle cx="12" cy="12" r="1" stroke-width="2" />

        <!-- Radar sweep line -->
        <line x1="12" y1="12" x2="12" y2="3" stroke-width="2" />
      </svg>

      <!-- Radar Sweep Animation (only when active) -->
      <div v-if="isActive" class="radar-sweep animate-sweep absolute inset-0 w-5 h-5">
        <svg class="w-full h-full" viewBox="0 0 24 24">
          <!-- Animated sweep arc -->
          <path d="M 12 12 L 12 3 A 9 9 0 0 1 18.364 5.636 Z" fill="currentColor" opacity="0.3" />
        </svg>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  // Props
  interface Props {
    isActive?: boolean
    isLoading?: boolean
    disabled?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isActive: false,
    isLoading: false,
    disabled: false
  })

  // Emits
  const emit = defineEmits<{
    click: []
  }>()

  // Computed properties
  const buttonClasses = computed(() => {
    const baseClasses = [
      'radar-icon-button',
      'p-2',
      'text-slate-400',
      'hover:text-white',
      'hover:bg-slate-700',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:ring-offset-2',
      'focus:ring-offset-slate-800'
    ]

    if (props.isActive) {
      baseClasses.push('active', 'text-blue-400', 'bg-slate-700')
    }

    if (props.isLoading) {
      baseClasses.push('loading', 'cursor-wait')
    }

    if (props.disabled) {
      baseClasses.push('disabled', 'opacity-50', 'cursor-not-allowed')
    }

    return baseClasses
  })

  const ariaLabel = computed(() => {
    if (props.isLoading) {
      return 'Loading radar data...'
    }
    if (props.isActive) {
      return 'Close radar view'
    }
    return 'Open radar view'
  })

  // Event handlers
  const handleClick = () => {
    if (!props.disabled && !props.isLoading) {
      emit('click')
    }
  }

  const handleKeyboard = () => {
    if (!props.disabled && !props.isLoading) {
      emit('click')
    }
  }
</script>

<style scoped>
  @keyframes sweep {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .animate-sweep {
    animation: sweep 2s linear infinite;
    transform-origin: center;
  }

  .radar-icon-button:hover .radar-sweep {
    opacity: 0.5;
  }

  .radar-icon-button.active .radar-sweep {
    opacity: 0.6;
  }
</style>
