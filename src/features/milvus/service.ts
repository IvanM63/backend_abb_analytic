import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import milvusDB from '../../config/milvus';

export interface MilvusData {
  id: string | number;
  vector?: number[];
  [key: string]: any;
}

export interface MilvusQueryResult {
  id: string | number;
  score?: number;
  data: any;
}

export interface MilvusResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class MilvusService {
  private async getClient(): Promise<MilvusClient> {
    return await milvusDB.ensureConnection();
  }

  /**
   * Get all data from a specific collection
   */
  async getAllDataByCollectionId(
    collectionName: string,
    limit: number = 100
  ): Promise<MilvusResponse<MilvusQueryResult[]>> {
    try {
      const client = await this.getClient();

      // Check if collection exists
      const hasCollection = await client.hasCollection({
        collection_name: collectionName,
      });

      if (!hasCollection.value) {
        return {
          success: false,
          error: `Collection '${collectionName}' does not exist`,
        };
      }

      // Load collection if not loaded
      await client.loadCollection({
        collection_name: collectionName,
      });

      // Query all data from collection
      const queryResult = await client.query({
        collection_name: collectionName,
        filter: '',
        output_fields: ['*'],
        limit: limit,
      });

      return {
        success: true,
        data: queryResult.data.map((item: any) => ({
          id: item.id || item._id,
          data: item,
        })),
        message: `Retrieved ${queryResult.data.length} records from collection '${collectionName}'`,
      };
    } catch (error) {
      console.error('Error getting all data from collection:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get specific data by ID from a collection
   */
  async getDataByIdAndCollectionId(
    collectionName: string,
    registered_face_id: string | number
  ): Promise<MilvusResponse<MilvusQueryResult>> {
    try {
      const client = await this.getClient();

      // Check if collection exists
      const hasCollection = await client.hasCollection({
        collection_name: collectionName,
      });

      if (!hasCollection.value) {
        return {
          success: false,
          error: `Collection '${collectionName}' does not exist`,
        };
      }

      // Load collection if not loaded
      await client.loadCollection({
        collection_name: collectionName,
      });

      // Query specific data by ID
      const queryResult = await client.query({
        collection_name: collectionName,
        filter: `registered_face_id == ${typeof registered_face_id === 'string' ? `"${registered_face_id}"` : registered_face_id}`,
        output_fields: ['*'],
        limit: 1,
      });

      if (queryResult.data.length === 0) {
        return {
          success: false,
          error: `Data with registered_face_id '${registered_face_id}' not found in collection '${collectionName}'`,
        };
      }

      const item = queryResult.data[0];
      return {
        success: true,
        data: {
          id: item.id || item._id,
          data: item,
        },
        message: `Retrieved data with registered_face_id '${registered_face_id}' from collection '${collectionName}'`,
      };
    } catch (error) {
      console.error('Error getting data by registered_face_id:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete specific data by registered_face_id from a collection
   */
  async deleteDataByRegisteredFaceIdAndCollectionId(
    collectionName: string,
    registered_face_id: string | number
  ): Promise<MilvusResponse<{ deletedCount: number }>> {
    try {
      const client = await this.getClient();

      // Check if collection exists
      const hasCollection = await client.hasCollection({
        collection_name: collectionName,
      });

      if (!hasCollection.value) {
        return {
          success: false,
          error: `Collection '${collectionName}' does not exist`,
        };
      }

      // Check if data exists first
      const existingData = await this.getDataByIdAndCollectionId(
        collectionName,
        registered_face_id
      );
      if (!existingData.success) {
        return {
          success: false,
          error: `Data with registered_face_id '${registered_face_id}' not found in collection '${collectionName}'`,
        };
      }

      // Delete data by registered_face_id
      const deleteResult = await client.deleteEntities({
        collection_name: collectionName,
        filter: `registered_face_id == ${typeof registered_face_id === 'string' ? `"${registered_face_id}"` : registered_face_id}`,
      });

      return {
        success: true,
        data: {
          deletedCount:
            typeof deleteResult.delete_cnt === 'number'
              ? deleteResult.delete_cnt
              : 1,
        },
        message: `Successfully deleted data with registered_face_id '${registered_face_id}' from collection '${collectionName}'`,
      };
    } catch (error) {
      console.error('Error deleting data by registered_face_id:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create/Insert new data into a collection
   */
  async createDataByCollectionId(
    collectionName: string,
    data: {
      registered_face_id: string;
      gender: string;
      age: string;
      embedding: number[];
      user_id: string;
    }
  ): Promise<MilvusResponse<{ insertedId: string }>> {
    try {
      const client = await this.getClient();

      // Check if collection exists
      const hasCollection = await client.hasCollection({
        collection_name: collectionName,
      });

      if (!hasCollection.value) {
        return {
          success: false,
          error: `Collection '${collectionName}' does not exist`,
        };
      }

      // Load collection if not loaded
      await client.loadCollection({
        collection_name: collectionName,
      });

      // Prepare data for insertion
      const insertData = {
        registered_face_id: data.registered_face_id,
        gender: data.gender,
        age: data.age,
        embedding: data.embedding,
        user_id: data.user_id,
      };

      // Insert data into collection
      const insertResult = await client.insert({
        collection_name: collectionName,
        data: [insertData],
      });

      if (insertResult.status.error_code !== 'Success') {
        return {
          success: false,
          error: `Failed to insert data: ${insertResult.status.reason}`,
        };
      }

      return {
        success: true,
        data: {
          insertedId: data.registered_face_id,
        },
        message: `Successfully inserted data with registered_face_id '${data.registered_face_id}' into collection '${collectionName}'`,
      };
    } catch (error) {
      console.error('Error creating data in collection:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(
    collectionName: string
  ): Promise<MilvusResponse<any>> {
    try {
      const client = await this.getClient();

      // Check if collection exists
      const hasCollection = await client.hasCollection({
        collection_name: collectionName,
      });

      if (!hasCollection.value) {
        return {
          success: false,
          error: `Collection '${collectionName}' does not exist`,
        };
      }

      // Get collection statistics
      const stats = await client.getCollectionStatistics({
        collection_name: collectionName,
      });

      // Get collection schema
      const schema = await client.describeCollection({
        collection_name: collectionName,
      });

      return {
        success: true,
        data: {
          stats: stats.stats,
          schema: schema.schema,
        },
        message: `Retrieved information for collection '${collectionName}'`,
      };
    } catch (error) {
      console.error('Error getting collection info:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<MilvusResponse<any[]>> {
    try {
      const client = await this.getClient();

      const collections = await client.listCollections();

      return {
        success: true,
        data: collections.data || [],
        message: `Retrieved ${(collections.data || []).length} collections`,
      };
    } catch (error) {
      console.error('Error listing collections:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const milvusService = new MilvusService();
export default milvusService;
