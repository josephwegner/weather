import axios from 'axios'
import type { Location } from '../types/weather'
import type { RadarLayerType, RadarFrame, RadarTileInfo, WeatherMapsLayer } from '../types/radar'
import { cacheService } from './cache'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Weather Maps 2.0 layer mappings
const WEATHER_MAPS_LAYERS: Record<RadarLayerType, WeatherMapsLayer> = {
  precipitation_intensity: {
    code: 'PR0',
    name: 'Precipitation Intensity',
    units: 'mm/s',
    type: 'precipitation_intensity'
  },
  accumulated_rain: {
    code: 'PARAIN',
    name: 'Accumulated Rain',
    units: 'mm',
    type: 'accumulated_rain'
  },
  accumulated_snow: {
    code: 'PASNOW',
    name: 'Accumulated Snow',
    units: 'mm',
    type: 'accumulated_snow'
  },
  wind_speed: {
    code: 'WNDUV',
    name: 'Wind Speed',
    units: 'm/s',
    type: 'wind_speed'
  },
  pressure: {
    code: 'PA0',
    name: 'Pressure',
    units: 'hPa',
    type: 'pressure'
  },
  temperature: {
    code: 'TA2',
    name: 'Air Temperature',
    units: '°C',
    type: 'temperature'
  },
  humidity: {
    code: 'HRD0',
    name: 'Humidity',
    units: '%',
    type: 'humidity'
  },
  cloudiness: {
    code: 'CL',
    name: 'Cloudiness',
    units: '%',
    type: 'cloudiness'
  }
}

export interface RadarServiceConfig {
  cacheEnabled: boolean
  mockAPIRequests: boolean
  enableLogging?: boolean
  mockScenarioId?: string
  apiKey?: string
  baseUrl?: string
}

export class RadarService {
  private config: RadarServiceConfig

  constructor() {
    this.config = this.getDefaultConfig()
    if (import.meta.env.DEV) {
      this.exposeDevMethods()
    }
  }

  private getDefaultConfig(): RadarServiceConfig {
    const isProduction = import.meta.env.PROD
    const useRealAPI = import.meta.env.VITE_USE_REAL_API === 'true'
    const disableCache = import.meta.env.VITE_DISABLE_CACHE === 'true'
    const mockScenario = import.meta.env.VITE_MOCK_SCENARIO || 'normal-chicago'

    return {
      cacheEnabled: !disableCache,
      mockAPIRequests: !isProduction && !useRealAPI,
      enableLogging: !isProduction,
      mockScenarioId: mockScenario,
      apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
      baseUrl: 'https://maps.openweathermap.org/maps/2.0/weather'
    }
  }

  private exposeDevMethods(): void {
    if (typeof window !== 'undefined') {
      ;(window as any).radarApi = {
        useRealAPI: () => this.setConfig({ mockAPIRequests: false }),
        useMockAPI: () => this.setConfig({ mockAPIRequests: true }),
        toggleCache: () => this.setConfig({ cacheEnabled: !this.config.cacheEnabled }),
        clearCache: () => this.clearCache(),
        setMockScenario: (id: string) => this.setConfig({ mockScenarioId: id }),
        getCurrentConfig: () => ({ ...this.config })
      }
    }
  }

