// Test setup file

// Mock AWS SDK for tests
jest.mock('aws-sdk', () => ({
  config: {
    update: jest.fn(),
  },
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      put: jest.fn().mockReturnValue({ promise: jest.fn() }),
      get: jest.fn().mockReturnValue({ promise: jest.fn() }),
      query: jest.fn().mockReturnValue({ promise: jest.fn() }),
      update: jest.fn().mockReturnValue({ promise: jest.fn() }),
      scan: jest.fn().mockReturnValue({ promise: jest.fn() }),
    })),
  },
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.AWS_REGION = 'us-east-1'
process.env.RESERVATIONS_TABLE = 'gpu-genie-reservations-test'
process.env.USERS_TABLE = 'gpu-genie-users-test'
process.env.GPU_SERVERS_TABLE = 'gpu-genie-gpu-servers-test'
