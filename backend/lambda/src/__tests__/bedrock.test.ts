import { BedrockService } from '../services/bedrock'
import { PriorityRequest } from '../types'

describe('BedrockService', () => {
  let bedrockService: BedrockService

  beforeEach(() => {
    bedrockService = new BedrockService()
  })

  describe('evaluatePriority', () => {
    it('should return mock priority in development mode', async () => {
      process.env.NODE_ENV = 'development'

      const mockRequest: PriorityRequest = {
        reservation: {
          id: 'test-id',
          userId: 'test-user',
          request: 'Test request',
          parsedRequest: {
            gpuType: 'V100',
            quantity: 2,
            startTime: '2024-01-01T10:00:00Z',
            endTime: '2024-01-01T14:00:00Z',
            duration: 4,
          },
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T14:00:00Z',
          status: 'pending',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T09:00:00Z',
        },
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          priority: 50,
          createdAt: '2024-01-01T00:00:00Z',
        },
        conflictingReservations: [],
      }

      const result = await bedrockService.evaluatePriority(mockRequest)

      expect(result.priority).toBeGreaterThanOrEqual(50)
      expect(result.priority).toBeLessThanOrEqual(90)
      expect(result.reasoning).toContain('開発環境でのモック判定')
      expect(['approve', 'request_confirmation', 'reject']).toContain(result.recommendation)
    })

    it('should handle errors gracefully', async () => {
      process.env.NODE_ENV = 'production'

      // Mock Bedrock client to throw error
      const mockRequest: PriorityRequest = {
        reservation: {
          id: 'test-id',
          userId: 'test-user',
          request: 'Test request',
          parsedRequest: {
            gpuType: 'V100',
            quantity: 1,
            startTime: '2024-01-01T10:00:00Z',
            endTime: '2024-01-01T11:00:00Z',
            duration: 1,
          },
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T11:00:00Z',
          status: 'pending',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T09:00:00Z',
        },
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          priority: 50,
          createdAt: '2024-01-01T00:00:00Z',
        },
      }

      const result = await bedrockService.evaluatePriority(mockRequest)

      expect(result.priority).toBe(50)
      expect(result.reasoning).toContain('AI判定でエラーが発生したため')
      expect(result.recommendation).toBe('request_confirmation')
    })
  })
})