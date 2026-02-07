# Relay Backend API

The Relay backend API provides authentication, agent management, integrations, and AI-powered chat capabilities for the Relay AI Agent Platform.

## Features

- **Authentication**: JWT-based auth with email verification and password reset
- **User Management**: Profile management, plan selection, activity tracking
- **Agent Management**: CRUD operations for AI agents with categorization
- **Integrations**: Connect with Salesforce, Slack, Gmail, Google Sheets, Notion, and more
- **AI Chat**: OpenAI GPT-4 powered conversational AI with dynamic UI generation

## Tech Stack

- Node.js + Express
- PostgreSQL (database)
- JWT (authentication)
- OpenAI GPT-4 (AI capabilities)
- Nodemailer (email service)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database**:
   - Create a database named `relay_db`
   - Run migrations:
   ```bash
   npm run migrate
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The server will start on port 3001 by default.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `SMTP_HOST` | SMTP server host | Yes (for email) |
| `SMTP_PORT` | SMTP server port | Yes (for email) |
| `SMTP_USER` | SMTP username | Yes (for email) |
| `SMTP_PASS` | SMTP password | Yes (for email) |
| `OPENAI_API_KEY` | OpenAI API key | Yes (for AI) |
| `FRONTEND_URL` | Frontend URL for CORS/links | Yes |
| `PORT` | Server port (default: 3001) | No |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile
- `POST /api/user/select-plan` - Select subscription plan
- `GET /api/user/activity` - Get activity logs
- `GET /api/user/stats` - Get user statistics

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create new agent
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/duplicate` - Duplicate agent
- `GET /api/agents/categories/list` - Get agent categories

### Integrations
- `GET /api/integrations` - List integrations
- `GET /api/integrations/types` - Get available integration types
- `POST /api/integrations` - Create integration
- `PATCH /api/integrations/:id` - Update integration
- `DELETE /api/integrations/:id` - Delete integration
- `POST /api/integrations/:id/test` - Test integration
- `POST /api/integrations/:id/execute` - Execute integration action

### AI
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/analyze-intent` - Analyze user intent
- `POST /api/ai/generate-report` - Generate dynamic report
- `GET /api/ai/conversations` - Get conversation history
- `GET /api/ai/conversations/:id` - Get specific conversation

## Database Schema

### Tables
- `users` - User accounts
- `sessions` - User sessions
- `agents` - AI agents
- `conversations` - Chat conversations
- `messages` - Chat messages
- `integrations` - Third-party integrations
- `outputs` - Generated outputs (reports, charts, etc.)
- `activity_logs` - User activity tracking

## Integration Types

Supported integrations:
- Salesforce
- Slack
- Gmail
- Google Sheets
- Notion
- HubSpot
- Zendesk
- Stripe
- OpenAI (custom API key)
- Webhook (custom endpoints)

## License

MIT
