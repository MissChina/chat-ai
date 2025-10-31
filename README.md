# AI Chatroom - Sequential Speaking Mode

An innovative AI chatroom system that enables multiple AI models (GPT-4, Claude, Qwen) to engage in **sequential discussions** on any topic. Unlike traditional chatbots where AIs respond simultaneously, this system implements a unique "sequential speaking" mode where AIs take turns responding, building upon each other's insights.

## 🌟 Core Innovation: Sequential Speaking Mode

The key feature is **user-controlled sequential discussion**:
1. User asks a question
2. First AI responds completely
3. User decides: "Next AI" / "Supplement" / "Pause"
4. Second AI sees the first AI's response and adds their perspective
5. This continues, creating a progressive, multi-perspective discussion
6. **Prevention**: No AI-to-AI automatic loops - user controls every step

## ✨ Features

### Phase 1: Foundation (Current)
- [x] Project infrastructure setup
- [x] PostgreSQL + Prisma database schema
- [x] Redis for caching and locks
- [x] Unified AI adapter architecture
- [x] OpenAI GPT-4 integration
- [x] Anthropic Claude integration
- [ ] User authentication system
- [ ] Chatroom CRUD operations

### Phase 2: Core Features (Planned)
- [ ] Normal chat mode (all AIs respond simultaneously)
- [ ] **Sequential speaking mode** (AIs take turns)
- [ ] Streaming output (Server-Sent Events)
- [ ] Supplement mechanism (ask AI to elaborate)
- [ ] Pause/resume discussions
- [ ] Context building with previous responses

### Phase 3: Advanced Features (Planned)
- [ ] AI personality customization
- [ ] Token quota management
- [ ] Cost estimation before API calls
- [ ] Export conversations (Markdown/JSON)
- [ ] Progress visualization
- [ ] Multi-user collaboration

## 🏗️ Architecture

```
├── backend/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── adapters/      # AI model adapters (GPT-4, Claude, etc.)
│   │   ├── config/        # Database, Redis, environment config
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── models/        # Business logic
│   │   ├── routes/        # API routes
│   │   ├── services/      # Sequential session, queue management
│   │   └── index.ts       # Server entry point
│   └── tsconfig.json
├── frontend/              # React + TypeScript (To be implemented)
│   └── src/
├── prisma/
│   └── schema.prisma      # Database schema
├── ai聊天室mvp.txt         # Detailed MVP specification (Chinese)
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- OpenAI API Key
- Anthropic API Key (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MissChina/chat-ai.git
cd chat-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/chatai"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

4. **Set up database**
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. **Start development server**
```bash
npm run dev
```

Server will start at `http://localhost:3001`

### API Endpoints (Current)

- `GET /health` - Health check
- `GET /api` - API information
- More endpoints coming in Phase 2...

## 📊 Database Schema

Key entities:
- **User** - User accounts with authentication
- **ChatRoom** - Conversation spaces with AI members
- **AIMember** - AI participants in a chatroom (GPT-4, Claude, etc.)
- **SequentialSession** - Sequential discussion sessions
- **SessionSpeaker** - AI speakers in a session with status tracking
- **SessionMessage** - Messages in a discussion
- **UserQuota** - Token usage tracking and limits
- **TokenUsageLog** - Detailed usage analytics

See `prisma/schema.prisma` for complete schema.

## 🤖 AI Adapter System

The unified adapter interface allows easy integration of multiple AI models:

```typescript
// All AI models implement the same interface
interface AIAdapterBase {
  sendMessage(params): Promise<AIResponse>
  sendStreamingMessage(params): AsyncIterator<AIChunk>
  calculateCost(inputTokens, outputTokens): number
}
```

Currently supported:
- ✅ OpenAI GPT-4
- ✅ Anthropic Claude 3.5 Sonnet
- 🚧 Alibaba Qwen (planned)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- API key encryption
- Rate limiting (Redis-based)
- Distributed locks for preventing race conditions
- SQL injection protection (Prisma ORM)

## 📝 Development Roadmap

### Phase 1: Infrastructure (Week 1-2) ← Current Phase
- [x] Project setup
- [x] Database schema
- [x] AI adapters foundation
- [ ] Authentication system
- [ ] Basic CRUD operations

### Phase 2: Core Features (Week 3-5)
- [ ] Normal chat mode
- [ ] Sequential speaking mode implementation
- [ ] Streaming output
- [ ] State machine for session control
- [ ] Context building algorithm

### Phase 3: Polish & Optimization (Week 6-7)
- [ ] Frontend development (React)
- [ ] Token quota system
- [ ] Performance optimization
- [ ] Error handling improvements

### Phase 4: Testing & Deployment (Week 8)
- [ ] Integration testing
- [ ] End-to-end testing
- [ ] Documentation
- [ ] Production deployment

## 🧪 Testing

```bash
npm test  # Unit tests (coming soon)
```

## 📖 Documentation

- `ai聊天室mvp.txt` - Comprehensive MVP specification (Chinese)
- API documentation (coming soon)
- Architecture diagrams (coming soon)

## 🤝 Contributing

This is an MVP project. Contributions welcome after initial release.

## 📄 License

MIT

## 👥 Authors

- Product Team - MVP Design & Specifications
- Development Team - Implementation

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Anthropic for Claude API
- Alibaba Cloud for Qwen API
- The open-source community

---

**Note**: This project is under active development. The sequential speaking mode is the core innovation that differentiates this from traditional AI chatbots. See `ai聊天室mvp.txt` for detailed technical specifications.