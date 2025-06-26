import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'
import { DynamoDBService } from '../services/dynamodb'
import { NLPService } from '../services/nlp'
import { BedrockService } from '../services/bedrock'
import { Reservation } from '../types'

const dynamoService = new DynamoDBService()
const nlpService = new NLPService()
const bedrockService = new BedrockService()

export const createReservation: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { request: userRequest, userId } = body

    if (!userRequest || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: 'リクエスト内容とユーザーIDが必要です'
        })
      }
    }

    const user = await dynamoService.getUser(userId)
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: 'ユーザーが見つかりません'
        })
      }
    }

    const parsedRequest = await nlpService.parseReservationRequest(userRequest)
    
    const availableGPUs = await dynamoService.getAvailableGPUs(parsedRequest.gpuType)
    if (availableGPUs < parsedRequest.quantity) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: `${parsedRequest.gpuType}の利用可能台数が不足しています (要求: ${parsedRequest.quantity}台, 利用可能: ${availableGPUs}台)`
        })
      }
    }

    const reservation: Reservation = {
      id: uuidv4(),
      userId,
      request: userRequest,
      parsedRequest,
      startTime: parsedRequest.startTime,
      endTime: parsedRequest.endTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const conflictingReservations = await dynamoService.getConflictingReservations(
      parsedRequest.startTime,
      parsedRequest.endTime,
      parsedRequest.gpuType,
      parsedRequest.quantity
    )

    const priorityRequest = {
      reservation,
      user,
      conflictingReservations
    }

    const priorityResult = await bedrockService.evaluatePriority(priorityRequest)
    
    reservation.priority = priorityResult.priority

    if (priorityResult.recommendation === 'approve' && conflictingReservations.length === 0) {
      reservation.status = 'confirmed'
    }

    await dynamoService.createReservation(reservation)

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        id: reservation.id,
        parsedRequest,
        priority: priorityResult.priority,
        reasoning: priorityResult.reasoning,
        status: reservation.status,
        recommendation: priorityResult.recommendation
      })
    }
  } catch (error) {
    console.error('Create reservation error:', error)
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: '予約処理中にエラーが発生しました'
      })
    }
  }
}

export const getReservations: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: 'ユーザーIDが必要です'
        })
      }
    }

    const reservations = await dynamoService.getUserReservations(userId)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        reservations: reservations.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      })
    }
  } catch (error) {
    console.error('Get reservations error:', error)
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: '予約情報の取得中にエラーが発生しました'
      })
    }
  }
}

export const updateReservation: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const reservationId = event.pathParameters?.id
    const body = JSON.parse(event.body || '{}')
    const { status } = body

    if (!reservationId || !status) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: '予約IDとステータスが必要です'
        })
      }
    }

    const reservation = await dynamoService.getReservation(reservationId)
    if (!reservation) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: '予約が見つかりません'
        })
      }
    }

    await dynamoService.updateReservationStatus(reservationId, status)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: '予約が更新されました',
        id: reservationId,
        status
      })
    }
  } catch (error) {
    console.error('Update reservation error:', error)
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: '予約の更新中にエラーが発生しました'
      })
    }
  }
}