import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database connection
export const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'zetapay_test',
  entities: ['src/models/**/*.ts'],
  synchronize: true, // Auto-create schema in test DB
  dropSchema: true, // Drop schema before each test run
  logging: false,
});

// Setup function - called before all tests
export async function setupTestDB() {
  try {
    await testDataSource.initialize();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
}

// Teardown function - called after all tests
export async function teardownTestDB() {
  try {
    await testDataSource.destroy();
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
  }
}

// Clear all tables between tests
export async function clearTestDB() {
  const entities = testDataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.clear();
  }
}
