import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { PriorityRequest, PriorityResponse } from '../types'

export class BedrockService {
  private client: BedrockRuntimeClient

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })
  }

  async evaluatePriority(request: PriorityRequest): Promise<PriorityResponse> {
    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock AI priority evaluation')
      const mockPriority = Math.floor(Math.random() * 40) + 50 // 50-90
      return {
        priority: mockPriority,
        reasoning: `開発環境でのモック判定。ユーザー優先度: ${request.user.priority}, 要求: ${request.reservation.parsedRequest.gpuType} x ${request.reservation.parsedRequest.quantity}台, ${request.reservation.parsedRequest.duration}時間使用。総合評価により${mockPriority}点としました。`,
        recommendation:
          mockPriority >= 70 ? 'approve' : mockPriority >= 40 ? 'request_confirmation' : 'reject',
      }
    }

    const prompt = this.buildPriorityPrompt(request)

    try {
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
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

      return this.parsePriorityResponse(responseBody.content[0].text)
    } catch (error) {
      console.error('Bedrock API error:', error)

      return {
        priority: 50,
        reasoning: 'AI判定でエラーが発生したため、デフォルト優先度を適用しました。',
        recommendation: 'request_confirmation',
      }
    }
  }

  private buildPriorityPrompt(request: PriorityRequest): string {
    const { reservation, user, conflictingReservations } = request

    const conflictInfo =
      conflictingReservations && conflictingReservations.length > 0
        ? `競合する予約: ${conflictingReservations.length}件`
        : '競合する予約なし'

    return `
GPU予約システムの優先度判定を行ってください。以下の情報を基に、0-100の優先度スコアと推奨アクションを決定してください。

【予約詳細】
- リクエスト: ${reservation.request}
- GPU種類: ${reservation.parsedRequest.gpuType}
- 台数: ${reservation.parsedRequest.quantity}台
- 使用期間: ${reservation.parsedRequest.duration}時間
- 開始時間: ${reservation.startTime}
- 終了時間: ${reservation.endTime}

【ユーザー情報】
- ユーザーID: ${user.id}
- 名前: ${user.name}
- 役割: ${user.role}
- ベース優先度: ${user.priority}

【リソース状況】
- ${conflictInfo}

【判定基準】
1. ユーザーの役割と実績 (0-30点)
2. リクエストの緊急性・重要性 (0-25点)  
3. リソース使用効率 (0-25点)
4. 公平性と待機時間 (0-20点)

【推奨アクション】
- approve: 優先度70以上、すぐに承認
- request_confirmation: 優先度40-69、確認が必要
- reject: 優先度40未満、拒否推奨

以下のJSON形式で回答してください：
{
  "priority": 数値(0-100),
  "reasoning": "判定理由の詳細説明",
  "recommendation": "approve/request_confirmation/reject"
}
`
  }

  private parsePriorityResponse(responseText: string): PriorityResponse {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON形式の応答が見つかりません')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        priority: Math.max(0, Math.min(100, parsed.priority || 50)),
        reasoning: parsed.reasoning || 'AI判定が完了しました。',
        recommendation: ['approve', 'reject', 'request_confirmation'].includes(
          parsed.recommendation
        )
          ? parsed.recommendation
          : 'request_confirmation',
      }
    } catch (error) {
      console.error('Failed to parse Bedrock response:', error)

      return {
        priority: 50,
        reasoning: 'AI応答の解析中にエラーが発生しました。デフォルト判定を適用します。',
        recommendation: 'request_confirmation',
      }
    }
  }
}
