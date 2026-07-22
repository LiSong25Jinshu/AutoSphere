<<<<<<< HEAD
# AutoSphere Web

AutoSphere Web is a comprehensive automotive platform that integrates vehicle sales, rentals, maintenance booking, and car wash services into a unified web application. The system leverages AI-powered recommendations to enhance user decision-making and provides seamless communication between customers, dealers, and service providers.

## Features

- **Vehicle Marketplace**: Browse and search vehicles for sale or rental
- **AI Recommendations**: Personalized vehicle suggestions based on preferences
- **Service Booking**: Schedule maintenance and car wash appointments
- **Real-time Communication**: Chat with dealers and service providers
- **Multi-role Support**: User, Dealer, Service Provider, and Admin roles
- **Responsive Design**: Optimized for all devices and screen sizes

## Tech Stack

### Frontend
- React.js 18+ with Vite
- Material-UI for components
- React Router for navigation
- React Query for state management
- Socket.io for real-time features

### Backend
- Node.js with Express.js
- PostgreSQL with Sequelize ORM
- Redis for caching and sessions
- Socket.io for real-time communication
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd autosphere-web
   \`\`\`

2. Install dependencies for all packages:
   \`\`\`bash
   npm run install:all
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database and Redis credentials
   \`\`\`

4. Set up the database:
   \`\`\`bash
   # Create PostgreSQL database
   createdb autosphere_db
   
   # Run migrations (when available)
   cd backend && npm run db:migrate
   \`\`\`

5. Start the development servers:
   \`\`\`bash
   npm run dev
   \`\`\`

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:5000

### Available Scripts

- \`npm run dev\` - Start both frontend and backend in development mode
- \`npm run build\` - Build both frontend and backend for production
- \`npm run test\` - Run tests for both frontend and backend
- \`npm run install:all\` - Install dependencies for all packages

## Project Structure

\`\`\`
autosphere-web/
├── frontend/                 # React.js frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Utility functions
│   │   └── test/           # Test setup and utilities
│   ├── public/             # Static assets
│   └── package.json
├── backend/                  # Node.js/Express backend API
│   ├── src/
│   │   ├── config/         # Database and service configurations
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   └── package.json
├── .env.example             # Environment variables template
└── package.json            # Root package.json for scripts
\`\`\`

## Development Guidelines

### Code Style
- ESLint and Prettier are configured for both frontend and backend
- Run \`npm run lint:fix\` and \`npm run format\` to fix code style issues

### Testing
- Frontend: Vitest with React Testing Library
- Backend: Vitest with Supertest for API testing
- Run \`npm run test\` to execute all tests

### Database
- Use Sequelize migrations for database schema changes
- Run \`npm run db:migrate\` to apply migrations
- Run \`npm run db:reset\` to reset and reseed the database

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/your-feature-name\`
3. Make your changes and add tests
4. Run tests and linting: \`npm run test && npm run lint\`
5. Commit your changes: \`git commit -am 'Add some feature'\`
6. Push to the branch: \`git push origin feature/your-feature-name\`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
=======
# AutoSphere
AI-based car management system
>>>>>>> d4f5c6938c25ae0738854c52aeca44d9c4945952
