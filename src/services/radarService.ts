import type { RadarElement } from '../types/radar'

export function generateTimeSteps(now: Date): string[] {
  const rounded = new Date(now)
  rounded.setUTCSeconds(0, 0)
  rounded.setUTCMinutes(Math.floor(rounded.getUTCMinutes() / 15) * 15)

  const steps: string[] = []
  const startMs = rounded.getTime() - 2 * 60 * 60 * 1000

  for (let i = 0; i < 17; i++) {
    const d = new Date(startMs + i * 15 * 60 * 1000)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const hh = String(d.getUTCHours()).padStart(2, '0')
    const min = String(d.getUTCMinutes()).padStart(2, '0')
    steps.push(`${yyyy}-${mm}-${dd}T${hh}:${min}:00.000Z`)
  }

  return steps
}

export function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lon + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { x, y }
}

export function buildTileUrl(
  element: RadarElement,
  z: number,
  x: number,
  y: number,
  time: string
): string {
  const params = new URLSearchParams({
    element,
    z: String(z),
    x: String(x),
    y: String(y),
    time
  })
  return `/api/weather/radar-tile?${params}`
}

export function buildTileGrid(
  element: RadarElement,
  zoom: number,
  lat: number,
  lon: number,
  time: string
): string[] {
  const center = latLonToTile(lat, lon, zoom)
  const urls: string[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      urls.push(buildTileUrl(element, zoom, center.x + dx, center.y + dy, time))
    }
  }
  return urls
}

export function buildBaseMapGrid(zoom: number, lat: number, lon: number): string[] {
  const center = latLonToTile(lat, lon, zoom)
  const urls: string[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      urls.push(
        `https://basemaps.cartocdn.com/dark_all/${zoom}/${center.x + dx}/${center.y + dy}@2x.png`
      )
    }
  }
  return urls
}

export function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = (err) => reject(err)
          img.src = url
        })
    )
  )
}
