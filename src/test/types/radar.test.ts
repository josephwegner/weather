import { describe, it, expect } from 'vitest'
import type { RadarLayerType, RadarFrame, RadarTileInfo, WeatherMapsLayer } from '../../types/radar'

describe('Radar Types - Weather Maps 2.0', () => {
  describe('RadarLayerType', () => {
    it('should include all Weather Maps 2.0 layer types', () => {
      const validLayers: RadarLayerType[] = [
        'precipitation_intensity',
        'accumulated_rain',
        'accumulated_snow',
        'wind_speed',
        'pressure',
        'temperature',
        'humidity',
        'cloudiness'
      ]

      // This test verifies that all expected layer types compile correctly
      expect(validLayers).toHaveLength(8)
      expect(validLayers).toContain('precipitation_intensity')
      expect(validLayers).toContain('accumulated_rain')
      expect(validLayers).toContain('accumulated_snow')
      expect(validLayers).toContain('wind_speed')
      expect(validLayers).toContain('pressure')
      expect(validLayers).toContain('temperature')
      expect(validLayers).toContain('humidity')
      expect(validLayers).toContain('cloudiness')
    })

    it('should have proper type constraints', () => {
      // These should compile correctly
      const layer1: RadarLayerType = 'precipitation_intensity'
      const layer2: RadarLayerType = 'temperature'

      expect(layer1).toBe('precipitation_intensity')
      expect(layer2).toBe('temperature')
    })
  })

  describe('WeatherMapsLayer interface', () => {
    it('should define layer configuration correctly', () => {
      const precipLayer: WeatherMapsLayer = {
        code: 'PR0',
        name: 'Precipitation Intensity',
        units: 'mm/s',
        type: 'precipitation_intensity'
      }

      expect(precipLayer.code).toBe('PR0')
      expect(precipLayer.name).toBe('Precipitation Intensity')
      expect(precipLayer.units).toBe('mm/s')
      expect(precipLayer.type).toBe('precipitation_intensity')
    })

    it('should support all Weather Maps 2.0 layers', () => {
      const layers: WeatherMapsLayer[] = [
        {
          code: 'PR0',
          name: 'Precipitation Intensity',
          units: 'mm/s',
          type: 'precipitation_intensity'
        },
        {
          code: 'PARAIN',
          name: 'Accumulated Rain',
          units: 'mm',
          type: 'accumulated_rain'
        },
        {
          code: 'PASNOW',
          name: 'Accumulated Snow',
          units: 'mm',
          type: 'accumulated_snow'
        },
        {
          code: 'WNDUV',
          name: 'Wind Speed',
          units: 'm/s',
          type: 'wind_speed'
        },
        {
          code: 'PA0',
          name: 'Pressure',
          units: 'hPa',
          type: 'pressure'
        },
        {
          code: 'TA2',
          name: 'Air Temperature',
          units: '°C',
          type: 'temperature'
        },
        {
          code: 'HRD0',
          name: 'Humidity',
          units: '%',
          type: 'humidity'
        },
        {
          code: 'CL',
          name: 'Cloudiness',
          units: '%',
          type: 'cloudiness'
        }
      ]

      expect(layers).toHaveLength(8)
      expect(layers.every((layer) => typeof layer.code === 'string')).toBe(true)
      expect(layers.every((layer) => typeof layer.name === 'string')).toBe(true)
      expect(layers.every((layer) => typeof layer.units === 'string')).toBe(true)
    })
  })

  describe('RadarFrame interface', () => {
    it('should support Weather Maps 2.0 frame structure', () => {
      const frame: RadarFrame = {
        timestamp: 1640995200,
        layers: {
          precipitation_intensity:
            'https://maps.openweathermap.org/maps/2.0/weather/PR0/1640995200/5/10/15'
        },
        isPrediction: false
      }

      expect(frame.timestamp).toBe(1640995200)
      expect(frame.layers.precipitation_intensity).toBeDefined()
      expect(frame.isPrediction).toBe(false)
    })

    it('should support prediction frames', () => {
      const futureFrame: RadarFrame = {
        timestamp: 1640999000,
        layers: {
          temperature: 'https://maps.openweathermap.org/maps/2.0/weather/TA2/1640999000/5/10/15'
        },
        isPrediction: true
      }

      expect(futureFrame.isPrediction).toBe(true)
      expect(futureFrame.layers.temperature).toBeDefined()
    })

    it('should support single layer per frame (Weather Maps 2.0 requirement)', () => {
      const singleLayerFrame: RadarFrame = {
        timestamp: 1640995200,
        layers: {
          accumulated_rain: 'url-for-rain'
        }
      }

      expect(Object.keys(singleLayerFrame.layers)).toHaveLength(1)
      expect(singleLayerFrame.layers.accumulated_rain).toBe('url-for-rain')
    })

    it('should allow optional isPrediction field', () => {
      const frameWithoutPrediction: RadarFrame = {
        timestamp: 1640995200,
        layers: {
          pressure: 'pressure-url'
        }
        // isPrediction is optional
      }

      expect(frameWithoutPrediction.isPrediction).toBeUndefined()
      expect(frameWithoutPrediction.layers.pressure).toBe('pressure-url')
    })
  })

  describe('RadarTileInfo interface', () => {
    it('should support Weather Maps 2.0 tile structure', () => {
      const tileInfo: RadarTileInfo = {
        layerType: 'precipitation_intensity',
        timestamp: 1640995200,
        z: 5,
        x: 10,
        y: 15,
        url: 'https://maps.openweathermap.org/maps/2.0/weather/PR0/1640995200/5/10/15'
      }

      expect(tileInfo.layerType).toBe('precipitation_intensity')
      expect(tileInfo.timestamp).toBe(1640995200)
      expect(tileInfo.z).toBe(5)
      expect(tileInfo.x).toBe(10)
      expect(tileInfo.y).toBe(15)
      expect(tileInfo.url).toContain('PR0')
      expect(tileInfo.url).toContain('1640995200')
    })

    it('should work with all layer types', () => {
      const layerTypes: RadarLayerType[] = [
        'precipitation_intensity',
        'accumulated_rain',
        'accumulated_snow',
        'wind_speed',
        'pressure',
        'temperature',
        'humidity',
        'cloudiness'
      ]

      layerTypes.forEach((layerType) => {
        const tileInfo: RadarTileInfo = {
          layerType,
          timestamp: 1640995200,
          z: 5,
          x: 10,
          y: 15,
          url: `https://example.com/${layerType}`
        }

        expect(tileInfo.layerType).toBe(layerType)
        expect(typeof tileInfo.timestamp).toBe('number')
      })
    })
  })

  describe('Type compatibility', () => {
    it('should maintain backward compatibility for existing interfaces', () => {
      // Test that RadarFrame layers can be partially filled
      const partialFrame: RadarFrame = {
        timestamp: Date.now(),
        layers: {
          // Only one layer is required
          temperature: 'temp-url'
        }
      }

      expect(partialFrame.layers).toBeDefined()
      expect(partialFrame.timestamp).toBeDefined()
    })

    it('should support empty layers object', () => {
      const emptyFrame: RadarFrame = {
        timestamp: Date.now(),
        layers: {} // Empty layers object should be valid
      }

      expect(emptyFrame.layers).toEqual({})
    })

    it('should enforce correct layer type constraints', () => {
      // This should compile - using valid layer type
      const validLayers: Partial<Record<RadarLayerType, string>> = {
        precipitation_intensity: 'valid-url'
      }

      expect(validLayers.precipitation_intensity).toBe('valid-url')
    })
  })
})
