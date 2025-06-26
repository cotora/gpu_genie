import { NLPService } from '../services/nlp'

describe('NLPService', () => {
  let nlpService: NLPService

  beforeEach(() => {
    nlpService = new NLPService()
  })

  describe('parseReservationRequest', () => {
    beforeEach(() => {
      // Set development mode for rule-based testing
      process.env.NODE_ENV = 'development'
    })

    it('should parse basic GPU reservation request', async () => {
      const request = '明日15時から3時間、V100を2台予約'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.gpuType).toBe('V100')
      expect(result.quantity).toBe(2)
      expect(result.duration).toBe(3)
    })

    it('should parse A100 GPU request', async () => {
      const request = 'A100を1台使いたい'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.gpuType).toBe('A100')
      expect(result.quantity).toBe(1)
    })

    it('should parse RTX3090 GPU request', async () => {
      const request = 'RTX3090を4台予約したい'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.gpuType).toBe('RTX3090')
      expect(result.quantity).toBe(4)
    })

    it('should default to V100 if no GPU type specified', async () => {
      const request = 'GPUを2台使いたい'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.gpuType).toBe('V100')
      expect(result.quantity).toBe(2)
    })

    it('should default to 1 if no quantity specified', async () => {
      const request = 'V100を使いたい'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.gpuType).toBe('V100')
      expect(result.quantity).toBe(1)
    })

    it('should parse time information correctly', async () => {
      const request = '明日15時から3時間、V100を1台'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.duration).toBe(3)
      // Note: In test environment, the exact time may vary, so we check relative values
      expect(result.startTime).toBeDefined()
      expect(result.endTime).toBeDefined()
      expect(new Date(result.endTime).getTime() - new Date(result.startTime).getTime()).toBe(3 * 60 * 60 * 1000)
    })

    it('should handle Japanese number words', async () => {
      const request = 'V100を三台予約'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.quantity).toBe(3)
    })

    it('should enforce quantity limits', async () => {
      const request = 'V100を20台予約'
      const result = await nlpService.parseReservationRequest(request)

      expect(result.quantity).toBeLessThanOrEqual(10) // Should be capped at 10
    })

    it('should ensure start time is not in the past', async () => {
      const request = '昨日V100を1台予約'
      const result = await nlpService.parseReservationRequest(request)

      const now = new Date()
      const startTime = new Date(result.startTime)
      expect(startTime.getTime()).toBeGreaterThan(now.getTime() - 60 * 60 * 1000) // Within 1 hour of now
    })
  })
})