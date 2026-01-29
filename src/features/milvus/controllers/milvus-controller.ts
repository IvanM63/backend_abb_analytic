import { Request, Response } from 'express';
import milvusService, { MilvusResponse } from '../service';

export interface MilvusRequest extends Request {
  params: {
    collectionId: string;
    id?: string;
  };
  query: {
    limit?: string;
  };
  body: {
    registered_face_id?: string;
    gender?: string;
    age?: string;
    embedding?: number[];
    user_id?: string;
  };
}

/**
 * GET /api/milvus/:collectionId/data
 * Get all data from a specific collection
 */
export const getAllDataByCollectionId = async (
  req: MilvusRequest,
  res: Response
): Promise<void> => {
  try {
    const { collectionId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    if (!collectionId) {
      res.status(400).json({
        success: false,
        error: 'Collection ID is required',
      });
      return;
    }

    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      res.status(400).json({
        success: false,
        error: 'Limit must be a number between 1 and 1000',
      });
      return;
    }

    const result = await milvusService.getAllDataByCollectionId(
      collectionId,
      limit
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        collection: collectionId,
        totalRecords: result.data?.length || 0,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        collection: collectionId,
      });
    }
  } catch (error) {
    console.error('Controller error in getAllDataByCollectionId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * GET /api/milvus/:collectionId/data/:id
 * Get specific data by ID from a collection
 */
export const getDataByIdAndCollectionId = async (
  req: MilvusRequest,
  res: Response
): Promise<void> => {
  try {
    const { collectionId, id } = req.params;

    if (!collectionId || !id) {
      res.status(400).json({
        success: false,
        error: 'Collection ID and Data ID are required',
      });
      return;
    }

    const result = await milvusService.getDataByIdAndCollectionId(
      collectionId,
      id
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        collection: collectionId,
        registered_face_id: id,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        collection: collectionId,
        id: id,
      });
    }
  } catch (error) {
    console.error('Controller error in getDataByIdAndCollectionId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * DELETE /api/milvus/:collectionId/data/:id
 * Delete specific data by ID from a collection
 */
export const deleteDataByIdAndCollectionId = async (
  req: MilvusRequest,
  res: Response
): Promise<void> => {
  try {
    const { collectionId, id } = req.params;

    if (!collectionId || !id) {
      res.status(400).json({
        success: false,
        error: 'Collection ID and Data ID are required',
      });
      return;
    }

    // Try to parse ID as number if possible, otherwise keep as string
    // const parsedId = isNaN(Number(id)) ? id : Number(id);
    const parsedId = id;

    const result =
      await milvusService.deleteDataByRegisteredFaceIdAndCollectionId(
        collectionId,
        parsedId
      );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        collection: collectionId,
        id: parsedId,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        collection: collectionId,
        id: parsedId,
      });
    }
  } catch (error) {
    console.error('Controller error in deleteDataByIdAndCollectionId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * GET /api/milvus/:collectionId/info
 * Get collection information
 */
export const getCollectionInfo = async (
  req: MilvusRequest,
  res: Response
): Promise<void> => {
  try {
    const { collectionId } = req.params;

    if (!collectionId) {
      res.status(400).json({
        success: false,
        error: 'Collection ID is required',
      });
      return;
    }

    const result = await milvusService.getCollectionInfo(collectionId);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        collection: collectionId,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        collection: collectionId,
      });
    }
  } catch (error) {
    console.error('Controller error in getCollectionInfo:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * GET /api/milvus/collections
 * List all collections
 */
export const listCollections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await milvusService.listCollections();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        totalCollections: result.data?.length || 0,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Controller error in listCollections:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * POST /api/milvus/:collectionId/data
 * Create new data in a specific collection
 */
export const createDataByCollectionId = async (
  req: MilvusRequest,
  res: Response
): Promise<void> => {
  try {
    const { collectionId } = req.params;
    const { registered_face_id, gender, age, embedding, user_id } = req.body;

    if (!collectionId) {
      res.status(400).json({
        success: false,
        error: 'Collection ID is required',
      });
      return;
    }

    // Validate required fields
    if (!registered_face_id || !gender || !age || !embedding || !user_id) {
      res.status(400).json({
        success: false,
        error:
          'All fields are required: registered_face_id, gender, age, embedding, user_id',
      });
      return;
    }

    // Validate embedding is array of numbers
    if (
      !Array.isArray(embedding) ||
      !embedding.every((val) => typeof val === 'number')
    ) {
      res.status(400).json({
        success: false,
        error: 'Embedding must be an array of numbers',
      });
      return;
    }

    const result = await milvusService.createDataByCollectionId(collectionId, {
      registered_face_id,
      gender,
      age,
      embedding,
      user_id,
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
        collection: collectionId,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        collection: collectionId,
      });
    }
  } catch (error) {
    console.error('Controller error in createDataByCollectionId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
