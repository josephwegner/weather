import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Location, RecentLocation } from '../../types/weather'
import { TEST_LOCATIONS, TEST_RECENT_LOCATIONS } from '../constants'
import { locationStorageService } from '../../services/locationStorageService'

describe('Location Storage Service', () => {
  const testLocation: Location = TEST_LOCATIONS.CHICAGO
  const testRecentLocation: RecentLocation = TEST_RECENT_LOCATIONS.CHICAGO_RECENT

  // Mock localStorage
  let mockStore: Record<string, string> = {}
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStore[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStore[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStore[key]
    }),
    clear: vi.fn(() => {
      mockStore = {}
    }),
    get length() {
      return Object.keys(mockStore).length
    },
    key: vi.fn((index: number) => Object.keys(mockStore)[index] || null)
  }

  beforeEach(() => {
    // Reset localStorage mock
    mockStore = {}
    mockLocalStorage.clear()
    vi.clearAllMocks()

    // Reset mock implementations to default
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      mockStore[key] = value
    })
    mockLocalStorage.getItem.mockImplementation((key: string) => mockStore[key] || null)
    mockLocalStorage.removeItem.mockImplementation((key: string) => {
      delete mockStore[key]
    })

    // Mock global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
  })

  describe('Current Location Management', () => {
    it('saves current location to localStorage', () => {
      locationStorageService.setCurrentLocation(testLocation)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-app-current-location',
        JSON.stringify(testLocation)
      )
    })

    it('loads current location from localStorage', () => {
      mockLocalStorage.setItem('weather-app-current-location', JSON.stringify(testLocation))

      const result = locationStorageService.getCurrentLocation()

      expect(result).toEqual(testLocation)
    })

    it('returns null when no current location is stored', () => {
      const result = locationStorageService.getCurrentLocation()

      expect(result).toBeNull()
    })

    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.setItem('weather-app-current-location', 'invalid-json')

      const result = locationStorageService.getCurrentLocation()

      expect(result).toBeNull()
    })
  })

  describe('Recent Locations Management', () => {
    it('adds new location to recent locations list', () => {
      locationStorageService.addRecentLocation(testLocation)

      const recentLocations = locationStorageService.getRecentLocations()

      expect(recentLocations).toHaveLength(1)
      expect(recentLocations[0]).toMatchObject({
        lat: testLocation.lat,
        lng: testLocation.lng,
        name: testLocation.name,
        usageCount: 1
      })
      expect(recentLocations[0].lastUsed).toBeTypeOf('number')
    })

    it('updates existing location in recent locations (usage count and timestamp)', () => {
      // Add location first time
      const mockNow = vi.fn()
      Date.now = mockNow
      mockNow.mockReturnValue(1000000)

      locationStorageService.addRecentLocation(testLocation)

      // Add same location again
      mockNow.mockReturnValue(2000000)
      locationStorageService.addRecentLocation(testLocation)

      const recentLocations = locationStorageService.getRecentLocations()

      expect(recentLocations).toHaveLength(1)
      expect(recentLocations[0].usageCount).toBe(2)
      expect(recentLocations[0].lastUsed).toBe(2000000)
    })

    it('maintains maximum number of recent locations (5)', () => {
      const locations = [
        TEST_LOCATIONS.CHICAGO,
        TEST_LOCATIONS.NEW_YORK,
        TEST_LOCATIONS.LAS_VEGAS,
        TEST_LOCATIONS.LONDON,
        TEST_LOCATIONS.TOKYO,
        { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' }
      ]

      locations.forEach((location) => {
        locationStorageService.addRecentLocation(location)
      })

      const recentLocations = locationStorageService.getRecentLocations()

      expect(recentLocations).toHaveLength(5)
    })

    it('removes oldest location when exceeding maximum', () => {
      const mockNow = vi.fn()
      Date.now = mockNow

      // Add 5 locations with different timestamps
      const locations = [
        TEST_LOCATIONS.CHICAGO,
        TEST_LOCATIONS.NEW_YORK,
        TEST_LOCATIONS.LAS_VEGAS,
        TEST_LOCATIONS.LONDON,
        TEST_LOCATIONS.TOKYO
      ]

      locations.forEach((location, index) => {
        mockNow.mockReturnValue(1000000 + index * 1000)
        locationStorageService.addRecentLocation(location)
      })

      // Add 6th location
      const newLocation = { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' }
      mockNow.mockReturnValue(1000000 + 6000)
      locationStorageService.addRecentLocation(newLocation)

      const recentLocations = locationStorageService.getRecentLocations()

      expect(recentLocations).toHaveLength(5)
      // Should not contain Chicago (oldest)
      expect(recentLocations.find((loc) => loc.name === 'Chicago, IL')).toBeUndefined()
      // Should contain San Francisco (newest)
      expect(recentLocations.find((loc) => loc.name === 'San Francisco, CA')).toBeDefined()
    })

    it('sorts recent locations by last used timestamp (most recent first)', () => {
      const mockNow = vi.fn()
      Date.now = mockNow

      // Add locations with different timestamps
      mockNow.mockReturnValue(1000000)
      locationStorageService.addRecentLocation(TEST_LOCATIONS.CHICAGO)

      mockNow.mockReturnValue(3000000)
      locationStorageService.addRecentLocation(TEST_LOCATIONS.NEW_YORK)

      mockNow.mockReturnValue(2000000)
      locationStorageService.addRecentLocation(TEST_LOCATIONS.LAS_VEGAS)

      const recentLocations = locationStorageService.getRecentLocations()

      expect(recentLocations[0].name).toBe('New York, NY') // Most recent
      expect(recentLocations[1].name).toBe('Las Vegas, NV')
      expect(recentLocations[2].name).toBe('Chicago, IL') // Oldest
    })

    it('loads recent locations from localStorage', () => {
      const testRecentLocations = [TEST_RECENT_LOCATIONS.CHICAGO_RECENT]
      mockLocalStorage.setItem('weather-app-recent-locations', JSON.stringify(testRecentLocations))

      const result = locationStorageService.getRecentLocations()

      expect(result).toEqual(testRecentLocations)
    })

    it('returns empty array when no recent locations stored', () => {
      const result = locationStorageService.getRecentLocations()

      expect(result).toEqual([])
    })

    it('handles corrupted recent locations data gracefully', () => {
      mockLocalStorage.setItem('weather-app-recent-locations', 'invalid-json')

      const result = locationStorageService.getRecentLocations()

      expect(result).toEqual([])
    })
  })

  describe('Location Comparison', () => {
    it('identifies same locations with identical coordinates', () => {
      const location1 = { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' }
      const location2 = { lat: 41.8781, lng: -87.6298, name: 'Chicago, Illinois' }

      const areSame = locationStorageService.areLocationsSame(location1, location2)

      expect(areSame).toBe(true)
    })

    it('identifies same locations with slightly different coordinates (within tolerance)', () => {
      const location1 = { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' }
      const location2 = { lat: 41.8782, lng: -87.6299, name: 'Chicago Downtown' }

      const areSame = locationStorageService.areLocationsSame(location1, location2)

      expect(areSame).toBe(true)
    })

    it('identifies different locations with significantly different coordinates', () => {
      const chicago = TEST_LOCATIONS.CHICAGO
      const newYork = TEST_LOCATIONS.NEW_YORK

      const areSame = locationStorageService.areLocationsSame(chicago, newYork)

      expect(areSame).toBe(false)
    })
  })

  describe('Data Persistence', () => {
    it('persists data across service instances', () => {
      locationStorageService.setCurrentLocation(testLocation)
      locationStorageService.addRecentLocation(testLocation)

      // Simulate new service instance by calling init again
      const currentLocation = locationStorageService.getCurrentLocation()
      const recentLocations = locationStorageService.getRecentLocations()

      expect(currentLocation).toEqual(testLocation)
      expect(recentLocations).toHaveLength(1)
    })

    it('clears all stored location data', () => {
      locationStorageService.setCurrentLocation(testLocation)
      locationStorageService.addRecentLocation(testLocation)

      locationStorageService.clearAllData()

      expect(locationStorageService.getCurrentLocation()).toBeNull()
      expect(locationStorageService.getRecentLocations()).toEqual([])
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('weather-app-current-location')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('weather-app-recent-locations')
    })

    it('exports location data for backup', () => {
      locationStorageService.setCurrentLocation(testLocation)
      locationStorageService.addRecentLocation(testLocation)

      const exportedData = locationStorageService.exportData()

      expect(exportedData).toEqual({
        currentLocation: testLocation,
        recentLocations: expect.any(Array),
        exportedAt: expect.any(Number)
      })
    })

    it('imports location data from backup', () => {
      const backupData = {
        currentLocation: testLocation,
        recentLocations: [TEST_RECENT_LOCATIONS.CHICAGO_RECENT],
        exportedAt: Date.now()
      }

      locationStorageService.importData(backupData)

      expect(locationStorageService.getCurrentLocation()).toEqual(testLocation)
      expect(locationStorageService.getRecentLocations()).toEqual([
        TEST_RECENT_LOCATIONS.CHICAGO_RECENT
      ])
    })
  })

  describe('Error Handling', () => {
    it('handles localStorage quota exceeded gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => {
        locationStorageService.setCurrentLocation(testLocation)
      }).not.toThrow()

      // Should log error but continue functioning
      expect(locationStorageService.getCurrentLocation()).toBeNull()
    })

    it('handles localStorage unavailable gracefully', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      })

      expect(() => {
        locationStorageService.setCurrentLocation(testLocation)
      }).not.toThrow()

      expect(locationStorageService.getCurrentLocation()).toBeNull()
    })

    it('validates location data before storage', () => {
      const invalidLocation = { lat: 'invalid', lng: 'invalid', name: '' } as any

      expect(() => {
        locationStorageService.setCurrentLocation(invalidLocation)
      }).toThrow('Invalid location data')
    })

    it('validates recent locations array before storage', () => {
      const invalidRecentData = 'not-an-array'
      mockStore['weather-app-recent-locations'] = invalidRecentData

      const result = locationStorageService.getRecentLocations()

      expect(result).toEqual([])
    })
  })
})
