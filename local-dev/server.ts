import dotenv from 'dotenv'

// Load environment variables FIRST before importing anything else
dotenv.config()

import express from 'express'
import cors from 'cors'
import { simulateLambda } from 'family-paas/lambda-simulator'

// Import Lambda handlers (after dotenv.config())
import { handler as currentHandler } from '../lambdas/get-current-weather/index'
import { handler as hourlyHandler } from '../lambdas/get-hourly-forecast/index'
import { handler as dailyHandler } from '../lambdas/get-daily-forecast/index'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Local dev server running' })
})

// Simulate Lambda invocations with API Gateway event structure
app.get('/api/weather/current/:lat/:lng', async (req, res) => {
  await simulateLambda(currentHandler, req, res)
})

app.get('/api/weather/hourly/:lat/:lng/:date', async (req, res) => {
  await simulateLambda(hourlyHandler, req, res)
})

app.get('/api/weather/daily/:lat/:lng/:startDate/:endDate', async (req, res) => {
  await simulateLambda(dailyHandler, req, res)
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local dev server running on http://localhost:${PORT}`)
  console.log(`📦 Simulating Lambda + API Gateway locally`)
  console.log(`\nEndpoints:`)
  console.log(`  GET /api/weather/current/:lat/:lng`)
  console.log(`  GET /api/weather/hourly/:lat/:lng/:date`)
  console.log(`  GET /api/weather/daily/:lat/:lng/:startDate/:endDate`)
})
