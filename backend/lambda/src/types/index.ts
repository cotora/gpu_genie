export interface Reservation {
  id: string
  userId: string
  request: string
  parsedRequest: ParsedRequest
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
  priority?: number
  createdAt: string
  updatedAt: string
}

export interface ParsedRequest {
  gpuType: string
  quantity: number
  startTime: string
  endTime: string
  duration: number
}

export interface GPUServer {
  id: string
  name: string
  gpuType: string
  totalGpus: number
  availableGpus: number
  status: 'active' | 'maintenance' | 'offline'
}

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  priority: number
  createdAt: string
}

export interface PriorityRequest {
  reservation: Reservation
  user: User
  conflictingReservations?: Reservation[]
}

export interface PriorityResponse {
  priority: number
  reasoning: string
  recommendation: 'approve' | 'reject' | 'request_confirmation'
}