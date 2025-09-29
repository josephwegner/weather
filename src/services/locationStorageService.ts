import type { Location, RecentLocation } from '../types/weather'

interface LocationBackupData {
  currentLocation: Location | null
  recentLocations: RecentLocation[]
  exportedAt: number
}

class LocationStorageService {
  private readonly CURRENT_LOCATION_KEY = 'weather-app-current-location'
  private readonly RECENT_LOCATIONS_KEY = 'weather-app-recent-locations'
  private readonly MAX_RECENT_LOCATIONS = 5
  private readonly LOCATION_TOLERANCE = 0.001 // ~100 meters

  private isStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined
    } catch (e) {
      return false
    }
  }

  private validateLocation(location: Location): void {
    if (
      !location ||
      typeof location.lat !== 'number' ||
      typeof location.lng !== 'number' ||
      !location.name ||
      isNaN(location.lat) ||
      isNaN(location.lng) ||
      location.lat < -90 ||
      location.lat > 90 ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      throw new Error('Invalid location data')
    }
  }

  private safeLocalStorageGet(key: string): string | null {
    if (!this.isStorageAvailable()) return null

    try {
      return localStorage.getItem(key)
    } catch (e) {
      console.warn(`Failed to read from localStorage: ${e}`)
      return null
    }
  }

  private safeLocalStorageSet(key: string, value: string): void {
    if (!this.isStorageAvailable()) return

    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.warn(`Failed to write to localStorage: ${e}`)
    }
  }

  private safeLocalStorageRemove(key: string): void {
    if (!this.isStorageAvailable()) return

    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`Failed to remove from localStorage: ${e}`)
    }
  }

  getCurrentLocation(): Location | null {
    const data = this.safeLocalStorageGet(this.CURRENT_LOCATION_KEY)
    if (!data) return null

    try {
      const location = JSON.parse(data)
      this.validateLocation(location)
      return location
    } catch (e) {
      console.warn('Failed to parse current location from localStorage:', e)
      return null
    }
  }

  setCurrentLocation(location: Location): void {
    this.validateLocation(location)
    this.safeLocalStorageSet(this.CURRENT_LOCATION_KEY, JSON.stringify(location))
  }

  getRecentLocations(): RecentLocation[] {
    const data = this.safeLocalStorageGet(this.RECENT_LOCATIONS_KEY)
    if (!data) return []

    try {
      const locations = JSON.parse(data)
      if (!Array.isArray(locations)) return []

      // Validate each location and filter out invalid ones
      return locations
        .filter((loc: any) => {
          try {
            this.validateLocation(loc)
            return typeof loc.lastUsed === 'number' && typeof loc.usageCount === 'number'
          } catch {
            return false
          }
        })
        .sort((a: RecentLocation, b: RecentLocation) => b.lastUsed - a.lastUsed)
    } catch (e) {
      console.warn('Failed to parse recent locations from localStorage:', e)
      return []
    }
  }

  addRecentLocation(location: Location): void {
    this.validateLocation(location)

    const recentLocations = this.getRecentLocations()
    const now = Date.now()

    // Check if location already exists
    const existingIndex = recentLocations.findIndex((recent) =>
      this.areLocationsSame(location, recent)
    )

    if (existingIndex >= 0) {
      // Update existing location
      recentLocations[existingIndex] = {
        ...recentLocations[existingIndex],
        name: location.name, // Update name in case it's different
        lastUsed: now,
        usageCount: recentLocations[existingIndex].usageCount + 1
      }
    } else {
      // Add new location
      const newRecentLocation: RecentLocation = {
        ...location,
        lastUsed: now,
        usageCount: 1
      }
      recentLocations.unshift(newRecentLocation)
    }

    // Sort by last used (most recent first)
    recentLocations.sort((a, b) => b.lastUsed - a.lastUsed)

    // Maintain maximum number of locations
    const trimmedLocations = recentLocations.slice(0, this.MAX_RECENT_LOCATIONS)

    this.safeLocalStorageSet(this.RECENT_LOCATIONS_KEY, JSON.stringify(trimmedLocations))
  }

  areLocationsSame(location1: Location, location2: Location): boolean {
    const latDiff = Math.abs(location1.lat - location2.lat)
    const lngDiff = Math.abs(location1.lng - location2.lng)

    return latDiff <= this.LOCATION_TOLERANCE && lngDiff <= this.LOCATION_TOLERANCE
  }

  clearAllData(): void {
    this.safeLocalStorageRemove(this.CURRENT_LOCATION_KEY)
    this.safeLocalStorageRemove(this.RECENT_LOCATIONS_KEY)
  }

  exportData(): LocationBackupData {
    return {
      currentLocation: this.getCurrentLocation(),
      recentLocations: this.getRecentLocations(),
      exportedAt: Date.now()
    }
  }

  importData(backupData: LocationBackupData): void {
    if (backupData.currentLocation) {
      try {
        this.setCurrentLocation(backupData.currentLocation)
      } catch (e) {
        console.warn('Failed to import current location:', e)
      }
    }

    if (Array.isArray(backupData.recentLocations)) {
      try {
        // Validate and filter recent locations
        const validRecentLocations = backupData.recentLocations.filter((loc) => {
          try {
            this.validateLocation(loc)
            return typeof loc.lastUsed === 'number' && typeof loc.usageCount === 'number'
          } catch {
            return false
          }
        })

        this.safeLocalStorageSet(this.RECENT_LOCATIONS_KEY, JSON.stringify(validRecentLocations))
      } catch (e) {
        console.warn('Failed to import recent locations:', e)
      }
    }
  }
}

// Create and export singleton instance
export const locationStorageService = new LocationStorageService()
