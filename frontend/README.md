# Position01 Frontend

This is the frontend application for Position01, built with Angular using standalone components.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

## Installation

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Development Server

Run the development server:
```
npm start
```

This will start the Angular development server at `http://localhost:4300`.

## Features

- Search for chapters using the `/api/recherche/chapitres` endpoint
- Display search results in a user-friendly format

## API Integration

The application connects to the Position01 backend API at `http://localhost:8080/api/recherche/chapitres`.

## Project Structure

- `src/app/app.component.ts` - The root component
- `src/app/app.routes.ts` - Application routing configuration
- `src/app/search/search.component.ts` - Component for searching chapters
- `src/app/services/search.service.ts` - Service for API communication

## Building for Production

To build the application for production:
```
npm run build
```

The build artifacts will be stored in the `dist/frontend` directory.
