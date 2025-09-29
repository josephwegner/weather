import type { GeolocationResult, LocationError, Location } from '../types/weather'
import { geocodingService } from './geocodingService'

class GeolocationService {
  private readonly DEFAULT_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 seconds
    maximumAge: 60000 // 1 minute
  }

  isGeolocationAvailable(): boolean {
    return typeof navigator !== 'undefined' && navigator.geolocation !== undefined
  }

  validateCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates')
    }
  }

  formatCoordinateName(lat: number, lng: number): string {
    const roundedLat = Math.round(lat * 10000) / 10000
    const roundedLng = Math.round(lng * 10000) / 10000
    return `Current Location (${roundedLat}, ${roundedLng})`
  }

  createLocationError(positionError: GeolocationPositionError): LocationError {
    let type: LocationError['type']
    let message: string

    switch (positionError.code) {
      case 1: // PERMISSION_DENIED
        type = 'GEOLOCATION_PERMISSION_DENIED'
        message = 'Permission denied: The user denied the request for geolocation.'
        break
      case 2: // POSITION_UNAVAILABLE
        type = 'GEOLOCATION_UNAVAILABLE'
        message = 'Position unavailable: Location information is not available.'
        break
      case 3: // TIMEOUT
        type = 'GEOLOCATION_TIMEOUT'
        message = 'Timeout: The request to get user location timed out.'
        break
      default:
        type = 'GEOLOCATION_UNAVAILABLE'
        message = 'Unknown geolocation error occurred.'
        break
    }

    return {
      type,
      message,
      originalError: positionError
    }
  }

  private async processPosition(position: GeolocationPosition): Promise<GeolocationResult> {
    const lat = position.coords.latitude
    const lng = position.coords.longitude
    const accuracy = position.coords.accuracy

    this.validateCoordinates(lat, lng)

    let location: Location

    try {
      // Try to reverse geocode the coordinates to get a readable name
      const geocodedLocation = await geocodingService.reverseGeocode(lat, lng)
      location = {
        lat: geocodedLocation.lat,
        lng: geocodedLocation.lng,
        name: geocodedLocation.name
      }
    } catch (error) {
      // If reverse geocoding fails, use coordinate-based name
      location = {
        lat,
        lng,
        name: this.formatCoordinateName(lat, lng)
      }
    }

    return {
      location,
      accuracy
    }
  }

  async getCurrentLocation(options?: PositionOptions): Promise<GeolocationResult> {
    if (!this.isGeolocationAvailable()) {
      const error: LocationError = {
        type: 'GEOLOCATION_UNAVAILABLE',
        message: 'Geolocation is not supported by this browser',
        originalError: null
      }
      throw error
    }

    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options }

    return new Promise<GeolocationResult>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const result = await this.processPosition(position)
            resolve(result)
          } catch (error) {
            const locationError: LocationError = {
              type: 'GEOCODING_FAILED',
              message: `Failed to process location: ${error instanceof Error ? error.message : 'Unknown error'}`,
              originalError: error
            }
            reject(locationError)
          }
        },
        (error) => {
          const locationError = this.createLocationError(error)
          reject(locationError)
        },
        finalOptions
      )
    })
  }

  watchPosition(
    successCallback: (result: GeolocationResult) => void,
    errorCallback: (error: LocationError) => void,
    options?: PositionOptions
  ): number {
    if (!this.isGeolocationAvailable()) {
      throw new Error('Geolocation is not supported by this browser')
    }

    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options }

    return navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const result = await this.processPosition(position)
          successCallback(result)
        } catch (error) {
          const locationError: LocationError = {
            type: 'GEOCODING_FAILED',
            message: `Failed to process location: ${error instanceof Error ? error.message : 'Unknown error'}`,
            originalError: error
          }
          errorCallback(locationError)
        }
      },
      (error) => {
        const locationError = this.createLocationError(error)
        errorCallback(locationError)
      },
      finalOptions
    )
  }

  clearWatch(watchId: number): void {
    if (this.isGeolocationAvailable()) {
      navigator.geolocation.clearWatch(watchId)
    }
  }
}

// Create and export singleton instance
export const geolocationService = new GeolocationService()
