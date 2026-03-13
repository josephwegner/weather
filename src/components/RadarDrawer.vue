<template>
  <Transition name="drawer-slide">
    <div class="radar-drawer" v-if="isOpen">
      <div class="radar-header">
        <span class="radar-title">Radar</span>
        <button class="radar-close" @click="$emit('close')">✕</button>
      </div>
      <div class="radar-content">
        <div v-if="isLoading" class="radar-loading">
          <svg
            class="radar-spinner"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            />
          </svg>
        </div>
        <div
          v-else
          class="radar-image-container"
          @wheel.prevent="onWheel"
          @touchstart="onPinchStart"
          @touchmove="onPinchMove"
          @touchend="onPinchEnd"
        >
          <div class="radar-tile-grid" :style="{ transform: `scale(${zoomLevel})` }">
            <img v-for="(url, i) in currentFrameUrls" :key="i" :src="url" class="radar-tile" />
          </div>
        </div>
      </div>
      <div class="radar-scrubber" v-if="!isLoading">
        <div class="scrubber-track" ref="scrubberTrack" @pointerdown="onScrubStart">
          <div class="scrubber-fill" :style="{ width: scrubberPercent + '%' }"></div>
          <div class="scrubber-thumb" :style="{ left: scrubberPercent + '%' }"></div>
          <div class="scrubber-ticks">
            <div
              v-for="i in frameCount"
              :key="i"
              class="scrubber-tick"
              :class="{ 'scrubber-tick--now': i - 1 === 8 }"
            ></div>
          </div>
        </div>
        <div class="scrubber-label">{{ currentTimeLabel }}</div>
      </div>
      <div class="radar-elements" v-if="!isLoading">
        <button
          v-for="opt in elementOptions"
          :key="opt.key"
          :class="{ selected: selectedElement === opt.key }"
          @click="changeElement(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import type { Location } from '../types/weather'
  import type { RadarElement, RadarElementOption } from '../types/radar'
  import { generateTimeSteps, buildTileGrid, preloadImages } from '../services/radarService'

  const props = defineProps<{
    isOpen: boolean
    location: Location
  }>()

  defineEmits<{
    (e: 'close'): void
  }>()

  const elementOptions: RadarElementOption[] = [
    { key: 'precipcomposite', label: 'PRECIP' },
    { key: 'temp', label: 'TEMP' },
    { key: 'wind', label: 'WIND' },
    { key: 'windspeed', label: 'SPEED' },
    { key: 'alerts', label: 'ALERTS' }
  ]

  const ZOOM = 6
  const currentFrameIndex = ref(8)
  const selectedElement = ref<RadarElement>('precipcomposite')
  const zoomLevel = ref(1)
  const isLoading = ref(true)
  const frameGridUrls = ref<string[][]>([])
  const pinchStartDist = ref(0)
  const pinchStartZoom = ref(1)
  const scrubberTrack = ref<HTMLElement | null>(null)
  const isScrubbing = ref(false)

  const frameCount = computed(() => frameGridUrls.value.length || 17)

  const currentFrameUrls = computed(() => frameGridUrls.value[currentFrameIndex.value] || [])

  const scrubberPercent = computed(() => (currentFrameIndex.value / (frameCount.value - 1)) * 100)

  const currentTimeLabel = computed(() => {
    const centerIndex = 8
    const diff = currentFrameIndex.value - centerIndex
    if (diff === 0) return 'Now'

    const totalMinutes = Math.abs(diff) * 15
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    let label = ''
    if (hours > 0 && minutes > 0) label = `${hours}h ${minutes}m`
    else if (hours > 0) label = `${hours}h`
    else label = `${minutes}m`

    return diff < 0 ? `${label} ago` : `+${label}`
  })

  function updateScrubFromPointer(clientX: number) {
    if (!scrubberTrack.value) return
    const rect = scrubberTrack.value.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    currentFrameIndex.value = Math.round(pct * (frameCount.value - 1))
  }

  function onScrubStart(e: PointerEvent) {
    isScrubbing.value = true
    updateScrubFromPointer(e.clientX)
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => updateScrubFromPointer(ev.clientX)
    const onUp = () => {
      isScrubbing.value = false
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }

  async function loadFrames() {
    isLoading.value = true
    currentFrameIndex.value = 8

    const steps = generateTimeSteps(new Date())
    const grids = steps.map((time) =>
      buildTileGrid(selectedElement.value, ZOOM, props.location.lat, props.location.lng, time)
    )

    const allUrls = grids.flat()
    try {
      await preloadImages(allUrls)
    } catch {
      // show whatever loaded
    }

    frameGridUrls.value = grids
    isLoading.value = false
  }

  function changeElement(element: RadarElement) {
    if (element !== selectedElement.value) {
      selectedElement.value = element
    }
  }

  function onWheel(e: WheelEvent) {
    const delta = e.deltaY > 0 ? -0.25 : 0.25
    zoomLevel.value = Math.min(4, Math.max(1, zoomLevel.value + delta))
  }

  function onPinchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchStartDist.value = Math.hypot(dx, dy)
      pinchStartZoom.value = zoomLevel.value
    }
  }

  function onPinchMove(e: TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist.value > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const scale = dist / pinchStartDist.value
      zoomLevel.value = Math.min(4, Math.max(1, pinchStartZoom.value * scale))
    }
  }

  function onPinchEnd() {
    pinchStartDist.value = 0
  }

  watch(
    () => props.isOpen,
    (open) => {
      if (open) loadFrames()
    },
    { immediate: true }
  )

  watch(selectedElement, () => {
    if (props.isOpen) loadFrames()
  })
