import express from 'express'
import cors from 'cors'
import { createReservation, getReservations, updateReservation } from './handlers/reservations'
import { createUser, getUser } from './handlers/users'

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.post('/reservations', async (req, res) => {
  const event = {
    body: JSON.stringify(req.body),
    pathParameters: null,
    queryStringParameters: null,
    headers: req.headers,
    requestContext: {},
    httpMethod: 'POST',
    path: '/reservations',
  } as any

  try {
    const result = await createReservation(event, {} as any, {} as any)
    if (result && result.statusCode && result.body) {
      res.status(result.statusCode).json(JSON.parse(result.body))
    } else {
      res.status(500).json({ error: 'Handler returned invalid response' })
    }
  } catch (error) {
    console.error('Error in createReservation:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/reservations/:userId', async (req, res) => {
  const event = {
    pathParameters: { userId: req.params.userId },
    queryStringParameters: null,
    headers: req.headers,
    requestContext: {},
    httpMethod: 'GET',
    path: `/reservations/${req.params.userId}`,
  } as any

  try {
    const result = await getReservations(event, {} as any, {} as any)
    if (result && result.statusCode && result.body) {
      res.status(result.statusCode).json(JSON.parse(result.body))
    } else {
      res.status(500).json({ error: 'Handler returned invalid response' })
    }
  } catch (error) {
    console.error('Error in getReservations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/reservations/update/:id', async (req, res) => {
  const event = {
    body: JSON.stringify(req.body),
    pathParameters: { id: req.params.id },
    queryStringParameters: null,
    headers: req.headers,
    requestContext: {},
    httpMethod: 'PUT',
    path: `/reservations/update/${req.params.id}`,
  } as any

  try {
    const result = await updateReservation(event, {} as any, {} as any)
    if (result && result.statusCode && result.body) {
      res.status(result.statusCode).json(JSON.parse(result.body))
    } else {
      res.status(500).json({ error: 'Handler returned invalid response' })
    }
  } catch (error) {
    console.error('Error in updateReservation:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/users', async (req, res) => {
  const event = {
    body: JSON.stringify(req.body),
    pathParameters: null,
    queryStringParameters: null,
    headers: req.headers,
    requestContext: {},
    httpMethod: 'POST',
    path: '/users',
  } as any

  try {
    const result = await createUser(event, {} as any, {} as any)
    if (result && result.statusCode && result.body) {
      res.status(result.statusCode).json(JSON.parse(result.body))
    } else {
      res.status(500).json({ error: 'Handler returned invalid response' })
    }
  } catch (error) {
    console.error('Error in createUser:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/users/:id', async (req, res) => {
  const event = {
    pathParameters: { id: req.params.id },
    queryStringParameters: null,
    headers: req.headers,
    requestContext: {},
    httpMethod: 'GET',
    path: `/users/${req.params.id}`,
  } as any

  try {
    const result = await getUser(event, {} as any, {} as any)
    if (result && result.statusCode && result.body) {
      res.status(result.statusCode).json(JSON.parse(result.body))
    } else {
      res.status(500).json({ error: 'Handler returned invalid response' })
    }
  } catch (error) {
    console.error('Error in getUser:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => {
  console.log(`🚀 GPU Genie API Server running on port ${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`🔗 API Base URL: http://localhost:${port}`)
})
