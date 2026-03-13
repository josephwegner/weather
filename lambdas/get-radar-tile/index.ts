import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { WeatherService } from '../shared/services/weatherService'
import { createErrorResponse } from 'family-paas/lambda-response'

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
  try {
    const qs = event.queryStringParameters || {}
    const { element, z, x, y, time } = qs

    if (!element || !z || !x || !y || !time) {
      return createErrorResponse(400, 'Missing required query parameters: element, z, x, y, time')
    }

    const result = await getWeatherService().getRadarTile({
      element,
      z: Number(z),
      x: Number(x),
      y: Number(y),
      time
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=900',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: Buffer.from(result.data).toString('base64'),
      isBase64Encoded: true
    }
  } catch (error) {
    console.error('Error fetching radar tile:', error)
    return createErrorResponse(500, 'Failed to fetch radar tile', error)
  }
}
