/**
 * Radar layer types supported by OpenWeatherMap Weather Maps 2.0
 */
export type RadarLayerType =
  | 'precipitation_intensity' // PR0 - Precipitation Intensity (mm/s)
  | 'accumulated_rain' // PARAIN - Accumulated Rain (mm)
  | 'accumulated_snow' // PASNOW - Accumulated Snow (mm)
  | 'wind_speed' // WNDUV - Wind Speed
  | 'pressure' // Pressure
  | 'temperature' // Air temperature
  | 'humidity' // Humidity
  | 'cloudiness' // Cloudiness

/**
 * Configuration for a radar layer
 */
export interface RadarLayer {
  type: RadarLayerType
  name: string
  opacity: number
  visible: boolean
  zIndex: number
}

/**
 * Information about a radar tile
 */
export interface RadarTileInfo {
  layerType: RadarLayerType
  timestamp: number
  z: number
  x: number
  y: number
  url: string
}

/**
 * Radar service configuration
 */
export interface RadarConfig {
  apiKey: string
  baseUrl: string
  defaultLayers?: RadarLayerType[]
  animationSteps?: number
  animationSpeed?: number
  maxZoom?: number
  minZoom?: number
}

/**
 * Radar animation frame data for Weather Maps 2.0
 */
export interface RadarFrame {
  timestamp: number
  layers: Partial<Record<RadarLayerType, string>> // layer type -> tile URL pattern
  isPrediction?: boolean // true if this is a forecast frame (future)
}

/**
 * Weather Maps 2.0 API layer mapping
 */
export interface WeatherMapsLayer {
  code: string // API layer code (e.g., 'PR0', 'PARAIN')
  name: string // Display name
  units: string // Units for display
  type: RadarLayerType
}

/**
 * Radar animation sequence
 */
export interface RadarAnimation {
  frames: RadarFrame[]
  currentFrameIndex: number
  isPlaying: boolean
  speed: number
}

/**
 * Radar service state
 */
export interface RadarState {
  isLoading: boolean
  error: string | null
  layers: RadarLayer[]
  animation: RadarAnimation | null
  drawerVisible: boolean
}
