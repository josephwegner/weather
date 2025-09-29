import type { DailyForecast } from '../types/weather'

export interface TemperatureRangePosition {
  lowPosition: number
  highPosition: number
  rangeWidth: number
}

export interface TemperatureRangePositions {
  [date: string]: TemperatureRangePosition
}

/**
 * Calculates relative positioning for temperature ranges across multiple daily forecasts.
 * Used to create visual temperature range indicators similar to Dark Sky's UI.
 *
 * @param dailyForecasts Array of daily forecast data
 * @returns Object mapping date to position data for low/high temperatures
 */
export function calculateTemperatureRangePositions(
  dailyForecasts: DailyForecast[]
): TemperatureRangePositions {
  if (dailyForecasts.length === 0) {
    return {}
  }

  // Find global temperature extremes across all days
  let globalMin = Infinity
  let globalMax = -Infinity

  dailyForecasts.forEach((day) => {
    if (day.temperatureLow < globalMin) {
      globalMin = day.temperatureLow
    }
    if (day.temperatureHigh > globalMax) {
      globalMax = day.temperatureHigh
    }
  })

  const globalRange = globalMax - globalMin
  const positions: TemperatureRangePositions = {}

  dailyForecasts.forEach((day) => {
    let lowPosition: number
    let highPosition: number
    let rangeWidth: number

    if (globalRange === 0) {
      // All temperatures are the same across all days
      lowPosition = 0
      highPosition = 0
      rangeWidth = 0
    } else if (dailyForecasts.length === 1) {
      // Single day - use full width
      lowPosition = 0
      highPosition = 1
      rangeWidth = 1
    } else {
      // Calculate relative positions
      lowPosition = (day.temperatureLow - globalMin) / globalRange
      highPosition = (day.temperatureHigh - globalMin) / globalRange
      rangeWidth = (day.temperatureHigh - day.temperatureLow) / globalRange
    }

    positions[day.date] = {
      lowPosition,
      highPosition,
      rangeWidth
    }
  })

  return positions
}
