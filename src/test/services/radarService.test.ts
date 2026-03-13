import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateTimeSteps,
  buildTileUrl,
  buildTileGrid,
  buildBaseMapGrid,
  latLonToTile,
  preloadImages
} from '../../services/radarService'

describe('radarService', () => {
  describe('generateTimeSteps', () => {
    it('returns exactly 17 timestamps', () => {
      const now = new Date('2026-03-13T12:00:00Z')
      const steps = generateTimeSteps(now)
      expect(steps).toHaveLength(17)
    })

    it('generates timestamps 15 minutes apart', () => {
      const now = new Date('2026-03-13T12:00:00Z')
      const steps = generateTimeSteps(now)

      for (let i = 1; i < steps.length; i++) {
        const prev = new Date(steps[i - 1]).getTime()
        const curr = new Date(steps[i]).getTime()
        expect(curr - prev).toBe(15 * 60 * 1000)
      }
    })

    it('starts 2 hours before now and ends 2 hours after', () => {
      const now = new Date('2026-03-13T12:00:00Z')
      const steps = generateTimeSteps(now)

      expect(steps[0]).toBe('2026-03-13T10:00:00.000Z')
      expect(steps[8]).toBe('2026-03-13T12:00:00.000Z')
      expect(steps[16]).toBe('2026-03-13T14:00:00.000Z')
    })

    it('rounds to nearest 15-minute boundary', () => {
      const now = new Date('2026-03-13T12:07:00Z')
      const steps = generateTimeSteps(now)

      expect(steps[8]).toBe('2026-03-13T12:00:00.000Z')
    })
  })

  describe('latLonToTile', () => {
    it('converts lat/lon to tile coordinates at zoom 8', () => {
      const { x, y } = latLonToTile(41.8781, -87.6298, 8)
      expect(x).toBe(65)
      expect(y).toBe(95)
    })

    it('converts equator/prime meridian to center tiles', () => {
      const { x, y } = latLonToTile(0, 0, 2)
      expect(x).toBe(2)
      expect(y).toBe(2)
    })
  })

  describe('buildTileUrl', () => {
    it('produces correct URL with tile params', () => {
      const url = buildTileUrl('precipcomposite', 8, 65, 95, '2026-03-13T12:00')

      expect(url).toContain('element=precipcomposite')
      expect(url).toContain('z=8')
      expect(url).toContain('x=65')
      expect(url).toContain('y=95')
      expect(url).toContain('time=')
      expect(url.startsWith('/api/weather/radar-tile?')).toBe(true)
    })
  })

  describe('buildTileGrid', () => {
    it('returns 9 tile URLs (3x3 grid)', () => {
      const urls = buildTileGrid('precipcomposite', 8, 41.8781, -87.6298, '2026-03-13T12:00')
      expect(urls).toHaveLength(9)
    })

    it('includes center and surrounding tiles', () => {
      const urls = buildTileGrid('precipcomposite', 8, 41.8781, -87.6298, '2026-03-13T12:00')
      expect(urls[4]).toContain('x=65')
      expect(urls[4]).toContain('y=95')
      expect(urls[0]).toContain('x=64')
      expect(urls[0]).toContain('y=94')
      expect(urls[8]).toContain('x=66')
      expect(urls[8]).toContain('y=96')
    })
  })

  describe('buildBaseMapGrid', () => {
    it('returns 9 base map URLs (3x3 grid)', () => {
      const urls = buildBaseMapGrid(8, 41.8781, -87.6298)
      expect(urls).toHaveLength(9)
    })

    it('uses CartoDB dark_all tiles', () => {
      const urls = buildBaseMapGrid(8, 41.8781, -87.6298)
      urls.forEach((url) => {
        expect(url).toMatch(/^https:\/\/basemaps\.cartocdn\.com\/dark_all\//)
        expect(url).toContain('@2x.png')
      })
    })

    it('includes correct tile coordinates', () => {
      const urls = buildBaseMapGrid(8, 41.8781, -87.6298)
      expect(urls[0]).toContain('/8/64/94@2x.png')
      expect(urls[4]).toContain('/8/65/95@2x.png')
      expect(urls[8]).toContain('/8/66/96@2x.png')
    })
  })

  describe('preloadImages', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('resolves after all images load', async () => {
      const loadHandlers: (() => void)[] = []

      vi.stubGlobal(
        'Image',
        class {
          src = ''
          onload: (() => void) | null = null
          onerror: ((err: any) => void) | null = null

          set _src(val: string) {
            this.src = val
          }

          constructor() {
            loadHandlers.push(() => this.onload?.())
          }
        }
      )

      const urls = ['/img1.webp', '/img2.webp', '/img3.webp']
      const promise = preloadImages(urls)

      loadHandlers.forEach((handler) => handler())

      await expect(promise).resolves.toHaveLength(3)
    })

    it('rejects if any image fails to load', async () => {
      let errorHandler: ((err: any) => void) | null = null

      vi.stubGlobal(
        'Image',
        class {
          src = ''
          onload: (() => void) | null = null
          onerror: ((err: any) => void) | null = null

          constructor() {
            errorHandler = (err: any) => this.onerror?.(err)
          }
        }
      )

      const urls = ['/img1.webp']
      const promise = preloadImages(urls)

      ;(errorHandler as ((err: any) => void) | null)?.(new Error('load failed'))

      await expect(promise).rejects.toThrow()
    })
  })
})
