export type RadarElement = 'precipcomposite' | 'temp' | 'wind' | 'windspeed' | 'alerts'

export interface RadarElementOption {
  key: RadarElement
  label: string
}

export interface RadarFrame {
  time: string
  imageUrl: string
  loaded: boolean
}
