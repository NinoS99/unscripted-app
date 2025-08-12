# Reddit-Style Threaded Comment System

This document describes the implementation of a Reddit-style threaded comment system for the Discussion model.

## Overview

The system implements:
- **Materialized Paths**: For efficient comment ordering and tree structure
- **Voting System**: Upvote/downvote functionality with Wilson score ranking
- **Reactions**: Emoji-based reactions with categories
- **Lazy Loading**: Deep threads are loaded on demand
- **Sorting**: New, Top, and Best (Wilson score) sorting options

## Database Schema Changes

### DiscussionComment Model
Added a `path` field for materialized path ordering:
```prisma
model DiscussionComment {
  // ... existing fields
  path         String                  // Materialized path for ordering (e.g., "000001.000123.000456")
  // ... rest of fields
}
```

### Indexes Added
- `@@index([path])`
- `@@index([discussionId, path])`
- `@@index([discussionId, createdAt])`

## API Endpoints

### Add Comment
```
POST /api/discussions/comments/add
{
  "discussionId": number,
  "content": string,
  "parentId": number (optional),
  "spoiler": boolean (optional)
}
```

### Get Comments
```
GET /api/discussions/comments/{discussionId}?sort=new&limit=20&offset=0&tree=true&parentId=123
```

### Vote on Comment
```
POST /api/discussions/comments/vote
{
  "commentId": number,
  "value": "UPVOTE" | "DOWNVOTE"
}
```

### Add/Update Reaction
```
POST /api/discussions/comments/reaction
{
  "commentId": number,
  "reactionTypeId": number
}
```

### Remove Reaction
```
DELETE /api/discussions/comments/reaction?commentId=123
```

### Get Reaction Types
```
GET /api/reaction-types
```

## Components

### DiscussionCommentsList
Main component for displaying the complete comment section with:
- Comment form
- Sorting options
- Pagination
- Comment tree

### DiscussionComment
Individual comment component with:
- Voting buttons
- Reply functionality
- Reactions display
- Nested replies

### CommentReactions
Reaction management component with:
- Reaction picker dropdown
- Category-based organization
- User reaction tracking

## Usage

### Basic Integration
```tsx
import DiscussionCommentsList from "@/components/DiscussionCommentsList";

function DiscussionPage({ discussionId }: { discussionId: number }) {
  return (
    <div>
      {/* Discussion content */}
      <DiscussionCommentsList discussionId={discussionId} />
    </div>
  );
}
```

### Advanced Usage
```tsx
import { getCommentsForDiscussion, buildCommentTree } from "@/lib/comments";

// Server-side comment fetching
const comments = await getCommentsForDiscussion(
  discussionId,
  "best", // sort mode
  undefined, // parentId for replies
  50, // limit
  0, // offset
  userId // current user ID
);

// Build tree structure
const commentTree = buildCommentTree(comments);
```

## Features

### Materialized Paths
- Comments are stored with paths like "000001.000123.000456"
- Enables efficient tree traversal and ordering
- Supports unlimited nesting (capped at 10 levels for UX)

### Voting System
- Upvote/downvote functionality
- Wilson score algorithm for "Best" sorting
- Real-time vote count updates

### Reactions
- Category-based reaction system
- Users can have one reaction per comment
- Expandable reaction picker with categories

### Lazy Loading
- Initial load shows up to 3 levels deep
- "Continue this thread" buttons for deeper replies
- Efficient pagination for large discussions

### Sorting Options
- **New**: Most recent comments first
- **Top**: Highest vote score first
- **Best**: Wilson score ranking (confidence-based)

## Migration Steps

1. **Update Schema**: Run the Prisma migration to add the `path` field
2. **Generate Client**: Run `prisma generate`
3. **Seed Reaction Types**: Add reaction types to the database
4. **Update Existing Comments**: Backfill `path` field for existing comments

## Performance Considerations

- Indexes on `path`, `discussionId`, and `createdAt`
- Efficient tree building with Map-based lookups
- Lazy loading prevents loading entire comment trees
- Pagination limits memory usage

## Security

- Authentication required for voting and commenting
- Input validation and sanitization
- Rate limiting on comment creation
- Maximum nesting depth prevention

## Future Enhancements

- Comment editing and deletion
- Comment moderation tools
- Notification system for replies
- Comment search functionality
- Comment bookmarking
