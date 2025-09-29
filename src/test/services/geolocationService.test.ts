import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import type { GeolocationResult, LocationError } from '../../types/weather'
import { TEST_LOCATIONS } from '../constants'
import { geolocationService } from '../../services/geolocationService'

// Mock the geocoding service
vi.mock('../../services/geocodingService', () => ({
  geocodingService: {
    reverseGeocode: vi.fn()
  }
}))

import { geocodingService } from '../../services/geocodingService'
const mockReverseGeocode = geocodingService.reverseGeocode as MockedFunction<
  typeof geocodingService.reverseGeocode
>

describe('Geolocation Service', () => {
  // Mock geolocation API
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockReverseGeocode.mockReset()

    // Mock navigator.geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    })

    // Reset mock implementations
    mockGeolocation.getCurrentPosition.mockReset()
    mockGeolocation.watchPosition.mockReset()
    mockGeolocation.clearWatch.mockReset()
  })

  describe('Geolocation Availability', () => {
    it('detects when geolocation is available', () => {
      const isAvailable = geolocationService.isGeolocationAvailable()
      expect(isAvailable).toBe(true)
    })

    it('detects when geolocation is not available', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      })

      const isAvailable = geolocationService.isGeolocationAvailable()
      expect(isAvailable).toBe(false)
    })

    it('handles missing navigator object', () => {
      const originalNavigator = global.navigator
      // @ts-ignore
      delete global.navigator

      const isAvailable = geolocationService.isGeolocationAvailable()
      expect(isAvailable).toBe(false)

      // Restore navigator
      global.navigator = originalNavigator
    })
  })

  describe('Get Current Position', () => {
    it('successfully gets current position and reverse geocodes', async () => {
      const mockPosition = {
        coords: {
          latitude: 41.8781,
          longitude: -87.6298,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      mockReverseGeocode.mockResolvedValue({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        country: 'United States',
        state: 'Illinois',
        city: 'Chicago',
        type: 'city'
      })

      const result = await geolocationService.getCurrentLocation()

      expect(result).toEqual({
        location: {
          lat: 41.8781,
          lng: -87.6298,
          name: 'Chicago, IL'
        },
        accuracy: 10
      })

      expect(mockReverseGeocode).toHaveBeenCalledWith(41.8781, -87.6298)
    })

    it('uses custom options for geolocation', async () => {
      const mockPosition = {
        coords: {
          latitude: 41.8781,
          longitude: -87.6298,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      mockReverseGeocode.mockResolvedValue({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        type: 'city'
      })

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }

      await geolocationService.getCurrentLocation(options)

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        options
      )
    })

    it('handles geolocation permission denied', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied the request for Geolocation.'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(geolocationService.getCurrentLocation()).rejects.toMatchObject({
        type: 'GEOLOCATION_PERMISSION_DENIED',
        message: expect.stringContaining('Permission denied')
      })
    })

    it('handles geolocation position unavailable', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable.'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(geolocationService.getCurrentLocation()).rejects.toMatchObject({
        type: 'GEOLOCATION_UNAVAILABLE',
        message: expect.stringContaining('Position unavailable')
      })
    })

    it('handles geolocation timeout', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout expired.'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(geolocationService.getCurrentLocation()).rejects.toMatchObject({
        type: 'GEOLOCATION_TIMEOUT',
        message: expect.stringContaining('Timeout')
      })
    })

    it('handles reverse geocoding failure gracefully', async () => {
      const mockPosition = {
        coords: {
          latitude: 41.8781,
          longitude: -87.6298,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      mockReverseGeocode.mockRejectedValue(new Error('Geocoding failed'))

      const result = await geolocationService.getCurrentLocation()

      // Should still return coordinates even if reverse geocoding fails
      expect(result).toEqual({
        location: {
          lat: 41.8781,
          lng: -87.6298,
          name: 'Current Location (41.8781, -87.6298)'
        },
        accuracy: 10
      })
    })

    it('throws error when geolocation is not available', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      })

      await expect(geolocationService.getCurrentLocation()).rejects.toMatchObject({
        type: 'GEOLOCATION_UNAVAILABLE',
        message: 'Geolocation is not supported by this browser'
      })
    })
  })

  describe('Position Watching', () => {
    it('starts watching position and returns watch ID', () => {
      const mockCallback = vi.fn()
      const mockErrorCallback = vi.fn()

      mockGeolocation.watchPosition.mockReturnValue(123)

      const watchId = geolocationService.watchPosition(mockCallback, mockErrorCallback)

      expect(watchId).toBe(123)
      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('calls callback with processed location data', async () => {
      let storedSuccessCallback: ((position: GeolocationPosition) => void) | null = null

      mockGeolocation.watchPosition.mockImplementation((success) => {
        storedSuccessCallback = success
        return 123
      })

      mockReverseGeocode.mockResolvedValue({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        type: 'city'
      })

      const mockCallback = vi.fn()
      const mockErrorCallback = vi.fn()

      geolocationService.watchPosition(mockCallback, mockErrorCallback)

      // Simulate position update
      const mockPosition = {
        coords: {
          latitude: 41.8781,
          longitude: -87.6298,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      }

      storedSuccessCallback!(mockPosition)

      // Give time for async reverse geocoding
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockCallback).toHaveBeenCalledWith({
        location: {
          lat: 41.8781,
          lng: -87.6298,
          name: 'Chicago, IL'
        },
        accuracy: 10
      })
    })

    it('calls error callback on geolocation error', () => {
      let storedErrorCallback: ((error: GeolocationPositionError) => void) | null = null

      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        storedErrorCallback = error
        return 123
      })

      const mockCallback = vi.fn()
      const mockErrorCallback = vi.fn()

      geolocationService.watchPosition(mockCallback, mockErrorCallback)

      const mockError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError

      storedErrorCallback!(mockError)

      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GEOLOCATION_PERMISSION_DENIED',
          message: expect.stringContaining('Permission denied')
        })
      )
    })

    it('clears position watch', () => {
      const watchId = 123

      geolocationService.clearWatch(watchId)

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId)
    })

    it('throws error when trying to watch position without geolocation support', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      })

      const mockCallback = vi.fn()
      const mockErrorCallback = vi.fn()

      expect(() => {
        geolocationService.watchPosition(mockCallback, mockErrorCallback)
      }).toThrow('Geolocation is not supported by this browser')
    })
  })

  describe('Error Handling and Utilities', () => {
    it('creates appropriate error objects for different geolocation error codes', () => {
      const permissionError = geolocationService.createLocationError({
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError)

      expect(permissionError).toMatchObject({
        type: 'GEOLOCATION_PERMISSION_DENIED',
        message: expect.stringContaining('Permission denied'),
        originalError: expect.any(Object)
      })

      const unavailableError = geolocationService.createLocationError({
        code: 2,
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError)

      expect(unavailableError.type).toBe('GEOLOCATION_UNAVAILABLE')

      const timeoutError = geolocationService.createLocationError({
        code: 3,
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError)

      expect(timeoutError.type).toBe('GEOLOCATION_TIMEOUT')
    })

    it('formats coordinate fallback names correctly', () => {
      const name = geolocationService.formatCoordinateName(41.8781, -87.6298)
      expect(name).toBe('Current Location (41.8781, -87.6298)')

      const highPrecisionName = geolocationService.formatCoordinateName(41.87814123, -87.62981456)
      expect(highPrecisionName).toBe('Current Location (41.8781, -87.6298)')
    })

    it('validates coordinate precision and bounds', () => {
      expect(() => {
        geolocationService.validateCoordinates(91, 0)
      }).toThrow('Invalid coordinates')

      expect(() => {
        geolocationService.validateCoordinates(-91, 0)
      }).toThrow('Invalid coordinates')

      expect(() => {
        geolocationService.validateCoordinates(0, 181)
      }).toThrow('Invalid coordinates')

      expect(() => {
        geolocationService.validateCoordinates(0, -181)
      }).toThrow('Invalid coordinates')

      // Valid coordinates should not throw
      expect(() => {
        geolocationService.validateCoordinates(41.8781, -87.6298)
      }).not.toThrow()
    })
  })

  describe('Configuration and Options', () => {
    it('uses default geolocation options when none provided', async () => {
      const mockPosition = {
        coords: {
          latitude: 41.8781,
          longitude: -87.6298,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      mockReverseGeocode.mockResolvedValue({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        type: 'city'
      })

      await geolocationService.getCurrentLocation()

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })

    it('allows overriding default options', async () => {
      const mockPosition = {
        coords: {
          latitude: 41.8781,
          longitude: -87.6298,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      mockReverseGeocode.mockResolvedValue({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        type: 'city'
      })

      const customOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      }

      await geolocationService.getCurrentLocation(customOptions)

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        customOptions
      )
    })
  })
})
