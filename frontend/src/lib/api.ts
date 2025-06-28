import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || ''

interface CreateReservationRequest {
  request: string
  userId: string
}

interface CreateReservationResponse {
  id: string
  parsedRequest: {
    gpuType: string
    quantity: number
    startTime: string
    endTime: string
    duration: number
  }
  priority: number
  reasoning: string
  status: string
  recommendation: string
}

interface Reservation {
  id: string
  userId: string
  request: string
  parsedRequest: {
    gpuType: string
    quantity: number
    startTime: string
    endTime: string
    duration: number
  }
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
  priority?: number
  createdAt: string
  updatedAt: string
}

interface CreateUserRequest {
  email: string
  name: string
  role?: 'user' | 'admin'
}

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  priority: number
}

class GPUGenieAPI {
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.data
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error)
      throw error
    }
  }

  async createReservation(request: CreateReservationRequest): Promise<CreateReservationResponse> {
    return this.makeRequest<CreateReservationResponse>('POST', '/reservations', request)
  }

  async getUserReservations(userId: string): Promise<{ reservations: Reservation[] }> {
    return this.makeRequest<{ reservations: Reservation[] }>('GET', `/reservations/${userId}`)
  }

  async updateReservation(
    reservationId: string,
    status: string
  ): Promise<{ message: string; id: string; status: string }> {
    return this.makeRequest<{ message: string; id: string; status: string }>(
      'PUT',
      `/reservations/update/${reservationId}`,
      { status }
    )
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    return this.makeRequest<User>('POST', '/users', user)
  }

  async getUser(userId: string): Promise<User> {
    return this.makeRequest<User>('GET', `/users/${userId}`)
  }
}

export const api = new GPUGenieAPI()
export type {
  CreateReservationRequest,
  CreateReservationResponse,
  Reservation,
  User,
  CreateUserRequest,
}
