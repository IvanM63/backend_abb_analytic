# Weapon Detection API Routes

This document outlines all the weapon detection API endpoints following the same pattern as activity monitoring.

## Base URL

`/product/weapon-detection`

## Authentication

- Most endpoints require JWT authentication via `Authorization: Bearer <token>` header
- Create endpoint uses `X-Security-Token` header (general token)
- Latest day endpoint doesn't require authentication

## Endpoints

### CRUD Operations

#### Get All Weapon Detections

- **GET** `/product/weapon-detection`
- **Auth**: Required (JWT)
- **Query Params**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `search` (optional): Search in weapon_type field
  - `sortBy` (optional): Sort field (id, weapon_type, confidence, datetime_send, created_at, updated_at)
  - `sortOrder` (optional): Sort direction (asc, desc)
  - `cctvId` (optional): Filter by CCTV ID
  - `primaryAnalyticsId` (optional): Filter by Primary Analytics ID

#### Get Weapon Detection by ID

- **GET** `/product/weapon-detection/:id`
- **Auth**: Required (JWT)
- **Path Params**: `id` - Weapon Detection ID

#### Create Weapon Detection

- **POST** `/product/weapon-detection`
- **Auth**: Required (Security Token)
- **Headers**: `X-Security-Token: <token>`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `primaryAnalyticsId` (required): Primary Analytics ID
  - `cctvId` (required): CCTV ID
  - `weaponType` (required): Type of weapon detected
  - `confidence` (required): Detection confidence (0-1)
  - `captureImg` (optional): Image file
  - `datetime_send` (optional): Detection timestamp (YYYY-MM-DD HH:MM:SS)

#### Update Weapon Detection

- **PUT** `/product/weapon-detection/:id`
- **Auth**: Required (JWT)
- **Content-Type**: `multipart/form-data`
- **Body**: Same as create (all fields optional)

#### Delete Weapon Detection

- **DELETE** `/product/weapon-detection/:id`
- **Auth**: Required (JWT)
- **Path Params**: `id` - Weapon Detection ID

### Analytics/Charts

#### Daily Chart Data

- **GET** `/product/weapon-detection/charts/daily`
- **Auth**: Required (JWT)
- **Query Params**:
  - `cctvId` (required): CCTV ID
  - `primaryAnalyticsId` (required): Primary Analytics ID
  - `startDate` (required): Start date (YYYY-MM-DD)
  - `endDate` (required): End date (YYYY-MM-DD)

#### Weapon Types Summary

- **GET** `/product/weapon-detection/charts/weapon-types-summary`
- **Auth**: Required (JWT)
- **Query Params**:
  - `cctvId` (required): CCTV ID
  - `primaryAnalyticsId` (required): Primary Analytics ID
  - `startDate` (required): Start date (YYYY-MM-DD)
  - `endDate` (required): End date (YYYY-MM-DD)

### Latest Day Data

- **GET** `/product/weapon-detection/latest-day`
- **Auth**: None required
- **Query Params**:
  - `cctvId` (required): CCTV ID
  - `primaryAnalyticsId` (required): Primary Analytics ID

### Export

#### Export to Excel

- **GET** `/product/weapon-detection/export/all`
- **Auth**: Required (JWT)
- **Query Params**:
  - `startDate` (required): Start date (YYYY-MM-DD)
  - `endDate` (required): End date (YYYY-MM-DD)
  - `weaponType` (optional): Filter by weapon type(s)
  - `cctvId` (optional): Filter by CCTV ID
  - `primaryAnalyticsId` (optional): Filter by Primary Analytics ID
- **Response**: Excel file download

## Data Models

### Weapon Detection Record

```json
{
  "id": 1,
  "primaryAnalyticsId": 1,
  "cctvId": 1,
  "weaponType": "pistol",
  "captureImg": "http://example.com/image.jpg",
  "confidence": 0.95,
  "datetimeSend": "2025-10-03T10:30:00.000Z",
  "createdAt": "2025-10-03T10:30:00.000Z",
  "updatedAt": "2025-10-03T10:30:00.000Z",
  "primaryAnalytics": {
    "id": 1,
    "name": "Weapon Detection Model",
    "status": "active"
  },
  "cctv": {
    "id": 1,
    "cctv_name": "Camera 01",
    "is_active": true
  }
}
```

## Weapon Types

The system supports the following weapon types:

- `pistol`
- `rifle`
- `knife`
- `grenade`
- `machine_gun`

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Array of validation errors (when applicable)
}
```

## Success Responses

All endpoints return consistent success responses:

```json
{
  "success": true,
  "message": "Success message",
  "data": {} // Response data
}
```
