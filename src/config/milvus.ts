import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

export interface MilvusConfig {
  address: string;
  token?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

class MilvusDatabase {
  private client: MilvusClient | null = null;
  private config: MilvusConfig;

  constructor() {
    this.config = {
      address: `${process.env.MILVUS_HOST || '172.30.5.103'}:${process.env.MILVUS_PORT || '19530'}`,
      username: process.env.MILVUS_USERNAME,
      password: process.env.MILVUS_PASSWORD,
      ssl: process.env.MILVUS_SSL === 'true',
    };
  }

  async connect(): Promise<MilvusClient> {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = new MilvusClient(this.config);

      // Test connection
      const health = await this.client.checkHealth();
      console.log('✅ MilvusDB connected successfully:', health);

      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to MilvusDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.closeConnection();
        this.client = null;
        console.log('✅ MilvusDB disconnected successfully');
      } catch (error) {
        console.error('❌ Error disconnecting from MilvusDB:', error);
        throw error;
      }
    }
  }

  getClient(): MilvusClient | null {
    return this.client;
  }

  async ensureConnection(): Promise<MilvusClient> {
    if (!this.client) {
      return await this.connect();
    }
    return this.client;
  }
}

export const milvusDB = new MilvusDatabase();
export default milvusDB;
