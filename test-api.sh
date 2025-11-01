#!/bin/bash

# AI Chatroom API Test Script
# This script tests the core API functionality

BASE_URL="http://localhost:3001"

echo "======================================"
echo "AI Chatroom API Test Suite"
echo "======================================"
echo

# 1. Health Check
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .
echo

# 2. API Info
echo "2. Testing API info..."
curl -s "$BASE_URL/api" | jq .
echo

# 3. Register User
echo "3. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "username": "demouser",
    "password": "demo1234"
  }')
echo "$REGISTER_RESPONSE" | jq .
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
echo

# 4. Login
echo "4. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo1234"
  }')
echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo

# 5. Get Profile
echo "5. Getting user profile..."
curl -s "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo

# 6. Create Chatroom
echo "6. Creating a chatroom..."
CHATROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/chatrooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "AI Discussion Room",
    "defaultMode": "sequential",
    "aiMembers": [
      {
        "aiModelId": "gpt-4",
        "displayName": "GPT-4",
        "avatarColor": "#10a37f"
      },
      {
        "aiModelId": "claude-3-5-sonnet-20241022",
        "displayName": "Claude",
        "avatarColor": "#d4a373"
      }
    ]
  }')
echo "$CHATROOM_RESPONSE" | jq .
CHATROOM_ID=$(echo "$CHATROOM_RESPONSE" | jq -r '.chatRoom.id')
echo

# 7. Get Chatrooms
echo "7. Listing chatrooms..."
curl -s "$BASE_URL/api/chatrooms" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo

# 8. Get Specific Chatroom
echo "8. Getting specific chatroom..."
curl -s "$BASE_URL/api/chatrooms/$CHATROOM_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "======================================"
echo "All tests completed!"
echo "======================================"
