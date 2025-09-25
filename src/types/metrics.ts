export type MetricType =
  | 'temperature'
  | 'feelsLike'
  | 'precipitationProbability'
  | 'precipitationIntensity'
  | 'humidity'
  | 'windSpeed'
  | 'windGust'
  | 'pressure'
  | 'uvIndex'
  | 'cloudCover'
  | 'visibility'

export interface MetricOption {
  key: MetricType
  label: string
  unit: string
}
