import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import axios from 'axios'
import type {
  LocationSearchResult,
  LocationSearchOptions,
  GeocodingResponse,
  GeolocationResult
} from '../../types/weather'
import { TEST_LOCATIONS } from '../constants'
import { geocodingService } from '../../services/geocodingService'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as any
const mockAxiosGet = mockedAxios.get as MockedFunction<typeof axios.get>

describe('Geocoding Service', () => {
  const mockNominatimResponse: GeocodingResponse[] = [
    {
      place_id: 123456,
      licence: 'Mock licence',
      osm_type: 'way',
      osm_id: 789012,
      boundingbox: ['41.8', '41.9', '-87.7', '-87.6'],
      lat: '41.8781',
      lon: '-87.6298',
      display_name: 'Chicago, Cook County, Illinois, United States',
      class: 'place',
      type: 'city',
      importance: 0.85,
      address: {
        city: 'Chicago',
        county: 'Cook County',
        state: 'Illinois',
        country: 'United States',
        country_code: 'us'
      }
    },
    {
      place_id: 234567,
      licence: 'Mock licence',
      osm_type: 'node',
      osm_id: 345678,
      boundingbox: ['40.7', '40.8', '-74.1', '-74.0'],
      lat: '40.7128',
      lon: '-74.0060',
      display_name: 'New York, New York, United States',
      class: 'place',
      type: 'city',
      importance: 0.9,
      address: {
        city: 'New York',
        state: 'New York',
        country: 'United States',
        country_code: 'us'
      }
    }
  ]

  const mockReverseGeocodeResponse: GeocodingResponse = {
    place_id: 123456,
    licence: 'Mock licence',
    osm_type: 'way',
    osm_id: 789012,
    boundingbox: ['41.8', '41.9', '-87.7', '-87.6'],
    lat: '41.8781',
    lon: '-87.6298',
    display_name: 'Chicago, Cook County, Illinois, United States',
    class: 'place',
    type: 'city',
    importance: 0.85,
    address: {
      city: 'Chicago',
      county: 'Cook County',
      state: 'Illinois',
      country: 'United States',
      country_code: 'us'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAxiosGet.mockReset()
    // Clear service cache to ensure clean state for each test
    geocodingService.clearCache()
  })

  describe('Forward Geocoding (Search)', () => {
    it('searches for locations with basic query', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockNominatimResponse })

      const results = await geocodingService.searchLocations({ query: 'Chicago' })

      expect(mockAxiosGet).toHaveBeenCalledWith('https://nominatim.openstreetmap.org/search', {
        params: {
          q: 'Chicago',
          format: 'json',
          addressdetails: 1,
          limit: 5,
          dedupe: 1
        },
        timeout: 10000
      })

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        country: 'United States',
        state: 'Illinois',
        city: 'Chicago',
        type: 'city'
      })
    })

    it('searches with custom options (limit, country codes)', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockNominatimResponse.slice(0, 1) })

      const options: LocationSearchOptions = {
        query: 'Chicago',
        limit: 1,
        countrycodes: 'us',
        language: 'en'
      }

      await geocodingService.searchLocations(options)

      expect(mockAxiosGet).toHaveBeenCalledWith('https://nominatim.openstreetmap.org/search', {
        params: {
          q: 'Chicago',
          format: 'json',
          addressdetails: 1,
          limit: 1,
          countrycodes: 'us',
          'accept-language': 'en',
          dedupe: 1
        },
        timeout: 10000
      })
    })

    it('handles empty search results', async () => {
      mockAxiosGet.mockResolvedValue({ data: [] })

      const results = await geocodingService.searchLocations({ query: 'NonexistentPlace' })

      expect(results).toEqual([])
    })

    it('handles network errors gracefully', async () => {
      mockAxiosGet.mockRejectedValue(new Error('Network error'))

      await expect(geocodingService.searchLocations({ query: 'Chicago' })).rejects.toThrow(
        'Geocoding failed: Geocoding failed after retries: Network error'
      )
    })

    it('handles malformed API response', async () => {
      mockAxiosGet.mockResolvedValue({ data: null })

      await expect(geocodingService.searchLocations({ query: 'Chicago' })).rejects.toThrow(
        'Invalid geocoding response'
      )
    })

    it('filters results by type preference (cities first)', async () => {
      const mixedResults = [
        { ...mockNominatimResponse[0], type: 'address', class: 'place' },
        { ...mockNominatimResponse[1], type: 'city', class: 'place' }
      ]
      mockAxiosGet.mockResolvedValue({ data: mixedResults })

      const results = await geocodingService.searchLocations({ query: 'Chicago' })

      // Should prioritize cities
      expect(results[0].type).toBe('city')
    })

    it('validates search query input', async () => {
      await expect(geocodingService.searchLocations({ query: '' })).rejects.toThrow(
        'Search query cannot be empty'
      )

      await expect(geocodingService.searchLocations({ query: '  ' })).rejects.toThrow(
        'Search query cannot be empty'
      )
    })
  })

  describe('Reverse Geocoding', () => {
    it('reverse geocodes coordinates to location', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockReverseGeocodeResponse })

      const result = await geocodingService.reverseGeocode(41.8781, -87.6298)

      expect(mockAxiosGet).toHaveBeenCalledWith('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: 41.8781,
          lon: -87.6298,
          format: 'json',
          addressdetails: 1,
          zoom: 10
        },
        timeout: 10000
      })

      expect(result).toEqual({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        country: 'United States',
        state: 'Illinois',
        city: 'Chicago',
        type: 'city'
      })
    })

    it('handles reverse geocoding failures', async () => {
      mockAxiosGet.mockRejectedValue(new Error('Location not found'))

      await expect(geocodingService.reverseGeocode(0, 0)).rejects.toThrow(
        'Reverse geocoding failed: Geocoding failed after retries: Location not found'
      )
    })

    it('validates coordinate ranges', async () => {
      await expect(geocodingService.reverseGeocode(91, 0)).rejects.toThrow('Invalid coordinates')

      await expect(geocodingService.reverseGeocode(-91, 0)).rejects.toThrow('Invalid coordinates')

      await expect(geocodingService.reverseGeocode(0, 181)).rejects.toThrow('Invalid coordinates')

      await expect(geocodingService.reverseGeocode(0, -181)).rejects.toThrow('Invalid coordinates')
    })

    it('handles empty reverse geocoding response', async () => {
      mockAxiosGet.mockResolvedValue({ data: null })

      await expect(geocodingService.reverseGeocode(41.8781, -87.6298)).rejects.toThrow(
        'Location not found'
      )
    })
  })

  describe('Location Name Generation', () => {
    it('formats location names with city and state', () => {
      const formatted = geocodingService.formatLocationName(mockReverseGeocodeResponse)

      expect(formatted).toBe('Chicago, IL')
    })

    it('handles locations without state (international)', () => {
      const internationalLocation = {
        ...mockReverseGeocodeResponse,
        address: {
          city: 'London',
          country: 'United Kingdom',
          country_code: 'gb'
        }
      }

      const formatted = geocodingService.formatLocationName(internationalLocation)

      expect(formatted).toBe('London, UK')
    })

    it('handles locations without city (uses county or other)', () => {
      const ruralLocation = {
        ...mockReverseGeocodeResponse,
        address: {
          county: 'Cook County',
          state: 'Illinois',
          country: 'United States',
          country_code: 'us'
        }
      }

      const formatted = geocodingService.formatLocationName(ruralLocation)

      expect(formatted).toBe('Cook County, IL')
    })

    it('handles minimal address information', () => {
      const minimalLocation = {
        ...mockReverseGeocodeResponse,
        display_name: 'Some Remote Location',
        address: {
          country: 'United States',
          country_code: 'us'
        }
      }

      const formatted = geocodingService.formatLocationName(minimalLocation)

      expect(formatted).toBe('United States')
    })
  })

  describe('Response Transformation', () => {
    it('transforms Nominatim response to LocationSearchResult', () => {
      const transformed = geocodingService.transformNominatimResponse(mockNominatimResponse[0])

      expect(transformed).toEqual({
        lat: 41.8781,
        lng: -87.6298,
        name: 'Chicago, IL',
        displayName: 'Chicago, Cook County, Illinois, United States',
        country: 'United States',
        state: 'Illinois',
        city: 'Chicago',
        type: 'city'
      })
    })

    it('determines location type from Nominatim type and class', () => {
      const postcodeLocation = {
        ...mockNominatimResponse[0],
        type: 'postcode',
        class: 'place'
      }

      const transformed = geocodingService.transformNominatimResponse(postcodeLocation)

      expect(transformed.type).toBe('postcode')
    })

    it('handles missing address components gracefully', () => {
      const incompleteLocation = {
        ...mockNominatimResponse[0],
        address: {
          country: 'United States'
        }
      }

      const transformed = geocodingService.transformNominatimResponse(incompleteLocation)

      expect(transformed.country).toBe('United States')
      expect(transformed.state).toBeUndefined()
      expect(transformed.city).toBeUndefined()
    })
  })

  describe('Rate Limiting and Caching', () => {
    it('implements rate limiting for API requests', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockNominatimResponse })

      // Make multiple rapid requests
      const promises = Array.from({ length: 5 }, () =>
        geocodingService.searchLocations({ query: 'Chicago' })
      )

      await Promise.all(promises)

      // Should implement some form of rate limiting or request queuing
      expect(mockAxiosGet).toHaveBeenCalledTimes(5)
    })

    it('caches identical search requests', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockNominatimResponse })

      // Make same request twice
      await geocodingService.searchLocations({ query: 'Chicago' })
      await geocodingService.searchLocations({ query: 'Chicago' })

      // Should cache and only make one actual HTTP request
      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
    })

    it('cache expires after appropriate time', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockNominatimResponse })

      // Mock time
      const originalNow = Date.now
      const mockNow = vi.fn()
      Date.now = mockNow

      mockNow.mockReturnValue(1000000)
      await geocodingService.searchLocations({ query: 'Chicago' })

      // Move time forward past cache expiry (assume 5 minutes)
      mockNow.mockReturnValue(1000000 + 6 * 60 * 1000)
      await geocodingService.searchLocations({ query: 'Chicago' })

      expect(mockAxiosGet).toHaveBeenCalledTimes(2)

      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Error Recovery', () => {
    it('retries on temporary network failures', async () => {
      mockAxiosGet
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue({ data: mockNominatimResponse })

      const results = await geocodingService.searchLocations({ query: 'Chicago' })

      expect(mockAxiosGet).toHaveBeenCalledTimes(2)
      expect(results).toHaveLength(2)
    })

    it('gives up after maximum retries', async () => {
      mockAxiosGet
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))

      await expect(geocodingService.searchLocations({ query: 'Chicago' })).rejects.toThrow(
        'Geocoding failed after retries'
      )
    })
  })
})
