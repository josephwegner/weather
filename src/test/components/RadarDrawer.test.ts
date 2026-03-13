import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RadarDrawer from '../../components/RadarDrawer.vue'
import { preloadImages } from '../../services/radarService'

vi.mock('../../services/radarService', () => ({
  generateTimeSteps: vi.fn(() => {
    const steps: string[] = []
    for (let i = 0; i < 17; i++) {
      const d = new Date(Date.UTC(2026, 2, 13, 10 + Math.floor((i * 15) / 60), (i * 15) % 60))
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const min = String(d.getUTCMinutes()).padStart(2, '0')
      steps.push(`2026-${mm}-${dd}T${hh}:${min}`)
    }
    return steps
  }),
  buildTileGrid: vi.fn((element: string, _z: number, _lat: number, _lon: number, time: string) => {
    const urls: string[] = []
    for (let i = 0; i < 9; i++) {
      urls.push(`/api/weather/radar-tile?element=${element}&time=${time}&tile=${i}`)
    }
    return urls
  }),
  buildBaseMapGrid: vi.fn(() => {
    const urls: string[] = []
    for (let i = 0; i < 9; i++) {
      urls.push(`https://basemaps.cartocdn.com/dark_all/6/0/${i}@2x.png`)
    }
    return urls
  }),
  preloadImages: vi.fn(() => Promise.resolve(new Array(162).fill(new Image())))
}))

const mockedPreloadImages = vi.mocked(preloadImages)

const defaultProps = {
  isOpen: true,
  location: { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' }
}

describe('RadarDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedPreloadImages.mockResolvedValue(new Array(162).fill(new Image()))
  })

  it('renders nothing when isOpen is false', () => {
    const wrapper = mount(RadarDrawer, {
      props: { ...defaultProps, isOpen: false }
    })
    expect(wrapper.find('.radar-drawer').exists()).toBe(false)
  })

  it('shows loading state initially when opened', () => {
    mockedPreloadImages.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(RadarDrawer, { props: defaultProps })
    expect(wrapper.find('.radar-loading').exists()).toBe(true)
  })

  it('shows radar image, scrubber, and element picker after preload', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    expect(wrapper.find('.radar-loading').exists()).toBe(false)
    expect(wrapper.find('.radar-image-container').exists()).toBe(true)
    expect(wrapper.find('.radar-scrubber').exists()).toBe(true)
    expect(wrapper.find('.radar-elements').exists()).toBe(true)
  })

  it('close button emits close event', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    await wrapper.find('.radar-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('displays 9 cells with base and overlay tiles', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    const cells = wrapper.findAll('.radar-tile-cell')
    expect(cells).toHaveLength(9)

    const tiles = wrapper.findAll('.radar-tile')
    expect(tiles).toHaveLength(18)
  })

  it('renders base map tiles from CartoDB', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    const baseTiles = wrapper.findAll('.radar-tile--base')
    expect(baseTiles).toHaveLength(9)
    baseTiles.forEach((tile) => {
      expect(tile.attributes('src')).toContain('basemaps.cartocdn.com/dark_all')
    })
  })

  it('element picker switches type and triggers reload', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    mockedPreloadImages.mockClear()
    mockedPreloadImages.mockResolvedValue(new Array(162).fill(new Image()))

    const tempButton = wrapper.findAll('.radar-elements button').find((b) => b.text() === 'TEMP')
    await tempButton!.trigger('click')
    await flushPromises()

    expect(mockedPreloadImages).toHaveBeenCalled()
  })

  it('shows correct relative time labels', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    expect(wrapper.find('.scrubber-label').text()).toBe('Now')
  })

  it('zoom level changes on wheel event', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    const container = wrapper.find('.radar-image-container')
    await container.trigger('wheel', { deltaY: -100 })

    const grid = wrapper.find('.radar-tile-grid')
    expect(grid.attributes('style')).toContain('scale(')
  })

  it('scrubber and element picker are hidden while loading', () => {
    mockedPreloadImages.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(RadarDrawer, { props: defaultProps })
    expect(wrapper.find('.radar-scrubber').exists()).toBe(false)
    expect(wrapper.find('.radar-elements').exists()).toBe(false)
  })

  it('header with title and close button always visible when open', () => {
    mockedPreloadImages.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(RadarDrawer, { props: defaultProps })
    expect(wrapper.find('.radar-header').exists()).toBe(true)
    expect(wrapper.find('.radar-title').text()).toBe('Radar')
    expect(wrapper.find('.radar-close').exists()).toBe(true)
  })

  it('custom scrubber has track, thumb, and tick marks', async () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    await flushPromises()

    expect(wrapper.find('.scrubber-track').exists()).toBe(true)
    expect(wrapper.find('.scrubber-thumb').exists()).toBe(true)
    expect(wrapper.findAll('.scrubber-tick')).toHaveLength(17)
    expect(wrapper.find('.scrubber-tick--now').exists()).toBe(true)
  })

  it('has slide transition wrapper', () => {
    const wrapper = mount(RadarDrawer, { props: defaultProps })
    expect(wrapper.find('.radar-drawer').exists()).toBe(true)
  })
})