</script>

<style scoped>
  .drawer-slide-enter-active,
  .drawer-slide-leave-active {
    transition: all 0.2s ease-out;
  }

  .drawer-slide-enter-from,
  .drawer-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  .radar-drawer {
    background: rgb(8, 12, 24);
    box-shadow:
      inset 0 -8px 16px -4px rgba(0, 0, 0, 0.5),
      inset 0 2px 8px -2px rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgb(30, 41, 59);
  }

  .radar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  }

  .radar-title {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(148, 163, 184);
  }

  .radar-close {
    background: none;
    border: none;
    color: rgb(100, 116, 139);
    font-size: 1.125rem;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }

  .radar-content {
    position: relative;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 4px 12px -2px rgba(0, 0, 0, 0.4);
  }

  .radar-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
  }

  .radar-spinner {
    color: rgb(100, 116, 139);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .radar-image-container {
    width: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .radar-tile-grid {
    display: grid;
    grid-template-columns: repeat(3, 256px);
    grid-template-rows: repeat(3, 256px);
    transition: transform 0.1s ease;
    transform-origin: center center;
  }

  .radar-tile {
    width: 256px;
    height: 256px;
    display: block;
  }

  .radar-scrubber {
    padding: 14px 16px 6px;
  }

  .scrubber-track {
    position: relative;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    touch-action: none;
  }

  .scrubber-fill {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 3px;
    background: #4a90e2;
    border-radius: 2px;
    pointer-events: none;
  }

  .scrubber-ticks {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 3px;
    background: rgb(30, 41, 59);
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
  }

  .scrubber-tick {
    width: 1px;
    height: 8px;
    background: rgb(51, 65, 85);
    flex-shrink: 0;
  }

  .scrubber-tick--now {
    width: 2px;
    height: 14px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 1px;
  }

  .scrubber-thumb {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 16px;
    background: #4a90e2;
    border: 2px solid rgb(8, 12, 24);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow: 0 0 6px rgba(74, 144, 226, 0.4);
    z-index: 1;
  }

  .scrubber-label {
    text-align: center;
    font-size: 0.6875rem;
    color: rgb(100, 116, 139);
    padding: 4px 0 0;
    font-variant-numeric: tabular-nums;
  }

  .radar-elements {
    display: flex;
    gap: 8px;
    padding: 8px 16px 14px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .radar-elements::-webkit-scrollbar {
    display: none;
  }

  .radar-elements button {
    background: rgb(30, 41, 59);
    color: rgb(100, 116, 139);
    border: 1px solid rgb(51, 65, 85);
    border-radius: 20px;
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    transition: all 0.15s ease;
  }

  .radar-elements button:hover {
    background: rgb(51, 65, 85);
    color: rgb(203, 213, 225);
  }

  .radar-elements button.selected {
    background: #4a90e2;
    color: white;
    border-color: #4a90e2;
  }
</style>
