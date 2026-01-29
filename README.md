# Backend RedDoorz Analytic

Backend API untuk sistem analytic RedDoorz yang mengelola data hotel, CCTV, server, dan analytics.

## Documentation

### API Documentation

- [Auth API](docs/API_DOCS.md)
- [Cookie API](docs/API_DOCS_COOKIE.md)
- [Hotel API](docs/HOTEL_API_DOCS.md)
- [Server API](docs/SERVER_API_DOCS.md)
- [Type Analytics API](docs/TYPE_ANALYTIC_API_DOCS.md)
- [CCTV API](docs/CCTV_API_DOCS.md)
- [Customer Counting API](docs/CUSTOMER_COUNTING_API_DOCS.md)

### Setup & Configuration

- [Database Seeding Guide](docs/DATABASE_SEEDING_GUIDE.md)
- [CCTV File Upload Setup](docs/CCTV_FILE_UPLOAD_SETUP.md)
- [Security & Registration Guide](docs/REGISTRATION_SECURITY_GUIDE.md)
- [Security Token Guide](docs/SECURITY_TOKEN_GUIDE.md)

### Development Guides

- [Jest Testing Guide](docs/JEST_TESTING_GUIDE.md)
- [Validation Guide](docs/VALIDATION_GUIDE.md)
- [Pagination & Search Guide](docs/PAGINATION_SEARCH_GUIDE.md)
- [Modular Pagination README](docs/MODULAR_PAGINATION_README.md)
- [Sorting Usage Examples](docs/SORTING_USAGE_EXAMPLES.md)

### Implementation Notes

- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)
- [Type Analytic Seeding](docs/TYPE_ANALYTIC_SEEDING.md)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Setup database:

```bash
npx prisma migrate dev
npx prisma db seed
```

3. Start development server:

```bash
npm run dev
```

## Available Endpoints

- `/auth` - Authentication endpoints
- `/hotel` - Hotel management
- `/server` - Server management
- `/power-sensor` - Power sensor analytics (daily and monthly chart data)
- `/cctv` - CCTV management
- `/type-analytic` - Type analytics management
- `/product` - Product management
