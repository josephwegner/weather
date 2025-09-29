import axios from 'axios'
import type {
  LocationSearchResult,
  LocationSearchOptions,
  GeocodingResponse,
  LocationError
} from '../types/weather'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class GeocodingService {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_RETRIES = 2
  private readonly RETRY_DELAY = 1000 // 1 second
  private readonly REQUEST_TIMEOUT = 10000 // 10 seconds

  private searchCache = new Map<string, CacheEntry<LocationSearchResult[]>>()
  private reverseCache = new Map<string, CacheEntry<LocationSearchResult>>()

  private validateCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates')
    }
  }

  private validateSearchQuery(query: string): void {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty')
    }
  }

  private getCacheKey(params: any): string {
    return JSON.stringify(params)
  }

  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < this.CACHE_DURATION
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async makeRequestWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error as Error

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * (attempt + 1))
        }
      }
    }

    throw new Error(`Geocoding failed after retries: ${lastError?.message}`)
  }

  formatLocationName(geocodingResponse: GeocodingResponse): string {
    const address = geocodingResponse.address

    if (!address) {
      return geocodingResponse.display_name
    }

    // Try to build a short, readable name
    const city = address.city || address.town || address.village
    const state = address.state
    const country = address.country
    const county = address.county

    // Country code mapping for common abbreviations
    const countryAbbreviations: Record<string, string> = {
      'united states': 'US',
      'united kingdom': 'UK',
      canada: 'CA'
    }

    // State abbreviations for US states
    const stateAbbreviations: Record<string, string> = {
      alabama: 'AL',
      alaska: 'AK',
      arizona: 'AZ',
      arkansas: 'AR',
      california: 'CA',
      colorado: 'CO',
      connecticut: 'CT',
      delaware: 'DE',
      florida: 'FL',
      georgia: 'GA',
      hawaii: 'HI',
      idaho: 'ID',
      illinois: 'IL',
      indiana: 'IN',
      iowa: 'IA',
      kansas: 'KS',
      kentucky: 'KY',
      louisiana: 'LA',
      maine: 'ME',
      maryland: 'MD',
      massachusetts: 'MA',
      michigan: 'MI',
      minnesota: 'MN',
      mississippi: 'MS',
      missouri: 'MO',
      montana: 'MT',
      nebraska: 'NE',
      nevada: 'NV',
      'new hampshire': 'NH',
      'new jersey': 'NJ',
      'new mexico': 'NM',
      'new york': 'NY',
      'north carolina': 'NC',
      'north dakota': 'ND',
      ohio: 'OH',
      oklahoma: 'OK',
      oregon: 'OR',
      pennsylvania: 'PA',
      'rhode island': 'RI',
      'south carolina': 'SC',
      'south dakota': 'SD',
      tennessee: 'TN',
      texas: 'TX',
      utah: 'UT',
      vermont: 'VT',
      virginia: 'VA',
      washington: 'WA',
      'west virginia': 'WV',
      wisconsin: 'WI',
      wyoming: 'WY'
    }

    if (city && state) {
      const stateAbbr = stateAbbreviations[state.toLowerCase()] || state
      return `${city}, ${stateAbbr}`
    }

    if (city && country) {
      const countryAbbr = countryAbbreviations[country.toLowerCase()] || country
      return `${city}, ${countryAbbr}`
    }

    if (county && state) {
      const stateAbbr = stateAbbreviations[state.toLowerCase()] || state
      return `${county}, ${stateAbbr}`
    }

    if (city) {
      return city
    }

    if (county) {
      return county
    }

    if (state) {
      return state
    }

    if (country) {
      return country
    }

    return geocodingResponse.display_name
  }

  transformNominatimResponse(response: GeocodingResponse): LocationSearchResult {
    const lat = parseFloat(response.lat)
    const lng = parseFloat(response.lon)

    // Determine location type based on Nominatim's type and class
    let type: LocationSearchResult['type'] = 'address'
    if (response.type === 'city' || response.type === 'town' || response.type === 'village') {
      type = 'city'
    } else if (response.type === 'county') {
      type = 'county'
    } else if (response.type === 'state' || response.type === 'province') {
      type = 'state'
    } else if (response.type === 'country') {
      type = 'country'
    } else if (response.type === 'postcode') {
      type = 'postcode'
    }

    return {
      lat,
      lng,
      name: this.formatLocationName(response),
      displayName: response.display_name,
      country: response.address?.country,
      state: response.address?.state,
      city: response.address?.city || response.address?.town || response.address?.village,
      type
    }
  }

  async searchLocations(options: LocationSearchOptions): Promise<LocationSearchResult[]> {
    this.validateSearchQuery(options.query)

    const cacheKey = this.getCacheKey(options)
    const cached = this.searchCache.get(cacheKey)

    if (cached && this.isCacheValid(cached)) {
      return cached.data
    }

    try {
      const results = await this.makeRequestWithRetry(async () => {
        const params: any = {
          q: options.query,
          format: 'json',
          addressdetails: 1,
          limit: options.limit || 5,
          dedupe: 1
        }

        if (options.countrycodes) {
          params.countrycodes = options.countrycodes
        }

        if (options.language) {
          params['accept-language'] = options.language
        }

        const response = await axios.get(`${this.NOMINATIM_BASE_URL}/search`, {
          params,
          timeout: this.REQUEST_TIMEOUT
        })

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid geocoding response')
        }

        return response.data as GeocodingResponse[]
      })

      // Transform and sort results (prefer cities)
      const transformedResults = results
        .map((result) => this.transformNominatimResponse(result))
        .sort((a, b) => {
          // Priority order: city > county > state > country > postcode > address
          const typePriority: Record<string, number> = {
            city: 5,
            county: 4,
            state: 3,
            country: 2,
            postcode: 1,
            address: 0
          }
          return (typePriority[b.type] || 0) - (typePriority[a.type] || 0)
        })

      // Cache the results
      this.searchCache.set(cacheKey, {
        data: transformedResults,
        timestamp: Date.now()
      })

      return transformedResults
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Geocoding failed: ${errorMessage}`)
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<LocationSearchResult> {
    this.validateCoordinates(lat, lng)

    const cacheKey = this.getCacheKey({ lat, lng })
    const cached = this.reverseCache.get(cacheKey)

    if (cached && this.isCacheValid(cached)) {
      return cached.data
    }

    try {
      const result = await this.makeRequestWithRetry(async () => {
        const response = await axios.get(`${this.NOMINATIM_BASE_URL}/reverse`, {
          params: {
            lat,
            lon: lng,
            format: 'json',
            addressdetails: 1,
            zoom: 10
          },
          timeout: this.REQUEST_TIMEOUT
        })

        if (!response.data) {
          throw new Error('Location not found')
        }

        return response.data as GeocodingResponse
      })

      const transformedResult = this.transformNominatimResponse(result)

      // Cache the result
      this.reverseCache.set(cacheKey, {
        data: transformedResult,
        timestamp: Date.now()
      })

      return transformedResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Reverse geocoding failed: ${errorMessage}`)
    }
  }

  clearCache(): void {
    this.searchCache.clear()
    this.reverseCache.clear()
  }

  getCacheStats() {
    return {
      searchCache: {
        size: this.searchCache.size,
        entries: Array.from(this.searchCache.entries()).map(([key, entry]) => ({
          key,
          timestamp: entry.timestamp,
          isValid: this.isCacheValid(entry)
        }))
      },
      reverseCache: {
        size: this.reverseCache.size,
        entries: Array.from(this.reverseCache.entries()).map(([key, entry]) => ({
          key,
          timestamp: entry.timestamp,
          isValid: this.isCacheValid(entry)
        }))
      }
    }
  }
}

// Create and export singleton instance
export const geocodingService = new GeocodingService()
