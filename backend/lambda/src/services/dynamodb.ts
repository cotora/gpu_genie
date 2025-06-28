import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb'
import { Reservation, User, GPUServer } from '../types'

const clientConfig = process.env.DYNAMODB_ENDPOINT
  ? {
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT,
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      },
    }
  : { region: process.env.AWS_REGION || 'us-east-1' }

const client = new DynamoDBClient(clientConfig)
const docClient = DynamoDBDocumentClient.from(client)

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE || 'gpu-genie-reservations'
const USERS_TABLE = process.env.USERS_TABLE || 'gpu-genie-users'
const GPU_SERVERS_TABLE = process.env.GPU_SERVERS_TABLE || 'gpu-genie-gpu-servers'

export class DynamoDBService {
  async createReservation(reservation: Reservation): Promise<void> {
    const command = new PutCommand({
      TableName: RESERVATIONS_TABLE,
      Item: reservation,
    })
    await docClient.send(command)
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const command = new GetCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { id },
    })
    const result = await docClient.send(command)
    return (result.Item as Reservation) || null
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    const command = new QueryCommand({
      TableName: RESERVATIONS_TABLE,
      IndexName: 'user-id-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
    const result = await docClient.send(command)
    return (result.Items as Reservation[]) || []
  }

  async updateReservationStatus(
    id: string,
    status: Reservation['status'],
    priority?: number
  ): Promise<void> {
    const updateExpression =
      priority !== undefined
        ? 'SET #status = :status, priority = :priority, updatedAt = :updatedAt'
        : 'SET #status = :status, updatedAt = :updatedAt'

    const expressionAttributeValues =
      priority !== undefined
        ? { ':status': status, ':priority': priority, ':updatedAt': new Date().toISOString() }
        : { ':status': status, ':updatedAt': new Date().toISOString() }

    const command = new UpdateCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: expressionAttributeValues,
    })
    await docClient.send(command)
  }

  async getConflictingReservations(
    startTime: string,
    endTime: string,
    gpuType: string,
    quantity: number
  ): Promise<Reservation[]> {
    const command = new ScanCommand({
      TableName: RESERVATIONS_TABLE,
      FilterExpression:
        '#status = :status AND parsedRequest.gpuType = :gpuType AND NOT (endTime <= :startTime OR startTime >= :endTime)',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'confirmed',
        ':gpuType': gpuType,
        ':startTime': startTime,
        ':endTime': endTime,
      },
    })
    const result = await docClient.send(command)
    return ((result.Items as Reservation[]) || []).filter(reservation => {
      const reservedQuantity = reservation.parsedRequest.quantity
      return reservedQuantity >= quantity
    })
  }

  async getUser(id: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: USERS_TABLE,
      Key: { id },
    })
    const result = await docClient.send(command)
    return (result.Item as User) || null
  }

  async createUser(user: User): Promise<void> {
    const command = new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    })
    await docClient.send(command)
  }

  async getGPUServers(): Promise<GPUServer[]> {
    const command = new ScanCommand({
      TableName: GPU_SERVERS_TABLE,
    })
    const result = await docClient.send(command)
    return (result.Items as GPUServer[]) || []
  }

  async getAvailableGPUs(gpuType: string): Promise<number> {
    const servers = await this.getGPUServers()
    return servers
      .filter(server => server.gpuType === gpuType && server.status === 'active')
      .reduce((total, server) => total + server.availableGpus, 0)
  }
}
