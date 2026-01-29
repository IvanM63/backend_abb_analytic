# MilvusDB Integration

This feature provides CRUD operations for MilvusDB integration in the RedDoorz Analytics Backend.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# MilvusDB Configuration
MILVUS_HOST=172.30.5.103
MILVUS_PORT=19530
MILVUS_USERNAME=
MILVUS_PASSWORD=
MILVUS_SSL=false
```

## Available Routes

### Base URL: `/milvus`

#### 1. List All Collections

- **GET** `/milvus/collections`
- **Description**: Retrieve all available collections in MilvusDB
- **Response**: Array of collection information

#### 2. Get All Data from Collection

- **GET** `/milvus/:collectionId/data`
- **Parameters**:
  - `collectionId` (path) - Collection name
  - `limit` (query, optional) - Number of records to return (default: 100, max: 1000)
- **Description**: Retrieve all data from a specific collection
- **Response**: Array of data records from the collection

#### 3. Get Data by ID

- **GET** `/milvus/:collectionId/data/:id`
- **Parameters**:
  - `collectionId` (path) - Collection name
  - `id` (path) - Data ID (string or number)
- **Description**: Retrieve specific data by ID from a collection
- **Response**: Single data record

#### 4. Delete Data by ID

- **DELETE** `/milvus/:collectionId/data/:id`
- **Parameters**:
  - `collectionId` (path) - Collection name
  - `id` (path) - Data ID (string or number)
- **Description**: Delete specific data by ID from a collection
- **Response**: Deletion confirmation with count

#### 5. Get Collection Info

- **GET** `/milvus/:collectionId/info`
- **Parameters**:
  - `collectionId` (path) - Collection name
- **Description**: Get collection metadata, schema, and statistics
- **Response**: Collection information object

## Example Usage

### List Collections

```bash
GET http://localhost:5000/milvus/collections
```

### Get All Data from Collection

```bash
GET http://localhost:5000/milvus/my_collection/data?limit=50
```

### Get Specific Data

```bash
GET http://localhost:5000/milvus/my_collection/data/123
```

### Delete Data

```bash
DELETE http://localhost:5000/milvus/my_collection/data/123
```

### Get Collection Info

```bash
GET http://localhost:5000/milvus/my_collection/info
```

## Response Format

All responses follow this structure:

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string (if success is false)
}
```

## Error Handling

- **400**: Bad Request - Invalid parameters
- **404**: Not Found - Collection or data not found
- **500**: Internal Server Error - Database or connection issues

## File Structure

```
src/features/milvus/
├── controller.ts    # Request handlers and validation
├── service.ts      # Business logic and MilvusDB operations
└── routes.ts       # Route definitions

src/config/
└── milvus.ts       # Database connection configuration
```

## Dependencies

- `@zilliz/milvus2-sdk-node`: MilvusDB Node.js SDK (already installed)
- Connection management with automatic reconnection
- Comprehensive error handling and logging
