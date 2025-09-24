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
    hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
      timestamp: now + i * 3600,
      temperature: 72 + Math.sin(i * 0.3) * 10,
      feelsLike: 75 + Math.sin(i * 0.3) * 10,
      humidity: 65 + Math.cos(i * 0.2) * 15,
      precipitationProbability: Math.max(0, Math.sin(i * 0.4) * 30),
      precipitationIntensity: 0,
      windSpeed: 8 + Math.cos(i * 0.1) * 5,
      windDirection: 180 + Math.sin(i * 0.1) * 45,
      description: i < 12 ? 'partly cloudy' : 'clear sky',
      icon: i < 12 ? '02d' : '01n'
    })),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: 78 + Math.sin(i * 0.5) * 8,
      temperatureLow: 58 + Math.sin(i * 0.5) * 6,
      precipitationProbability: Math.max(0, Math.sin(i * 0.7) * 40),
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
    hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
      timestamp: now + i * 3600,
      temperature: 110 + Math.sin(i * 0.26) * 8,
      feelsLike: 120 + Math.sin(i * 0.26) * 10,
      humidity: 8 + Math.abs(Math.sin(i * 0.3) * 5),
      precipitationProbability: 0,
      precipitationIntensity: 0,
      windSpeed: 12 + Math.cos(i * 0.2) * 8,
      windDirection: 225 + Math.sin(i * 0.15) * 30,
      description: 'clear sky',
      icon: i >= 6 && i <= 18 ? '01d' : '01n'
    })),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: 118 + Math.sin(i * 0.3) * 5,
      temperatureLow: 95 + Math.sin(i * 0.3) * 8,
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
    hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
      timestamp: now + i * 3600,
      temperature: -20 + Math.sin(i * 0.1) * 8,
      feelsLike: -40 + Math.sin(i * 0.1) * 12,
      humidity: 75 + Math.cos(i * 0.2) * 10,
      precipitationProbability: 85,
      precipitationIntensity: 0.5,
      windSpeed: 20 + Math.cos(i * 0.15) * 10,
      windDirection: 350 + Math.sin(i * 0.1) * 20,
      description: 'heavy snow',
      icon: '13d'
    })),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: -15 + Math.sin(i * 0.2) * 5,
      temperatureLow: -35 + Math.sin(i * 0.2) * 8,
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
    hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
      timestamp: now + i * 3600,
      temperature: 76 + Math.sin(i * 0.2) * 4,
      feelsLike: 85 + Math.sin(i * 0.2) * 6,
      humidity: 92 + Math.cos(i * 0.3) * 5,
      precipitationProbability: 100,
      precipitationIntensity: 15 + Math.cos(i * 0.4) * 8,
      windSpeed: 75 + Math.sin(i * 0.25) * 15,
      windDirection: 90 + Math.sin(i * 0.1) * 60,
      description: 'heavy intensity rain',
      icon: '10d'
    })),
    dailyForecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      timestamp: now + i * 86400,
      temperatureHigh: 82 + Math.sin(i * 0.3) * 3,
      temperatureLow: 72 + Math.sin(i * 0.3) * 3,
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
      windSpeed: 0,
      windDirection: 0,
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

export const getRandomScenario = (): MockScenario => {
  const randomIndex = Math.floor(Math.random() * mockScenarios.length)
  return mockScenarios[randomIndex]
}
