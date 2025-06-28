import { Amplify } from 'aws-amplify'

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_AWS_REGION',
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID'
]

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
  }
})

const awsConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || '',
      mandatorySignIn: true,
      authenticationFlowType: 'USER_SRP_AUTH',
    },
  },
  ssr: true, // Enable SSR support
}

// Configure Amplify for both client and server
Amplify.configure(awsConfig)

export default awsConfig
