# Personal Weather PWA

A personal weather Progressive Web App inspired by the Dark Sky interface, built with Vue 3, Vite, and Tailwind CSS.

## Features

- Clean, minimalist interface inspired by Dark Sky
- Current weather conditions
- 7-day hourly forecast (lazy-loaded by day)
- 7-day daily forecast
- Interactive radar maps
- Progressive Web App (PWA) with offline support
- Responsive design optimized for mobile

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Visual Crossing API key:
   ```
   VISUAL_CROSSING_API_KEY=your_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev:full
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Getting an API Key

1. Sign up at [Visual Crossing Weather API](https://www.visualcrossing.com/weather-api)
2. Choose the free tier (1,000 records/day)
3. Copy your API key to the `.env` file

### Cost-Efficient Usage
The app uses a lazy-loading strategy to minimize API costs:
- Daily forecasts: Single request for 7-day overview (7 records)
- Hourly details: On-demand requests when tapping a day (24 records per day)

## Development Commands

### Core Development
- `npm run dev` - Start client development server only
- `npm run dev:server` - Start server only
- `npm run dev:full` - Start both client and server with hot reload
- `npm run build` - Build client and server for production
- `npm start` - Run production server
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint and auto-fix issues
- `npm run lint:check` - Check linting without fixing
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run client tests in watch mode
- `npm run test:ui` - Open Vitest UI for interactive testing
- `npm run test:all` - Run all tests (client + server) once
- `npm run test:client` - Run client-side tests once
- `npm run test:client:watch` - Run client tests in watch mode
- `npm run test:server` - Run server-side tests once
- `npm run test:server:watch` - Run server tests in watch mode

## Development Features

### Mock Data & Offline Development
The app includes a comprehensive development system for testing different weather scenarios:

```javascript
// Switch to mock mode for testing extreme conditions
weatherApi.setDevMode({
  mode: 'mock',
  mockScenarioId: 'hurricane'
})

// Available scenarios:
// - 'normal-chicago' - Typical weather with complete data
// - 'extreme-heat' - Desert conditions (118°F)
// - 'extreme-cold' - Arctic conditions (-25°F)
// - 'hurricane' - Severe storm with 85mph winds
// - 'missing-data' - Incomplete API response
```

### Development Modes
- **`production`** - Standard API calls only
- **`cache-first`** - Use cached data when available (default in dev)
- **`mock`** - Use predefined mock scenarios
- **`offline`** - Only use cached data, no API calls

### Cache System
- Automatically caches API responses for 10 minutes
- Reduces API calls during development
- View cache stats with `cacheService.getCacheStats()`

### Testing Edge Cases
The mock system includes scenarios for:
- Extreme temperatures and weather conditions
- Missing or incomplete API data
- Network timeouts and API errors
- High wind speeds and severe weather alerts

## Architecture

### Client (Frontend)
- **Vue 3** - Frontend framework with Composition API
- **Vite** - Build tool and dev server
- **Pinia** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive maps (for radar functionality)
- **Workbox** - Service worker and PWA features

### Server (Backend)
- **Express** - Node.js web server
- **TypeScript** - Type-safe server code
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variable management

## Project Structure

```
src/                    # Client-side Vue application
├── components/         # Vue components
├── stores/             # Pinia stores (weather state management)
├── services/           # API services and caching
│   ├── weatherApi.ts   # Server API client (calls /api endpoints)
│   ├── cacheService.ts # Response caching
│   └── mockData.ts     # Development mock scenarios
├── types/              # TypeScript type definitions
├── test/               # Unit tests (Vitest)
├── utils/              # Utility functions
└── assets/             # Static assets (CSS, images)

server/                 # Express server
├── server.ts           # Main server file with API routes
├── tsconfig.json       # Server TypeScript configuration
└── dist/               # Compiled server files (generated)
```

## Continuous Integration

GitHub Actions automatically run on commits to main:
- Linting and code formatting checks
- TypeScript type checking
- Complete test suite (client + server)
- Production build verification
- Security audit

## Browser Compatibility

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+