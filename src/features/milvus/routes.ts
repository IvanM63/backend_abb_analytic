import { Router } from 'express';
import {
  getAllDataByCollectionId,
  getDataByIdAndCollectionId,
  deleteDataByIdAndCollectionId,
  getCollectionInfo,
  listCollections,
  createDataByCollectionId,
} from './controllers/milvus-controller';

const router = Router();

/**
 * @route GET /api/milvus/collections
 * @description List all available collections in MilvusDB
 * @access Public
 * @returns {Object} List of collections
 */
router.get('/collections', listCollections);

/**
 * @route GET /api/milvus/:collectionId/data
 * @description Get all data from a specific collection
 * @access Public
 * @param {string} collectionId - The name of the collection
 * @param {number} [limit=100] - Maximum number of records to return (max: 1000)
 * @returns {Object} Array of data from the collection
 */
router.get('/:collectionId/data', getAllDataByCollectionId);

/**
 * @route POST /api/milvus/:collectionId/data
 * @description Create new data in a specific collection
 * @access Public
 * @param {string} collectionId - The name of the collection
 * @body {Object} data - Data to insert with registered_face_id, gender, age, embedding, user_id
 * @returns {Object} Insertion confirmation with inserted ID
 */
router.post('/:collectionId/data', createDataByCollectionId);

/**
 * @route GET /api/milvus/:collectionId/data/:id
 * @description Get specific data by ID from a collection
 * @access Public
 * @param {string} collectionId - The name of the collection
 * @param {string|number} id - The ID of the data to retrieve
 * @returns {Object} Single data record
 */
router.get('/:collectionId/data/:id', getDataByIdAndCollectionId);

/**
 * @route DELETE /api/milvus/:collectionId/data/:id
 * @description Delete specific data by ID from a collection
 * @access Public
 * @param {string} collectionId - The name of the collection
 * @param {string|number} id - The ID of the data to delete
 * @returns {Object} Deletion confirmation
 */
router.delete('/:collectionId/data/:id', deleteDataByIdAndCollectionId);

/**
 * @route GET /api/milvus/:collectionId/info
 * @description Get collection information including schema and statistics
 * @access Public
 * @param {string} collectionId - The name of the collection
 * @returns {Object} Collection metadata and statistics
 */
router.get('/:collectionId/info', getCollectionInfo);

export default router;