  setConfig(config: Partial<RadarServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getCurrentConfig(): RadarServiceConfig {
    return { ...this.config }
  }

  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[RadarService]', ...args)
    }
  }

  generateTileUrl(tileInfo: RadarTileInfo): string {
    const { layerType, z, x, y, timestamp } = tileInfo
    const layerConfig = WEATHER_MAPS_LAYERS[layerType]

    if (!layerConfig) {
      throw new Error(`Unsupported layer type: ${layerType}`)
    }

    const baseUrl = this.config.baseUrl || 'https://maps.openweathermap.org/maps/2.0/weather'
    const apiKey = this.config.apiKey || 'test-api-key' // Default for tests

    // Weather Maps 2.0 URL structure: /maps/2.0/weather/{layer}/{timestamp}/{z}/{x}/{y}?appid={API key}
    return `${baseUrl}/${layerConfig.code}/${timestamp}/${z}/${x}/${y}?appid=${apiKey}`
  }

  /**
   * Get available layer types with their display information
   */
  getAvailableLayers(): WeatherMapsLayer[] {
    return Object.values(WEATHER_MAPS_LAYERS)
  }

  /**
   * Get display information for a specific layer type
   */
  getLayerInfo(layerType: RadarLayerType): WeatherMapsLayer | undefined {
    return WEATHER_MAPS_LAYERS[layerType]
  }

  async getRadarFrames(
    location: Location,
    layerType: RadarLayerType // Weather Maps 2.0 only supports single layer at a time
  ): Promise<RadarFrame[]> {
    this.log('getRadarFrames called', { location, layerType, config: this.config })

    // Validate layer type
    if (!WEATHER_MAPS_LAYERS[layerType]) {
      throw new Error(`Invalid layer type: ${layerType}`)
    }

    // Check cache first
    if (this.config.cacheEnabled) {
      const cacheKey = `radar_${location.lat}_${location.lng}_${layerType}`
      const cached = this.getCachedFrames(cacheKey)
      if (cached) {
        this.log('Returning cached radar frames')
        return cached
      }
    }

    if (this.config.mockAPIRequests) {
      return this.getMockRadarFrames(layerType)
    } else {
      return this.getRealRadarFrames(location, layerType)
    }
  }

  private getCachedFrames(cacheKey: string): RadarFrame[] | null {
    // For now, return null since we don't have radar caching implemented
    // This would integrate with the existing cache service
    return null
  }

  private setCachedFrames(cacheKey: string, frames: RadarFrame[]): void {
    // Implementation would cache the frames
    // This would integrate with the existing cache service
  }

  private getMockRadarFrames(layerType: RadarLayerType): RadarFrame[] {
    const now = Math.floor(Date.now() / 1000)
    const frames: RadarFrame[] = []
    const layerConfig = WEATHER_MAPS_LAYERS[layerType]

    this.log('Generating mock radar frames', {
      layerType,
      layerConfig,
      apiKey: this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'NOT SET',
      mockMode: this.config.mockAPIRequests
    })

    // Generate 12 frames total in 15-minute intervals:
    // - 4 frames for past hour: -60m, -45m, -30m, -15m
    // - 8 frames for next 2 hours: +0m, +15m, +30m, +45m, +60m, +75m, +90m, +105m

    // Past hour (4 frames: -60m, -45m, -30m, -15m)
    for (let i = 3; i >= 0; i--) {
      const timestamp = now - (i + 1) * 15 * 60 // 15 minutes ago
      const layers: Partial<Record<RadarLayerType, string>> = {}

      layers[layerType] =
        `https://maps.openweathermap.org/maps/2.0/weather/${layerConfig.code}/${timestamp}/{z}/{x}/{y}?appid=${this.config.apiKey}`

      frames.push({
        timestamp,
        layers,
        isPrediction: false
      })
    }

    // Future 2 hours (8 frames: 0m, +15m, +30m, ..., +105m)
    for (let i = 0; i < 8; i++) {
      const timestamp = now + i * 15 * 60 // Starting from now, then 15 minutes intervals
      const layers: Partial<Record<RadarLayerType, string>> = {}

      layers[layerType] =
        `https://maps.openweathermap.org/maps/2.0/weather/${layerConfig.code}/${timestamp}/{z}/{x}/{y}?appid=${this.config.apiKey}`

      frames.push({
        timestamp,
        layers,
        isPrediction: true
      })
    }

    return frames
  }

  private async getRealRadarFrames(
    location: Location,
    layerType: RadarLayerType
  ): Promise<RadarFrame[]> {
    try {
      this.log('Making API call for radar frames')

      // Call server-side radar endpoint with new Weather Maps 2.0 parameters
      const response = await axios.get(
        `${API_BASE_URL}/weather/radar/${location.lat}/${location.lng}`,
        {
          params: {
            layer: layerType,
            past_hours: 1, // Past 1 hour
            future_hours: 2, // Future 2 hours
            interval: 15 // 15-minute intervals
          }
        }
      )

      const frames: RadarFrame[] = response.data.frames.map((frameData: any) => ({
        timestamp: frameData.timestamp,
        layers: frameData.layers,
        isPrediction: frameData.isPrediction || false
      }))

      // Cache the result
      if (this.config.cacheEnabled) {
        const cacheKey = `radar_${location.lat}_${location.lng}_${layerType}`
        this.setCachedFrames(cacheKey, frames)
        this.log('Radar frames cached')
      }

      return frames
    } catch (error) {
      this.log('Error fetching radar frames:', error)
      throw error
    }
  }

  clearCache(): void {
    // Implementation would clear radar-specific cache entries
    this.log('Radar cache cleared')
  }
}

// Create and export a singleton instance
export const radarService = new RadarService()
