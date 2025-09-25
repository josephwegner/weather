import type { CurrentWeather, HourlyForecast, DailyForecast, Location } from '../types/weather'

export interface MockScenario {
  id: string
  name: string
  description: string
  location: Location
  currentWeather: CurrentWeather
  hourlyForecast: HourlyForecast[]
  dailyForecast: DailyForecast[]
}

const now = Math.floor(Date.now() / 1000)

/**
 * Generates a natural daily temperature curve that peaks around noon (hour 12)
 * and reaches its minimum around 6 AM
 */
function getDailyTemperatureCurve(hour: number, baseTemp: number, variation: number): number {
  return baseTemp + Math.sin(((hour - 6) * Math.PI) / 12) * variation
}

/**
 * Creates a precipitation probability pattern that varies throughout the day
 */
function getPrecipitationPattern(hour: number, maxProb: number): number {
  return Math.round(Math.max(0, Math.sin(hour * 0.4) * maxProb))
}

/**
 * Generates UV index that peaks at solar noon (around hour 12)
 */
function getUVIndexCurve(hour: number, maxUV: number): number {
  return Math.max(0, Math.round(maxUV * Math.sin(((hour - 6) * Math.PI) / 12)))
}

/**
 * Creates atmospheric pressure variations throughout the day
 */
function getPressureVariation(hour: number, basePressure: number, variation: number): number {
  return Math.round(basePressure + Math.sin(hour * 0.05) * variation)
}

/**
 * Generates wind speed variations with some randomness
 */
function getWindSpeedVariation(hour: number, baseSpeed: number, variation: number): number {
  return Math.round(baseSpeed + Math.cos(hour * 0.1) * variation)
}

/**
 * Creates wind direction changes throughout the day
 */
function getWindDirectionShift(hour: number, baseDirection: number, maxShift: number): number {
  return Math.round(baseDirection + Math.sin(hour * 0.1) * maxShift)
}

/**
 * Generates cloud cover patterns
 */
function getCloudCoverPattern(hour: number, baseCover: number, variation: number): number {
  return Math.round(Math.max(0, Math.min(100, baseCover + Math.sin(hour * 0.3) * variation)))
}

/**
 * Creates humidity variations based on temperature and time of day
 */
function getHumidityPattern(hour: number, baseHumidity: number, variation: number): number {
  return Math.round(Math.max(30, Math.min(90, baseHumidity + Math.cos(hour * 0.2) * variation)))
}

/**
 * Generates seasonal temperature variations for daily forecasts
 */
function getSeasonalTemperaturePattern(day: number, baseTemp: number, variation: number): number {
  return baseTemp + Math.sin(day * 0.5) * variation
}

