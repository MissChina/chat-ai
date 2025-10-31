-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chatrooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultMode" TEXT NOT NULL DEFAULT 'normal',
    "globalConfig" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    CONSTRAINT "chatrooms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatRoomId" TEXT NOT NULL,
    "aiModelId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarColor" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_members_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "chatrooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sequential_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userQuestion" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "currentSpeakerIndex" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "pausedAt" DATETIME,
    "completedAt" DATETIME,
    "metadata" JSONB,
    CONSTRAINT "sequential_sessions_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "chatrooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sequential_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_speakers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "aiMemberId" TEXT NOT NULL,
    "aiModelId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "supplementCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_speakers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sequential_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_speakers_aiMemberId_fkey" FOREIGN KEY ("aiMemberId") REFERENCES "ai_members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "speakerOrder" INTEGER,
    "content" TEXT NOT NULL,
    "parentMessageId" TEXT,
    "isSupplemental" BOOLEAN NOT NULL DEFAULT false,
    "supplementRound" INTEGER,
    "streamCompleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "session_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sequential_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_messages_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "session_messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_quotas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "totalTokensLimit" INTEGER,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "tokensRemaining" INTEGER,
    "resetDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_quotas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "token_usage_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "aiModelId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCost" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "token_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_api_keys_userId_provider_key" ON "user_api_keys"("userId", "provider");

-- CreateIndex
CREATE INDEX "chatrooms_userId_idx" ON "chatrooms"("userId");

-- CreateIndex
CREATE INDEX "chatrooms_lastActiveAt_idx" ON "chatrooms"("lastActiveAt");

-- CreateIndex
CREATE INDEX "ai_members_chatRoomId_orderIndex_idx" ON "ai_members"("chatRoomId", "orderIndex");

-- CreateIndex
CREATE INDEX "sequential_sessions_chatRoomId_idx" ON "sequential_sessions"("chatRoomId");

-- CreateIndex
CREATE INDEX "sequential_sessions_state_idx" ON "sequential_sessions"("state");

-- CreateIndex
CREATE INDEX "session_speakers_sessionId_orderIndex_idx" ON "session_speakers"("sessionId", "orderIndex");

-- CreateIndex
CREATE INDEX "session_messages_sessionId_createdAt_idx" ON "session_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_quotas_userId_key" ON "user_quotas"("userId");

-- CreateIndex
CREATE INDEX "token_usage_logs_userId_timestamp_idx" ON "token_usage_logs"("userId", "timestamp");
