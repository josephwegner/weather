import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { WeatherService } from '../shared/services/weatherService'
import { createSuccessResponse, createErrorResponse } from '../shared/utils/response'

// Lazy initialization for connection reuse (Lambda optimization)
let weatherService: WeatherService | null = null

function getWeatherService(): WeatherService {
  if (!weatherService) {
    weatherService = new WeatherService({
      apiKey: process.env.VISUAL_CROSSING_API_KEY!,
      baseUrl: process.env.VISUAL_CROSSING_BASE_URL!
    })
  }
  return weatherService
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Extract path parameters
    const lat = event.pathParameters?.lat
    const lng = event.pathParameters?.lng

    if (!lat || !lng) {
      return createErrorResponse(400, 'Missing lat or lng parameters')
    }

    // Call weather service
    const data = await getWeatherService().getCurrentWeather({ lat, lng })

    // Return success response with CORS headers
    return createSuccessResponse(data)
  } catch (error) {
    console.error('Error fetching current weather:', error)
    return createErrorResponse(500, 'Failed to fetch weather data', error)
  }
}
