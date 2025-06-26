import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'
import { DynamoDBService } from '../services/dynamodb'
import { User } from '../types'

const dynamoService = new DynamoDBService()

export const createUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { email, name, role = 'user' } = body

    if (!email || !name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: 'メールアドレスと名前が必要です'
        })
      }
    }

    const user: User = {
      id: uuidv4(),
      email,
      name,
      role: role === 'admin' ? 'admin' : 'user',
      priority: role === 'admin' ? 80 : 50,
      createdAt: new Date().toISOString()
    }

    await dynamoService.createUser(user)

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        priority: user.priority
      })
    }
  } catch (error) {
    console.error('Create user error:', error)
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'ユーザー作成中にエラーが発生しました'
      })
    }
  }
}

export const getUser: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        priority: user.priority
      })
    }
  } catch (error) {
    console.error('Get user error:', error)
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'ユーザー情報の取得中にエラーが発生しました'
      })
    }
  }
}