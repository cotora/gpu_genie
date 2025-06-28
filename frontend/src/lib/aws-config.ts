import { Amplify } from 'aws-amplify'

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
}

if (typeof window !== 'undefined') {
  Amplify.configure(awsConfig)
}

export default awsConfig
