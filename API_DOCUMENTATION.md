# API Documentation - REACH Church Vietnam

**Version:** 1.0.0  
**Last Updated:** June 2026  
**Base URL:** `https://reach-church.com/api` (Production)  
**Development URL:** `http://localhost:3000/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Endpoints](#endpoints)
4. [Rate Limiting](#rate-limiting)
5. [Webhooks](#webhooks)

---

## Authentication

### Overview
The API uses **JWT tokens** via Supabase Authentication. All protected endpoints require a valid JWT token.

### Getting a Token

```bash
# 1. Sign up / Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIs...",
#   "refresh_token": "your-refresh-token",
#   "user": { "id": "uuid", "email": "user@example.com" }
# }
```

### Using the Token

```bash
# Include in Authorization header
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/user/profile
```

### Token Refresh

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your-refresh-token"
  }'
```

---

## Error Handling

### Error Response Format

```json
{
  "error": true,
  "message": "Descriptive error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {
    "field": "specific issue"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

### Common Error Codes

```
INVALID_EMAIL              Email format is invalid
INVALID_PASSWORD           Password too short or weak
USER_NOT_FOUND            User account doesn't exist
UNAUTHORIZED              Token expired or invalid
PERMISSION_DENIED         User lacks required role
RESOURCE_NOT_FOUND        Requested resource doesn't exist
VALIDATION_ERROR          Request body validation failed
RATE_LIMIT_EXCEEDED       Too many requests
INTERNAL_ERROR            Unexpected server error
```

---

## Endpoints

### Authentication Endpoints

#### POST `/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "created_at": "2026-06-05T10:30:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "refresh_token_xxx"
  }
}
```

**Error Cases:**
- `400` - Email already exists, invalid password
- `422` - Validation error

---

#### POST `/auth/signin`
Sign in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "refresh_token_xxx"
  }
}
```

---

#### POST `/auth/logout`
Sign out the current user.

**Request:**
```json
{}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### Bible Endpoints

#### GET `/bible`
Fetch Bible verses by book and chapter.

**Query Parameters:**
| Parameter | Type | Required | Example |
|-----------|------|----------|---------|
| book | string | Yes | `Genesis`, `Matthew`, `John` |
| chapter | number | Yes | `1`, `3`, `28` |
| version | string | No | `1934`, `2010` (default: 2010) |

**Request:**
```bash
GET /api/bible?book=Genesis&chapter=1&version=1934
```

**Response:** `200 OK`
```json
{
  "book": "Genesis",
  "chapter": 1,
  "version": "1934",
  "verses": [
    {
      "verse": 1,
      "text": "Trước hết, Đức Chúa Trời dựng nên trời đất."
    },
    {
      "verse": 2,
      "text": "Đất là vô định hình, hư không, tối tăm..."
    }
  ],
  "totalVerses": 31
}
```

**Error Cases:**
- `400` - Missing required parameters
- `404` - Book or chapter not found

---

#### GET `/bible/search`
Search for verses containing specific keywords.

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| query | string | Yes |
| limit | number | No (default: 10) |
| offset | number | No (default: 0) |

**Request:**
```bash
GET /api/bible/search?query=yêu+thương&limit=20
```

**Response:** `200 OK`
```json
{
  "query": "yêu thương",
  "results": [
    {
      "book": "1 John",
      "chapter": 4,
      "verse": 7,
      "text": "Các anh em thân yêu, chúng ta hãy yêu thương nhau..."
    }
  ],
  "totalResults": 45,
  "limit": 20,
  "offset": 0
}
```

---

#### GET `/bible/highlights`
Get user's bookmarked verses.

**Authentication:** Required  
**Request:**
```bash
GET /api/bible/highlights
```

**Response:** `200 OK`
```json
{
  "highlights": [
    {
      "id": "uuid",
      "book": "John",
      "chapter": 3,
      "verse": 16,
      "text": "Đức Chúa Trời yêu thương thế gian này...",
      "color": "#FFD700",
      "note": "My favorite verse",
      "created_at": "2026-06-01T08:00:00Z"
    }
  ],
  "total": 42
}
```

---

#### POST `/bible/highlights`
Create a new bookmark/highlight.

**Authentication:** Required  
**Request:**
```json
{
  "book": "John",
  "chapter": 3,
  "verse": 16,
  "color": "#FFD700",
  "note": "Favorite verse about God's love"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "book": "John",
  "chapter": 3,
  "verse": 16,
  "color": "#FFD700",
  "note": "Favorite verse about God's love",
  "created_at": "2026-06-05T10:30:00Z"
}
```

---

#### DELETE `/bible/highlights/{id}`
Delete a highlight.

**Authentication:** Required  
**Request:**
```bash
DELETE /api/bible/highlights/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "message": "Highlight deleted successfully"
}
```

---

### Devotional Endpoints

#### GET `/devotionals`
Get all devotionals with pagination.

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| page | number | 1 |
| limit | number | 10 |
| sort | string | `-published_at` |

**Request:**
```bash
GET /api/devotionals?page=1&limit=10&sort=-published_at
```

**Response:** `200 OK`
```json
{
  "devotionals": [
    {
      "id": "uuid",
      "title": "Tình Yêu Vô Điều Kiện",
      "content": "HTML content here...",
      "author": "Pastor John",
      "published_at": "2026-06-05T08:00:00Z",
      "featured_image": "https://cdn.example.com/image.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "total": 50
  }
}
```

---

#### GET `/devotionals/{id}`
Get a specific devotional.

**Request:**
```bash
GET /api/devotionals/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Tình Yêu Vô Điều Kiện",
  "content": "Detailed HTML content...",
  "author": "Pastor John",
  "published_at": "2026-06-05T08:00:00Z",
  "featured_image": "https://cdn.example.com/image.jpg",
  "related": [
    { "id": "uuid2", "title": "Related devotional" }
  ]
}
```

---

### Prayer Request Endpoints

#### GET `/prayers`
Get user's prayer requests.

**Authentication:** Required  
**Request:**
```bash
GET /api/prayers?status=pending&limit=20
```

**Response:** `200 OK`
```json
{
  "prayers": [
    {
      "id": "uuid",
      "title": "Health and healing",
      "content": "Prayer request details...",
      "status": "pending",
      "category": "health",
      "created_at": "2026-06-05T10:00:00Z",
      "updated_at": "2026-06-05T12:00:00Z"
    }
  ],
  "total": 15
}
```

---

#### POST `/prayers`
Create a new prayer request.

**Authentication:** Required  
**Request:**
```json
{
  "title": "Health and healing",
  "content": "Please pray for my mother's recovery...",
  "category": "health",
  "isPrivate": false
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "Health and healing",
  "content": "Please pray for my mother's recovery...",
  "category": "health",
  "status": "pending",
  "isPrivate": false,
  "created_at": "2026-06-05T10:30:00Z"
}
```

**Error Cases:**
- `401` - Unauthorized
- `422` - Validation error (missing title, etc.)

---

### User Profile Endpoints

#### GET `/user/profile`
Get current user's profile.

**Authentication:** Required  
**Request:**
```bash
GET /api/user/profile
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+84123456789",
  "address": "123 Main St, Ho Chi Minh City",
  "bio": "Christian believer and Bible student",
  "avatar_url": "https://cdn.example.com/avatar.jpg",
  "created_at": "2025-01-15T08:00:00Z",
  "preferences": {
    "theme": "light",
    "language": "vi",
    "notifications_email": true,
    "notifications_push": true
  }
}
```

---

#### PUT `/user/profile`
Update user profile.

**Authentication:** Required  
**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+84123456789",
  "address": "456 New St, Hanoi",
  "preferences": {
    "theme": "dark",
    "language": "vi"
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": { ...updated user object }
}
```

