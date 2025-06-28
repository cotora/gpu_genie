# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Overview

GPU Genie is a serverless GPU server reservation management system that uses natural language processing for intuitive booking and AI-powered priority judgment for fair resource allocation. Built on AWS with a React frontend and Node.js/TypeScript backend.

### Architecture
```
User → CloudFront → S3 (Next.js static) → API Gateway → Lambda → DynamoDB
                                                      ↓
                                               Amazon Bedrock (AI)
```

## Development Commands

### Local Development Environment
```bash
# Start full development environment with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop environment
docker-compose down
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev          # Development server (with turbopack)
npm run build        # Production build
npm run export       # Static export for S3
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### Backend (Lambda)
```bash
cd backend/lambda
npm install
npm run dev          # Development server with nodemon
npm run build        # TypeScript compilation
npm run test         # Run Jest tests
npm run test:watch   # Watch mode testing
npm run test:coverage # Test with coverage
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### CI/CD Scripts
```bash
# Run all CI checks locally (mirrors GitHub Actions)
./scripts/ci.sh

# Individual CI tasks
./scripts/ci-utils.sh frontend    # Frontend-only CI
./scripts/ci-utils.sh backend     # Backend-only CI
./scripts/ci-utils.sh terraform   # Terraform validation
./scripts/ci-utils.sh security    # Security scanning
./scripts/ci-utils.sh docker      # Docker build tests

# Code fixes
./scripts/ci-utils.sh fix         # Auto-fix all issues
./scripts/ci-utils.sh format      # Format code

# Development helpers
./scripts/ci-utils.sh watch       # Watch files and run CI
```

### Deployment
```bash
# Manual deployment (for AWS CloudShell)
./scripts/deploy.sh dev           # Deploy to dev environment
./scripts/deploy.sh staging       # Deploy to staging
./scripts/deploy.sh prod          # Deploy to production

# Individual deployment tasks
./scripts/deploy-utils.sh deploy-infra dev      # Infrastructure only
./scripts/deploy-utils.sh deploy-frontend dev   # Frontend only
./scripts/deploy-utils.sh deploy-backend dev    # Backend only
```

### Database Setup
```bash
# Initialize DynamoDB Local tables
cd scripts
node init-dynamodb.js
```

## Code Architecture

### Frontend Structure
- **App Router**: Next.js 15 with app directory structure
- **Authentication**: Development auth provider (DevAuthProvider) for local dev, AWS Amplify for production
- **Styling**: Tailwind CSS v4
- **Components**: React functional components with TypeScript
- **API Communication**: Axios with centralized API configuration

### Backend Structure
- **Handlers**: Lambda function entry points (`handlers/reservations.ts`, `handlers/users.ts`)
- **Services**: Business logic layers
  - `dynamodb.ts`: Database operations
  - `nlp.ts`: Natural language processing for reservation parsing
  - `bedrock.ts`: AI priority judgment using Amazon Bedrock
- **Types**: Shared TypeScript interfaces (`types/index.ts`)
- **Express Server**: Local development server (`server.ts`)

### Infrastructure
- **Terraform**: Infrastructure as Code in `terraform/` directory
- **AWS Services**: Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito, Bedrock
- **Environment Management**: Separate configurations for dev/staging/prod

## Development Patterns

### Error Handling
- Use proper HTTP status codes
- Include CORS headers in all responses
- Provide user-friendly error messages in Japanese
- Log errors appropriately for debugging

### Testing
- Backend: Jest with TypeScript support
- Frontend: Built-in Next.js testing capabilities
- Test files: `__tests__/` directories
- Coverage reporting available

### Code Quality
- ESLint with TypeScript support
- Prettier for code formatting
- Strict TypeScript configuration
- Pre-commit hooks via CI scripts

### Natural Language Processing
The system processes Japanese natural language input like "明日15時から3時間、V100を2台予約" (Reserve 2 V100 GPUs from 3 PM tomorrow for 3 hours) using Amazon Bedrock's Claude models.

### AI Priority Judgment
Uses Amazon Bedrock (Claude 3 Sonnet) to evaluate reservation conflicts and determine fair priority based on job importance and user history.

## Local Development URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- DynamoDB Admin: http://localhost:8001
- DynamoDB Local: http://localhost:8000

## Testing Strategy
Always run the full CI suite before committing:
```bash
./scripts/ci.sh
```

This runs linting, type checking, tests, and builds for both frontend and backend to ensure code quality.