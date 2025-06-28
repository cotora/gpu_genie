import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { ParsedRequest } from '../types'

export class NLPService {
  private client: BedrockRuntimeClient

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })
  }

  async parseReservationRequest(request: string): Promise<ParsedRequest> {
    // In development mode, use rule-based parsing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using rule-based NLP parsing')
      return this.parseReservationRequestRuleBased(request)
    }

    try {
      return await this.parseReservationRequestLLM(request)
    } catch (error) {
      console.error('LLM parsing failed, falling back to rule-based parsing:', error)
      return this.parseReservationRequestRuleBased(request)
    }
  }

  private async parseReservationRequestLLM(request: string): Promise<ParsedRequest> {
    const prompt = this.buildNLPPrompt(request)

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0', // Use faster model for NLP
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      contentType: 'application/json',
      accept: 'application/json',
    })

    const response = await this.client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    return this.parseNLPResponse(responseBody.content[0].text, request)
  }

  private buildNLPPrompt(request: string): string {
    const now = new Date()
    const currentTime = now.toISOString()
    const timeZone = 'Asia/Tokyo'

    return `
自然言語のGPU予約リクエストを解析して、構造化されたデータに変換してください。

【現在時刻】
${currentTime} (${timeZone})

【リクエスト】
"${request}"

【利用可能なGPU種類】
- V100 (デフォルト)
- A100  
- RTX3090
- RTX4090
- H100

【解析ルール】
1. GPU種類: 明記されていない場合はV100
2. 台数: 明記されていない場合は1台
3. 開始時刻: 相対時間（明日、来週など）も絶対時間に変換
4. 期間: 明記されていない場合は1時間
5. 終了時刻: 開始時刻 + 期間で計算

【出力形式】
以下のJSON形式で出力してください：
{
  "gpuType": "GPU種類",
  "quantity": 台数（数値）,
  "startTime": "ISO8601形式の開始時刻",
  "endTime": "ISO8601形式の終了時刻", 
  "duration": 期間（時間単位の数値）
}

※JSON以外の説明文は一切含めず、JSONのみを出力してください。
`
  }

  private parseNLPResponse(responseText: string, originalRequest: string): ParsedRequest {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON形式の応答が見つかりません')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate and sanitize the response
      const result: ParsedRequest = {
        gpuType: this.validateGPUType(parsed.gpuType),
        quantity: Math.max(1, Math.min(10, parseInt(parsed.quantity) || 1)),
        startTime: this.validateDateTime(parsed.startTime),
        endTime: this.validateDateTime(parsed.endTime),
        duration: Math.max(1, Math.min(168, parseInt(parsed.duration) || 1)), // Max 1 week
      }

      // Ensure endTime is after startTime
      const start = new Date(result.startTime)
      const end = new Date(result.endTime)
      if (end <= start) {
        const newEnd = new Date(start)
        newEnd.setHours(start.getHours() + result.duration)
        result.endTime = newEnd.toISOString()
      }

      return result
    } catch (error) {
      console.error('Failed to parse LLM response for request:', originalRequest, error)
      throw error
    }
  }

  private validateGPUType(gpuType: string): string {
    const validTypes = ['V100', 'A100', 'RTX3090', 'RTX4090', 'H100']
    const normalized = gpuType?.toUpperCase()

    if (validTypes.includes(normalized)) {
      return normalized
    }

    // Try to match partial strings
    for (const validType of validTypes) {
      if (normalized?.includes(validType) || validType.includes(normalized)) {
        return validType
      }
    }

    return 'V100' // Default
  }

  private validateDateTime(dateTimeStr: string): string {
    try {
      const date = new Date(dateTimeStr)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }

      // Ensure date is not in the past (with 1 hour buffer)
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      if (date < oneHourAgo) {
        // If in the past, set to next hour
        const nextHour = new Date(now)
        nextHour.setHours(now.getHours() + 1, 0, 0, 0)
        return nextHour.toISOString()
      }

      return date.toISOString()
    } catch (error) {
      // Fallback to next hour
      const now = new Date()
      const nextHour = new Date(now)
      nextHour.setHours(now.getHours() + 1, 0, 0, 0)
      return nextHour.toISOString()
    }
  }

  // Fallback rule-based parsing for development and error cases
  private parseReservationRequestRuleBased(request: string): ParsedRequest {
    const normalizedRequest = request.toLowerCase()

    const gpuType = this.extractGPUType(normalizedRequest)
    const quantity = this.extractQuantity(normalizedRequest)
    const { startTime, endTime, duration } = this.extractTimeInfo(normalizedRequest)

    return {
      gpuType,
      quantity,
      startTime,
      endTime,
      duration,
    }
  }

  private extractGPUType(request: string): string {
    const gpuPatterns = [
      { pattern: /v100/i, type: 'V100' },
      { pattern: /a100/i, type: 'A100' },
      { pattern: /rtx\s*3090/i, type: 'RTX3090' },
      { pattern: /rtx\s*4090/i, type: 'RTX4090' },
      { pattern: /h100/i, type: 'H100' },
    ]

    for (const { pattern, type } of gpuPatterns) {
      if (pattern.test(request)) {
        return type
      }
    }

    return 'V100'
  }

  private extractQuantity(request: string): number {
    const patterns = [
      /(\d+)\s*台/,
      /(\d+)\s*個/,
      /(\d+)\s*枚/,
      /(\d+)\s*基/,
      /(\d+)\s*units?/i,
      /(\d+)\s*gpus?/i,
    ]

    for (const pattern of patterns) {
      const match = request.match(pattern)
      if (match) {
        return Math.max(1, Math.min(10, parseInt(match[1], 10)))
      }
    }

    const numberWords = {
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      十: 10,
    }

    for (const [word, num] of Object.entries(numberWords)) {
      if (request.includes(word)) {
        return num
      }
    }

    return 1
  }

  private extractTimeInfo(request: string): {
    startTime: string
    endTime: string
    duration: number
  } {
    const now = new Date()
    let startTime = new Date(now)
    let duration = 1

    if (request.includes('明日') || request.includes('tomorrow')) {
      startTime.setDate(now.getDate() + 1)
    } else if (request.includes('来週') || request.includes('next week')) {
      startTime.setDate(now.getDate() + 7)
    } else if (request.includes('今日') || request.includes('today')) {
      startTime = new Date(now)
    }

    const timeMatch = request.match(/(\d{1,2})[時:](\d{1,2})?/)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10)
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
      startTime.setHours(hours, minutes, 0, 0)
    } else if (request.includes('午後') || request.includes('pm')) {
      startTime.setHours(13, 0, 0, 0)
    } else if (request.includes('午前') || request.includes('am')) {
      startTime.setHours(9, 0, 0, 0)
    } else {
      startTime.setHours(10, 0, 0, 0)
    }

    const durationMatch = request.match(/(\d+)\s*時間/)
    if (durationMatch) {
      duration = Math.max(1, Math.min(168, parseInt(durationMatch[1], 10)))
    } else if (request.includes('一日') || request.includes('1日')) {
      duration = 8
    } else if (request.includes('半日')) {
      duration = 4
    }

    // Ensure startTime is not in the past
    if (startTime < now) {
      startTime = new Date(now)
      startTime.setHours(now.getHours() + 1, 0, 0, 0)
    }

    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + duration)

    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    }
  }
}