---

#### PUT `/user/password`
Change user password.

**Authentication:** Required  
**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

---

### Admin Endpoints

#### GET `/admin/users`
Get all users (Admin only).

**Authentication:** Required (Admin role)  
**Request:**
```bash
GET /api/admin/users?page=1&limit=20&search=john
```

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "role": "user",
      "created_at": "2025-01-15T08:00:00Z",
      "lastLogin": "2026-06-05T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156
  }
}
```

---

#### POST `/admin/devotionals`
Create a new devotional (Admin only).

**Authentication:** Required (Admin role)  
**Request:**
```json
{
  "title": "New devotional title",
  "content": "<p>HTML content</p>",
  "author": "Pastor Name",
  "featuredImage": "https://cdn.example.com/image.jpg",
  "publishedAt": "2026-06-05T08:00:00Z"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "New devotional title",
  "content": "<p>HTML content</p>",
  "author": "Pastor Name",
  "created_at": "2026-06-05T10:30:00Z"
}
```

---

## Rate Limiting

### Limits

```
Unauthenticated: 100 requests per hour per IP
Authenticated:   1000 requests per hour per user
Admin:           Unlimited
```

### Headers

```
X-RateLimit-Limit:     1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset:     1717574400
```

### Exceeding Limits

```json
{
  "error": true,
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "retryAfter": 3600
}
```

---

## Webhooks

### Supported Events

- `user.created` - New user registered
- `user.updated` - User profile updated
- `prayer.created` - New prayer request
- `devotional.published` - New devotional published

### Webhook Request Format

```json
{
  "event": "user.created",
  "timestamp": "2026-06-05T10:30:00Z",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    ...
  }
}
```

### Configuring Webhooks

```bash
POST /api/admin/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": ["user.created", "prayer.created"],
  "active": true
}
```

---

## SDKs & Libraries

- **JavaScript/TypeScript:** `npm install @reach-church/sdk-js`
- **Python:** `pip install reach-church-sdk`
- **REST:** Use any HTTP client

---

## Support

- 📧 **Email:** api-support@reach-church.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/truonga-dev/REACH_Church_App/issues)
- 📚 **Docs:** https://docs.reach-church.com

---

**Last Updated:** June 5, 2026  
**API Version:** 1.0.0
