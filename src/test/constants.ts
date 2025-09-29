import type {
  Location,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  RecentLocation
} from '../types/weather'

export const TEST_LOCATIONS = {
  CHICAGO: {
    lat: 41.8781,
    lng: -87.6298,
    name: 'Chicago, IL'
  } as Location,

  NEW_YORK: {
    lat: 40.7128,
    lng: -74.006,
    name: 'New York, NY'
  } as Location,

  LAS_VEGAS: {
    lat: 36.1699,
    lng: -115.1398,
    name: 'Las Vegas, NV'
  } as Location,

  LONDON: {
    lat: 51.5074,
    lng: -0.1278,
    name: 'London, UK'
  } as Location,

  TOKYO: {
    lat: 35.6762,
    lng: 139.6503,
    name: 'Tokyo, Japan'
  } as Location
}

export const TEST_WEATHER_DATA = {
  CURRENT: {
    temperature: 75,
    feelsLike: 78,
    humidity: 60,
    pressure: 1013,
    windSpeed: 10,
    windDirection: 180,
    visibility: 10,
    uvIndex: 3,
    description: 'partly cloudy',
    icon: '02d',
    timestamp: 1234567890
  } as CurrentWeather,

  HOURLY_SAMPLE: {
    timestamp: 1234567890,
    temperature: 72,
    feelsLike: 75,
    humidity: 65,
    precipitationProbability: 20,
    precipitationIntensity: 0,
    windSpeed: 8,
    windDirection: 180,
    description: 'partly cloudy',
    icon: '02d'
  } as HourlyForecast,

  DAILY_SAMPLE: {
    date: '2022-01-01',
    timestamp: 1641024000,
    temperatureHigh: 78,
    temperatureLow: 65,
    precipitationProbability: 30,
    precipitationIntensity: 0.5,
    windSpeed: 12,
    windDirection: 180,
    humidity: 60,
    uvIndex: 4,
    description: 'partly cloudy',
    icon: '02d'
  } as DailyForecast
}

export const TEST_RECENT_LOCATIONS = {
  CHICAGO_RECENT: {
    ...TEST_LOCATIONS.CHICAGO,
    lastUsed: 1640995200000, // Jan 1, 2022
    usageCount: 5
  } as RecentLocation,

  NEW_YORK_RECENT: {
    ...TEST_LOCATIONS.NEW_YORK,
    lastUsed: 1640908800000, // Dec 31, 2021
    usageCount: 3
  } as RecentLocation,

  LAS_VEGAS_RECENT: {
    ...TEST_LOCATIONS.LAS_VEGAS,
    lastUsed: 1640822400000, // Dec 30, 2021
    usageCount: 1
  } as RecentLocation,

  LONDON_RECENT: {
    ...TEST_LOCATIONS.LONDON,
    lastUsed: 1640736000000, // Dec 29, 2021
    usageCount: 2
  } as RecentLocation,

  TOKYO_RECENT: {
    ...TEST_LOCATIONS.TOKYO,
    lastUsed: 1640649600000, // Dec 28, 2021
    usageCount: 1
  } as RecentLocation
}
