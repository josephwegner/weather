# Personal Weather PWA

A personal weather Progressive Web App inspired by the Dark Sky interface, built with Vue 3, Vite, and Tailwind CSS.

## Features

- Clean, minimalist interface inspired by Dark Sky
- Current weather conditions
- 48-hour hourly forecast
- 10-day daily forecast
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

   Edit `.env` and add your OpenWeatherMap API key:
   ```
   VITE_OPENWEATHER_API_KEY=your_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Getting an API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Choose the "One Call API 3.0" (free tier includes 1,000 calls/day)
3. Copy your API key to the `.env` file

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint and auto-fix issues
- `npm run lint:check` - Check linting without fixing
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Open Vitest UI for interactive testing

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

- **Vue 3** - Frontend framework with Composition API
- **Vite** - Build tool and dev server
- **Pinia** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive maps (for radar functionality)
- **Workbox** - Service worker and PWA features

## Project Structure

```
src/
├── components/     # Vue components
├── stores/         # Pinia stores (weather state management)
├── services/       # API services and caching
│   ├── weatherApi.ts    # OpenWeatherMap API client
│   ├── cacheService.ts  # Response caching
│   └── mockData.ts      # Development mock scenarios
├── types/          # TypeScript type definitions
├── test/           # Unit tests (Vitest)
├── utils/          # Utility functions
└── assets/         # Static assets (CSS, images)
```

## Continuous Integration

GitHub Actions automatically run on commits to main:
- Linting and code formatting checks
- TypeScript type checking
- Unit test suite (29 tests)
- Production build verification
- Security audit

## Browser Compatibility

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+