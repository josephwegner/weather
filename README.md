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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

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
├── stores/         # Pinia stores
├── services/       # API services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── assets/         # Static assets (CSS, images)
```