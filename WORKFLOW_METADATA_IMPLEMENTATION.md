# Workflow Metadata and Versioning Implementation

## Overview
This document describes the implementation of Task 5.3: Workflow metadata and versioning for the Office Automation Platform.

## Requirements Implemented
- **Requirement 4.1**: Workflow persistence with all nodes, connections, and configurations
- **Requirement 4.2**: Save workflow with user-provided name in user's workspace
- **Requirement 11.1**: Create new version with timestamp and author information

## Implementation Details

### 1. Auto-Generated Fields

#### UUID Generation
- **Field**: `id`
- **Implementation**: Database-level using PostgreSQL's `uuid_generate_v4()` function
- **Location**: `database-schema.sql` line 31
- **Behavior**: Automatically generates a unique UUID for each new workflow

#### Timestamps
- **Fields**: `created_at`, `updated_at`
- **Implementation**: 
  - `created_at`: Database default `NOW()` on insert
  - `updated_at`: Database default `NOW()` on insert, auto-updated via trigger on update
- **Location**: `database-schema.sql` lines 38-39, trigger lines 127-135
- **Behavior**: 
  - `created_at` is set once when workflow is created
  - `updated_at` is automatically updated on every workflow modification

### 2. Metadata Structure

The `metadata` JSONB field stores:
```typescript
{
  author: string,      // User email or user ID
  version: number,     // Incremented on each update
  tags: string[],      // User-defined tags for categorization
  ...customFields      // Any additional metadata provided by client
}
```

### 3. API Endpoint Changes

#### POST /api/workflows (Create)
**File**: `sourse/Back-end/app/api/workflows/route.ts`

**Changes**:
- Automatically sets `author` to user's email or ID
- Initializes `version` to 1
- Initializes `tags` array (empty if not provided)
- Preserves any additional metadata fields from request

**Request Body**:
```json
{
  "name": "My Workflow",
  "description": "Optional description",
  "nodes": [...],
  "edges": [...],
  "metadata": {
    "tags": ["automation", "email"],
    "customField": "value"
  }
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "name": "My Workflow",
    "description": "Optional description",
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "author": "user@example.com",
      "version": 1,
      "tags": ["automation", "email"],
      "customField": "value"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/workflows (List)
**File**: `sourse/Back-end/app/api/workflows/route.ts`

**Changes**:
- Now includes `metadata` field in response
- Returns version and author information for each workflow

**Response**:
```json
{
  "data": {
    "workflows": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My Workflow",
        "description": "Optional description",
        "metadata": {
          "author": "user@example.com",
          "version": 3,
          "tags": ["automation", "email"]
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T15:45:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

#### GET /api/workflows/[id] (Get Single)
**File**: `sourse/Back-end/app/api/workflows/[id]/route.ts`

**Changes**:
- Returns complete workflow including all metadata fields
- Includes `created_at` and `updated_at` timestamps

**Response**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "name": "My Workflow",
    "description": "Optional description",
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "author": "user@example.com",
      "version": 3,
      "tags": ["automation", "email"]
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

#### PUT /api/workflows/[id] (Update)
**File**: `sourse/Back-end/app/api/workflows/[id]/route.ts`

**Changes**:
- Automatically increments `version` on every update
- Preserves original `author` field
- Merges new metadata with existing metadata
- Preserves tags if not provided in update
- `updated_at` is automatically updated by database trigger

**Request Body** (all fields optional):
```json
{
  "name": "Updated Workflow Name",
  "nodes": [...],
  "edges": [...],
  "metadata": {
    "tags": ["automation", "email", "reports"]
  }
}
```

**Response**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "name": "Updated Workflow Name",
    "description": "Optional description",
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "author": "user@example.com",
      "version": 4,
      "tags": ["automation", "email", "reports"]
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T16:00:00Z"
  }
}
```

### 4. Database Schema

**Table**: `workflows`

```sql
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Trigger**: Auto-update `updated_at`

```sql
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Versioning Strategy

### Version Increment Logic
1. **On Create**: Version starts at 1
2. **On Update**: Version increments by 1 for any modification
3. **Version Tracking**: Stored in `metadata.version` field

### Version History
- Current implementation stores version number in metadata
- For full version history (snapshots), a separate `workflow_versions` table would be needed (future enhancement)
- The database schema includes a `versions` table structure for future implementation

## Testing

### Manual Testing Steps

1. **Create Workflow**:
   ```bash
   curl -X POST http://localhost:3000/api/workflows \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Workflow",
       "nodes": [],
       "edges": [],
       "metadata": {"tags": ["test"]}
     }'
   ```
   - Verify: `id` is UUID, `version` is 1, `author` is set, timestamps are present

2. **List Workflows**:
   ```bash
   curl http://localhost:3000/api/workflows \
     -H "Authorization: Bearer <token>"
   ```
   - Verify: Response includes `metadata` with version and author

3. **Get Single Workflow**:
   ```bash
   curl http://localhost:3000/api/workflows/<workflow-id> \
     -H "Authorization: Bearer <token>"
   ```
   - Verify: Complete workflow with all metadata fields

4. **Update Workflow**:
   ```bash
   curl -X PUT http://localhost:3000/api/workflows/<workflow-id> \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Name"}'
   ```
   - Verify: `version` incremented, `updated_at` changed, `author` preserved

## Security Considerations

1. **Row Level Security (RLS)**: All workflows are protected by RLS policies ensuring users can only access their own workflows
2. **Author Field**: Set server-side from authenticated user, cannot be spoofed by client
3. **Version Integrity**: Version increments are handled server-side, preventing client manipulation

## Future Enhancements

1. **Full Version History**: Implement snapshot storage in `versions` table
2. **Version Comparison**: API endpoint to compare two versions
3. **Version Rollback**: Restore workflow to previous version
4. **Change Tracking**: Detailed changelog of what changed between versions
5. **Collaborative Editing**: Conflict resolution for concurrent edits

## Related Files

- `sourse/Back-end/app/api/workflows/route.ts` - Create and list endpoints
- `sourse/Back-end/app/api/workflows/[id]/route.ts` - Get, update, delete endpoints
- `sourse/Back-end/database-schema.sql` - Database schema and triggers
- `sourse/Back-end/types/index.ts` - TypeScript type definitions
