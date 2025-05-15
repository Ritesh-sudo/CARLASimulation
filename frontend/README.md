# Robot Patrol Dashboard

A modern web application for managing and monitoring a fleet of autonomous security patrol robots.

## Features

- Real-time robot tracking and monitoring
- Interactive map interface with patrol routes
- Video feed and sensor data visualization
- Mission planning and scheduling
- Alert management and incident response
- User management with role-based access control
- Comprehensive analytics and reporting

## Technology Stack

- **Frontend**: React.js, Material UI, Redux, Chart.js
- **Maps**: Leaflet/React-Leaflet
- **3D Visualization**: Three.js
- **Real-time Communication**: Socket.io
- **API Communication**: Axios

## Getting Started

1. Install dependencies:

   ```
   npm install
   ```

2. Start development server:

   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Main application pages
- `src/redux`: State management with Redux
- `src/services`: API and service integrations
- `src/utils`: Helper functions and utilities
- `src/assets`: Static assets (images, icons)

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=https://your-backend-api.com/api
REACT_APP_SOCKET_URL=https://your-backend-api.com
```

## License

[MIT](LICENSE)