export const mockScenarios: MockScenario[] = [
  {
    id: 'normal-chicago',
    name: 'Normal Chicago Weather',
    description: 'Typical Chicago weather with complete data',
    location: { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
    currentWeather: {
      temperature: 72,
      feelsLike: 75,
      humidity: 65,
      pressure: 1013,
      windSpeed: 8,
      windDirection: 180,
      visibility: 10,
      uvIndex: 3,
      description: 'partly cloudy',
      icon: '02d',
      timestamp: now
    },
    hourlyForecast: Array.from({ length: 24 }, (_, i) => {
      const temp = getDailyTemperatureCurve(i, 72, 10)
      const precipProb = getPrecipitationPattern(i, 30)
      const hasRain = precipProb > 20
      return {
        timestamp: now + i * 3600,
        temperature: temp,
        feelsLike: temp + 3 + getDailyTemperatureCurve(i, 0, 2),
        humidity: getHumidityPattern(i, 65, 15),
        precipitationProbability: precipProb,
        precipitationIntensity: hasRain ? Math.random() * 0.5 : 0,
        precipitationType: hasRain ? 'rain' : undefined,
        windSpeed: getWindSpeedVariation(i, 8, 5),
        windDirection: getWindDirectionShift(i, 180, 45),
        windGust: Math.round(12 + Math.cos(i * 0.15) * 8),
        pressure: getPressureVariation(i, 1013, 5),
        uvIndex: getUVIndexCurve(i, 6),
        cloudCover: getCloudCoverPattern(i, 40, 30),
        visibility: Math.round(Math.max(5, 15 - Math.abs(Math.sin(i * 0.2)) * 5)),
        description: i < 12 ? 'partly cloudy' : 'clear sky',
        icon: i < 12 ? '02d' : '01n'
      }
    }),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: getSeasonalTemperaturePattern(i, 78, 8),
      temperatureLow: getSeasonalTemperaturePattern(i, 58, 6),
      precipitationProbability: Math.round(Math.max(0, Math.sin(i * 0.7) * 40)),
      precipitationIntensity: 0,
      windSpeed: 8 + Math.cos(i * 0.3) * 4,
      windDirection: 180 + Math.sin(i * 0.2) * 30,
      humidity: 65 + Math.cos(i * 0.4) * 10,
      uvIndex: 3 + Math.sin(i * 0.6) * 2,
      description:
        ['partly cloudy', 'sunny', 'cloudy', 'light rain', 'sunny', 'partly cloudy', 'clear sky'][
          i
        ] || 'partly cloudy',
      icon: ['02d', '01d', '04d', '10d', '01d', '02d', '01d'][i] || '02d'
    }))
  },
  {
    id: 'extreme-heat',
    name: 'Extreme Heat Wave',
    description: 'Desert-like conditions with extreme temperatures',
    location: { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' },
    currentWeather: {
      temperature: 118,
      feelsLike: 125,
      humidity: 8,
      pressure: 1008,
      windSpeed: 15,
      windDirection: 225,
      visibility: 5,
      uvIndex: 11,
      description: 'clear sky',
      icon: '01d',
      timestamp: now
    },
    hourlyForecast: Array.from({ length: 24 }, (_, i) => {
      const temp = getDailyTemperatureCurve(i, 110, 8)
      return {
        timestamp: now + i * 3600,
        temperature: temp,
        feelsLike: temp + 10 + getDailyTemperatureCurve(i, 0, 2),
        humidity: Math.round(8 + Math.abs(Math.sin(i * 0.3) * 5)),
        precipitationProbability: 0,
        precipitationIntensity: 0,
        precipitationType: undefined,
        windSpeed: getWindSpeedVariation(i, 12, 8),
        windDirection: getWindDirectionShift(i, 225, 30),
        windGust: Math.round(20 + Math.cos(i * 0.1) * 10),
        pressure: getPressureVariation(i, 1008, 3),
        uvIndex: getUVIndexCurve(i, 10),
        cloudCover: getCloudCoverPattern(i, 5, 10),
        visibility: Math.round(Math.max(3, 8 - Math.abs(Math.sin(i * 0.3)) * 3)), // Reduced by heat haze
        description: 'clear sky',
        icon: i >= 6 && i <= 18 ? '01d' : '01n'
      }
    }),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: getSeasonalTemperaturePattern(i, 118, 5),
      temperatureLow: getSeasonalTemperaturePattern(i, 95, 8),
      precipitationProbability: 0,
      precipitationIntensity: 0,
      windSpeed: 15 + Math.cos(i * 0.2) * 5,
      windDirection: 225 + Math.sin(i * 0.1) * 20,
      humidity: 8 + Math.abs(Math.sin(i * 0.4) * 5),
      uvIndex: 11,
      description: 'clear sky',
      icon: '01d'
    }))
  },
  {
    id: 'extreme-cold',
    name: 'Arctic Blast',
    description: 'Sub-zero temperatures with wind chill',
    location: { lat: 64.8378, lng: -147.7164, name: 'Fairbanks, AK' },
    currentWeather: {
      temperature: -25,
      feelsLike: -45,
      humidity: 78,
      pressure: 1035,
      windSpeed: 25,
      windDirection: 350,
      visibility: 2,
      uvIndex: 0,
      description: 'snow',
      icon: '13d',
      timestamp: now
    },
    hourlyForecast: Array.from({ length: 24 }, (_, i) => {
      const temp = getDailyTemperatureCurve(i, -20, 8)
      return {
        timestamp: now + i * 3600,
        temperature: temp,
        feelsLike: temp - 20 + getDailyTemperatureCurve(i, 0, 5),
        humidity: getHumidityPattern(i, 75, 10),
        precipitationProbability: 85,
        precipitationIntensity: 0.3 + Math.random() * 0.4,
        precipitationType: 'snow',
        windSpeed: getWindSpeedVariation(i, 20, 10),
        windDirection: getWindDirectionShift(i, 350, 20),
        windGust: Math.round(35 + Math.cos(i * 0.12) * 15),
        pressure: getPressureVariation(i, 1035, 8),
        uvIndex: 0, // No UV in winter/snow
        cloudCover: getCloudCoverPattern(i, 90, 10), // Heavy overcast
        visibility: Math.round(Math.max(0.5, 3 - Math.abs(Math.sin(i * 0.4)) * 2)), // Poor visibility in snow
        description: 'heavy snow',
        icon: '13d'
      }
    }),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: getSeasonalTemperaturePattern(i, -15, 5),
      temperatureLow: getSeasonalTemperaturePattern(i, -35, 8),
      precipitationProbability: 85,
      precipitationIntensity: 0.5,
      windSpeed: 25 + Math.cos(i * 0.15) * 8,
      windDirection: 350 + Math.sin(i * 0.1) * 15,
      humidity: 80 + Math.cos(i * 0.3) * 10,
      uvIndex: 0,
      description: 'heavy snow',
      icon: '13d'
    }))
  },
  {
    id: 'hurricane',
    name: 'Hurricane Conditions',
    description: 'Severe storm with high winds and heavy rain',
    location: { lat: 25.7617, lng: -80.1918, name: 'Miami, FL' },
    currentWeather: {
      temperature: 78,
      feelsLike: 85,
      humidity: 95,
      pressure: 950,
      windSpeed: 85,
      windDirection: 90,
      visibility: 1,
      uvIndex: 0,
      description: 'heavy intensity rain',
      icon: '10d',
      timestamp: now
    },
    hourlyForecast: Array.from({ length: 24 }, (_, i) => {
      const temp = getDailyTemperatureCurve(i, 76, 4)
      return {
        timestamp: now + i * 3600,
        temperature: temp,
        feelsLike: temp + 9 + getDailyTemperatureCurve(i, 0, 2),
        humidity: getHumidityPattern(i, 92, 5),
        precipitationProbability: 100,
        precipitationIntensity: 1.5 + Math.cos(i * 0.4) * 0.8, // Heavy rain in inches
        precipitationType: 'rain',
        windSpeed: Math.round(75 + Math.sin(i * 0.25) * 15),
        windDirection: getWindDirectionShift(i, 90, 60),
        windGust: Math.round(100 + Math.sin(i * 0.2) * 20), // Hurricane force gusts
        pressure: getPressureVariation(i, 950, 10), // Very low pressure
        uvIndex: 0, // No UV during hurricane
        cloudCover: 100, // Complete overcast
        visibility: Math.round(Math.max(0.25, 1.5 - Math.abs(Math.sin(i * 0.5)) * 1)), // Very poor visibility
        description: 'heavy intensity rain',
        icon: '10d'
      }
    }),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: getSeasonalTemperaturePattern(i, 82, 3),
      temperatureLow: getSeasonalTemperaturePattern(i, 72, 3),
      precipitationProbability: 100,
      precipitationIntensity: 12 + Math.cos(i * 0.4) * 5,
      windSpeed: 85 + Math.sin(i * 0.2) * 10,
      windDirection: 90 + Math.sin(i * 0.1) * 40,
      humidity: 95 + Math.cos(i * 0.2) * 3,
      uvIndex: 0,
      description: 'heavy intensity rain',
      icon: '10d'
    }))
  },
  {
    id: 'diverse-weather',
    name: 'Variable Weather Week',
    description:
      'A week showing different weather patterns throughout each day - rain, sun, clouds, and snow',
    location: { lat: 40.7128, lng: -74.006, name: 'New York, NY' },
    currentWeather: {
      temperature: 65,
      feelsLike: 68,
      humidity: 70,
      pressure: 1015,
      windSpeed: 12,
      windDirection: 200,
      visibility: 8,
      uvIndex: 4,
      description: 'overcast clouds',
      icon: '04d',
      timestamp: now
    },
    hourlyForecast: Array.from({ length: 24 }, (_, i) => {
      // Create different weather patterns throughout the day
      let description = 'clear sky'
      let icon = '01d'
      let precipType: string | undefined = undefined
      let precipProb = 0
      let precipIntensity = 0
      let cloudCover = 20

      // Morning: Overcast and cool
      if (i >= 6 && i < 10) {
        description = 'overcast clouds'
        icon = '04d'
        cloudCover = 90
        precipProb = 20
      }
      // Late morning to early afternoon: Rain
      else if (i >= 10 && i < 14) {
        description = 'moderate rain'
        icon = '10d'
        precipType = 'rain'
        precipProb = 85
        precipIntensity = 0.3 + Math.random() * 0.4
        cloudCover = 95
      }
      // Mid afternoon: Clearing up
      else if (i >= 14 && i < 17) {
        description = 'partly cloudy'
        icon = '02d'
        cloudCover = 40
        precipProb = 10
      }
      // Late afternoon to evening: Sunny
      else if (i >= 17 && i < 20) {
        description = 'clear sky'
        icon = '01d'
        cloudCover = 10
        precipProb = 0
      }
      // Evening to night: Light snow (if cold enough)
      else if (i >= 20 || i < 6) {
        if (i >= 22 || i < 4) {
          description = 'light snow'
          icon = '13n'
          precipType = 'snow'
          precipProb = 60
          precipIntensity = 0.1 + Math.random() * 0.2
          cloudCover = 80
        } else {
          description = 'partly cloudy'
          icon = i < 6 ? '02n' : '02d'
          cloudCover = 50
          precipProb = 15
        }
      }

      const baseTemp = i < 6 ? 45 : getDailyTemperatureCurve(i, 65, 15)
      const temp = precipType === 'snow' ? Math.min(baseTemp, 35) : baseTemp

      return {
        timestamp: now + i * 3600,
        temperature: temp,
        feelsLike: temp + (precipType === 'rain' ? 5 : precipType === 'snow' ? -10 : 3),
        humidity: getHumidityPattern(
          i,
          precipType === 'rain' ? 85 : precipType === 'snow' ? 80 : 60,
          15
        ),
        precipitationProbability: precipProb,
        precipitationIntensity: precipIntensity,
        precipitationType: precipType,
        windSpeed: getWindSpeedVariation(i, 12, 6),
        windDirection: getWindDirectionShift(i, 200, 40),
        windGust: Math.round(15 + Math.cos(i * 0.2) * 8),
        pressure: getPressureVariation(i, 1015, 8),
        uvIndex: precipType ? 0 : getUVIndexCurve(i, 6),
        cloudCover: cloudCover,
        visibility:
          precipType === 'snow'
            ? Math.round(Math.max(2, 6 - Math.random() * 3))
            : precipType === 'rain'
              ? Math.round(Math.max(3, 8 - Math.random() * 4))
              : 10,
        description: description,
        icon: icon
      }
    }),
    dailyForecast: Array.from({ length: 7 }, (_, i) => {
      // Create varied daily forecasts
      const weatherPatterns = [
        {
          desc: 'light rain',
          icon: '10d',
          precipProb: 70,
          precipIntensity: 0.2,
          highTemp: 68,
          lowTemp: 52
        },
        {
          desc: 'sunny',
          icon: '01d',
          precipProb: 0,
          precipIntensity: 0,
          highTemp: 78,
          lowTemp: 58
        },
        {
          desc: 'partly cloudy',
          icon: '02d',
          precipProb: 20,
          precipIntensity: 0,
          highTemp: 72,
          lowTemp: 55
        },
        {
          desc: 'heavy rain',
          icon: '10d',
          precipProb: 95,
          precipIntensity: 0.8,
          highTemp: 65,
          lowTemp: 48
        },
        {
          desc: 'snow',
          icon: '13d',
          precipProb: 80,
          precipIntensity: 0.5,
          highTemp: 38,
          lowTemp: 25
        },
        {
          desc: 'clear sky',
          icon: '01d',
          precipProb: 5,
          precipIntensity: 0,
          highTemp: 75,
          lowTemp: 60
        },
        {
          desc: 'overcast clouds',
          icon: '04d',
          precipProb: 30,
          precipIntensity: 0,
          highTemp: 70,
          lowTemp: 54
        }
      ]

      const pattern = weatherPatterns[i]

      return {
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        timestamp: now + i * 86400,
        temperatureHigh: getSeasonalTemperaturePattern(i, pattern.highTemp, 5),
        temperatureLow: getSeasonalTemperaturePattern(i, pattern.lowTemp, 5),
        precipitationProbability: pattern.precipProb,
        precipitationIntensity: pattern.precipIntensity,
        windSpeed: 10 + Math.cos(i * 0.3) * 5,
        windDirection: 200 + Math.sin(i * 0.2) * 30,
        humidity:
          pattern.desc.includes('rain') || pattern.desc.includes('snow')
            ? 80 + Math.cos(i * 0.4) * 10
            : 60 + Math.cos(i * 0.4) * 15,
        uvIndex:
          pattern.desc === 'sunny' || pattern.desc === 'clear sky'
            ? 7
            : pattern.desc === 'partly cloudy'
              ? 4
              : 1,
        description: pattern.desc,
        icon: pattern.icon
      }
    })
  },
  {
    id: 'missing-data',
    name: 'Incomplete Data',
    description: 'API response with missing or null fields',
    location: { lat: 0, lng: 0, name: 'Unknown Location' },
    currentWeather: {
      temperature: 68,
      feelsLike: 68,
      humidity: 0,
      pressure: 0,
      windSpeed: 0,
      windDirection: 0,
      visibility: 0,
      uvIndex: 0,
      description: 'unknown',
      icon: '',
      timestamp: now
    },
    hourlyForecast: Array.from({ length: 8 }, (_, i) => ({
      timestamp: now + i * 3600,
      temperature: 65 + i * 2,
      feelsLike: 65 + i * 2,
      humidity: 0,
      precipitationProbability: 0,
      precipitationIntensity: 0,
      precipitationType: undefined,
      windSpeed: 0,
      windDirection: 0,
      windGust: 0,
      pressure: 0,
      uvIndex: 0,
      cloudCover: 0,
      visibility: 0,
      description: '',
      icon: ''
    })),
    dailyForecast: Array.from({ length: 3 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: i < 2 ? 70 + i * 5 : 0, // Missing data for day 3
      temperatureLow: i < 2 ? 50 + i * 3 : 0,
      precipitationProbability: 0,
      precipitationIntensity: 0,
      windSpeed: 0,
      windDirection: 0,
      humidity: 0,
      uvIndex: 0,
      description: i === 0 ? 'unknown' : '',
      icon: i === 0 ? '' : ''
    }))
  }
]

export const getMockScenario = (scenarioId: string): MockScenario | null => {
  return mockScenarios.find((scenario) => scenario.id === scenarioId) || null
}
