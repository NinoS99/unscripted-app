# Codebase Map: Reality Punch App (unscripted)

## Overview

**Reality Punch App** (branded as "unscripted") is a Next.js 15 social platform for reality TV shows. It allows users to review, discuss, rate, and track TV shows, episodes, and seasons. The platform includes features like predictions, watchlists, discussions with threaded comments, reactions, polls, and a points/activity tracking system.

**Tech Stack:**
- **Framework**: Next.js 15.3.0 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (@clerk/nextjs 6.14.3)
- **Styling**: Tailwind CSS 4
- **UI Libraries**: Heroicons, React Icons, Framer Motion
- **External APIs**: TMDB (The Movie Database) for show data

---

## Project Structure

```
reality-punch-app/
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── scripts/             # Utility scripts (seeding, updates)
├── src/
│   ├── app/            # Next.js App Router pages and routes
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions and helpers
└── [config files]      # Next.js, TypeScript, ESLint configs
```

---

## Database Schema (Prisma)

### Core Entities

#### **User** (`User`)
- Authentication via Clerk (`id` = Clerk user ID)
- Profile: username, email, bio, social links (Instagram, Twitter)
- Activity tracking and privacy settings
- Following/followers relationships
- Points system integration

**Key Relationships:**
- One-to-many: Reviews, Ratings, Favorites, Watched, WatchLists
- Many-to-many: Following/Followers (via `UserFollow`)
- One-to-one: `UserPoints`, `UserActivityPrivacy[]`

#### **Show** (`Show`)
- TV show information synced from TMDB
- Fields: name, overview, air dates, ratings, poster/backdrop paths
- Tracks if show is running (`isRunning`)
- Competition shows flag (`isCompetition`)

**Relationships:**
- Has many: Seasons, Episodes (via Season)
- Many-to-many: Networks (`ShowsOnNetworks`), Creators (`ShowCreator`)
- One-to-many: Reviews, Ratings, Favorites, Watched, Discussions

#### **Season** (`Season`)
- Belongs to: Show
- Contains: Episodes
- Has its own reviews, ratings

#### **Episode** (`Episode`)
- Belongs to: Season (which belongs to Show)
- Has reviews, reactions, predictions
- Can be marked as watched

#### **Character** (`Character`)
- Represents contestants/actors on shows
- Linked to Person (actor) and Season
- Can be favorited, used in predictions/reviews

### Content Models

#### **Reviews** (`ShowReview`, `SeasonReview`, `EpisodeReview`)
- Three types: Show-level, Season-level, Episode-level
- Content, spoiler flag, timestamps
- Can have favorite characters and tags
- Support likes and comments

#### **Discussions** (`Discussion`)
- Thread-based discussions
- Can be attached to Show/Season/Episode
- Has tags, likes, polls
- Uses threaded comment system (see `THREADED_COMMENTS_README.md`)

#### **WatchLists** (`WatchList`)
- User-curated lists of shows
- Can include specific seasons per show
- Public/private visibility, friends-only option
- Supports tags, comments, likes

### Engagement Models

#### **Ratings** (`Rating`)
- 1-10 rating scale (Float)
- Can rate Show, Season, or Episode
- One rating per user per entity

#### **Favorites** (`Favorite`)
- Users can favorite Shows, Seasons, Episodes, Characters

#### **Watched** (`Watched`)
- Track what users have watched
- One record per user per Show/Season/Episode

#### **Likes** (`Like`)
- Universal like system
- Can like: Reviews, Discussions, WatchLists, Predictions

### Social Features

#### **Discussions & Comments** (`Discussion`, `DiscussionComment`)
- Reddit-style threaded comments
- Materialized path system for tree structure
- Voting system (upvote/downvote)
- Reactions (emoji-based)
- Sorting: New, Top, Best (Wilson score)

#### **Predictions** (`Prediction`)
- Prediction market for competition shows
- Based on prediction templates
- Tied to specific Episodes and Characters
- Share trading system (`PredictionShare`)
- Results system (`PredictionResult`) with AI/Wikipedia/Manual sources

#### **Polls** (`Poll`, `PollOption`, `PollVote`)
- Polls attached to Discussions
- Multiple choice options
- Voting system

#### **Reactions** (`Reaction`, `ReactionType`)
- Emoji-based reactions
- Categories: positive, negative, emotional, reality-tv
- Can react to Comments or Episodes

### Activity & Points System

#### **UserActivity** (`UserActivity`)
- Tracks all user actions
- Activity types: Reviews, Discussions, Likes, Predictions, Follows, etc.
- Grouped by: `ActivityGroup` (CONTENT_CREATION, ENGAGEMENT, DISENGAGEMENT, PREDICTION_MARKET, SOCIAL)
- Privacy controls per activity group

#### **UserPoints** (`UserPoints`)
- Current balance, total earned/spent
- Synced with `PointsTransaction` records

#### **PointsTransaction** (`PointsTransaction`)
- Detailed transaction history
- Types: EARNED, SPENT, BONUS, PENALTY, REFUND, DEDUCTED

### Metadata Models

#### **Tags** (`Tag`)
- Universal tagging system
- Used on: Reviews, Discussions, WatchLists, Characters

#### **Networks** (`Network`)
- TV networks/channels
- Many-to-many with Shows

#### **Creators** (`Creator`)
- Show creators/producers
- Many-to-many with Shows

---

## Application Architecture

### Next.js App Router Structure

#### **Pages (src/app/)**

**Public Pages:**
- `/` - Homepage with featured shows and "On Air" section
- `/sign-in` - Clerk authentication
- `/sign-up` - Clerk registration
- `/search` - Search shows/users
- `/show/[showId]` - Show detail page
- `/discussions/[entityType]` - Discussion listing by entity type
- `/reviews/[entityType]` - Review listing by entity type
- `/watch-lists` - Public watchlist browser
- `/watch-list/new` - Create new watchlist
- `/profile-sync` - Profile synchronization page

**User Profile Pages:**
- `/[username]` - User profile overview
- `/[username]/discussions` - User's discussions
- `/[username]/reviews` - User's reviews
- `/[username]/watch-lists` - User's watchlists
- `/[username]/discussion/[discussionType]` - Specific discussion type
- `/[username]/review/[reviewType]` - Specific review type
- `/[username]/watch-list/[watchListId]` - Watchlist detail

### API Routes (src/app/api/)

#### **User Management**
- `GET/PUT /api/profile/[userId]` - User profile operations
- `POST /api/profile/sync` - Sync Clerk profile to DB

#### **User Social**
- `GET/POST/DELETE /api/users/[username]/follow` - Follow/unfollow
- `GET /api/users/[username]/follow-status` - Check follow status
- `GET /api/users/[username]/followers` - Get followers
- `GET /api/users/[username]/following` - Get following

#### **User Content**
- `GET /api/users/[username]/all-reviews` - All user reviews
- `GET /api/users/[username]/all-discussions` - All user discussions
- `GET /api/users/[username]/watch-lists` - User watchlists
- `GET /api/users/[username]/activities` - User activity feed
- `GET /api/users/[username]/stats` - User statistics
- `GET /api/users/[username]/tags` - User's tags
- `GET /api/users/[username]/popular-content` - Popular content by user
- `GET /api/users/[username]/recent-content` - Recent content
- `GET /api/users/[username]/watched-timeline` - Watch history timeline

#### **Privacy Settings**
- `GET/PUT /api/users/[username]/privacy` - Activity privacy settings
- `GET/PUT /api/users/[username]/activity-privacy` - Activity group privacy

#### **Shows**
- `GET /api/shows/[showId]/seasons` - Get show seasons
- `GET/POST /api/shows/[showId]/episodes` - Episode operations

#### **Reviews**
- `POST /api/reviews/show` - Create show review
- `GET/PUT/DELETE /api/reviews/show/[reviewId]` - Show review CRUD
- `POST /api/reviews/season` - Create season review
- `GET/PUT/DELETE /api/reviews/season/[reviewId]` - Season review CRUD
- `POST /api/reviews/episode` - Create episode review
- `GET/PUT/DELETE /api/reviews/episode/[reviewId]` - Episode review CRUD
- `GET/PUT/DELETE /api/reviews/comments/[commentId]` - Review comment operations

#### **Discussions**
- `GET /api/discussions/[entityType]` - Get discussions by entity type
- `POST /api/discussions/route` - Create discussion
- `GET/PUT/DELETE /api/discussions/[discussionId]` - Discussion CRUD
- `DELETE /api/discussions/delete/[discussionId]` - Delete discussion

#### **Discussion Comments**
- `GET /api/discussions/comments/[discussionId]` - Get comments (supports sorting, pagination, tree loading)
- `POST /api/discussions/comments/add` - Add comment
- `DELETE /api/discussions/comments/delete/[commentId]` - Delete comment
- `POST /api/discussions/comments/vote` - Vote on comment
- `POST /api/discussions/comments/reaction` - Add reaction
- `DELETE /api/discussions/comments/reaction` - Remove reaction

#### **WatchLists**
- `GET/POST /api/watch-lists` - List/create watchlists
- `GET/PUT/DELETE /api/watch-lists/[watchListId]` - Watchlist CRUD
- `POST /api/watch-lists/[watchListId]/shows` - Add show to watchlist
- `GET/POST /api/watch-lists/comments` - Watchlist comments
- `DELETE /api/watch-lists/comments/[commentId]` - Delete comment

#### **Watched Status**
- `POST /api/watched` - Mark as watched
- `GET /api/watched/check` - Check watched status
- `POST /api/watched/mark-episode-watched` - Mark episode
- `POST /api/watched/mark-season-watched` - Mark season
- `DELETE /api/watched/unwatch-episode-cascade` - Unwatch episode
- `GET /api/watched/check-can-unwatch` - Check if can unwatch
- `GET /api/watched/check-unwatched` - Check unwatched items

#### **Engagement**
- `POST /api/likes` - Like/unlike entity
- `POST /api/favourites` - Favorite/unfavorite
- `POST /api/ratings` - Create/update rating
- `GET /api/reaction-types` - Get reaction types

#### **Polls**
- `POST /api/polls/vote` - Vote on poll
- `GET /api/polls/user-vote` - Get user's vote

#### **Activity & Points**
- `GET /api/activity-groups` - Get activity groups

#### **Search**
- `GET /api/search` - Search shows/users

#### **Top Four Shows**
- `POST /api/users/top-four-shows` - Set user's top 4 shows

### Components (src/components/)

#### **Layout & Navigation**
- `Navbar.tsx` - Main navigation bar
- `Footer.tsx` - Site footer
- `ProfilePopup.tsx` - User profile popup menu

#### **Show Display**
- `MobileShowCard.tsx` - Mobile-optimized show card
- `ShowActionButtons.tsx` - Action buttons for shows
- `SeasonNavigation.tsx` - Navigate between seasons
- `EpisodeNavigation.tsx` - Navigate between episodes
- `EpisodesOfSeason.tsx` - Episode list for season
- `SeasonEpisodesOfShow.tsx` - All episodes display

#### **Reviews**
- `ReviewDisplay.tsx` - Display review content
- `ReviewRow.tsx` - Review list item
- `ReviewButton.tsx` - Create/edit review button
- `ShowReview.tsx` - Show-level review component
- `SeasonReview.tsx` - Season-level review component
- `EpisodeReview.tsx` - Episode-level review component
- `EpisodeReviewButton.tsx` - Episode review button
- `SeasonReviewButton.tsx` - Season review button
- `ReviewsPage.tsx` - Review listing page
- `ReviewLink.tsx` - Link to review
- `RatingComponent.tsx` - Rating input/display
- `RatingDistributionChart.tsx` - Rating distribution visualization

#### **Discussions**
- `DiscussionDisplay.tsx` - Display discussion content
- `DiscussionRow.tsx` - Discussion list item
- `DiscussionFormModal.tsx` - Create/edit discussion modal
- `StartDiscussionButton.tsx` - Start discussion button
- `DiscussionsPage.tsx` - Discussion listing page
- `EntityDiscussions.tsx` - Discussions for an entity
- `UserDiscussionsClient.tsx` - User discussions client component

#### **Discussion Comments**
- `DiscussionComment.tsx` - Individual comment with threading
- `DiscussionCommentsList.tsx` - Complete comment system with sorting/pagination
- `CommentReactions.tsx` - Reaction picker/display

#### **WatchLists**
- `WatchListDetail.tsx` - Watchlist detail view
- `UserWatchLists.tsx` - User's watchlists
- `CreateWatchListForm.tsx` - Create watchlist form
- `EditWatchListForm.tsx` - Edit watchlist form
- `AddToWatchListButton.tsx` - Add show to watchlist button
- `AddToWatchListModal.tsx` - Add to watchlist modal

#### **User Profile**
- `UserProfileHeader.tsx` - Profile header with stats
- `UserContent.tsx` - User content tabs
- `UserStats.tsx` - User statistics display
- `UserTags.tsx` - User's tags
- `UserShowcase.tsx` - User showcase (top 4 shows)
- `UserActivityFeed.tsx` - Activity feed
- `UserDiary.tsx` - User diary view
- `UserReviewsClient.tsx` - User reviews client component
- `EditProfileForm.tsx` - Edit profile form
- `ProfileSyncButton.tsx` - Sync profile button
- `FollowModal.tsx` - Follow/unfollow modal

#### **Engagement**
- `LikeButton.tsx` - Like/unlike button
- `FavouriteButton.tsx` - Favorite button
- `WatchedButton.tsx` - Watched status button
- `WatchedStatusDisplay.tsx` - Display watched status
- `CompletionReviewPrompt.tsx` - Prompt to review completed shows

#### **Modals & Forms**
- `DeleteEntityModal.tsx` - Confirmation modal for deletion
- `ErrorNotification.tsx` - Error notification component

#### **Search**
- `SearchBar.tsx` - Search input component

### Library Utilities (src/lib/)

#### **Database**
- `client.ts` - Prisma client singleton instance

#### **Server Actions**
- `actions.ts` - Server actions (e.g., `updateUserProfile`)

#### **Comments System**
- `comments.ts` - Comment fetching, tree building, Wilson score calculations

#### **Activity Tracking**
- `activityTracker.ts` - Activity logging and points calculation
- `activityFilters.ts` - Activity filtering utilities

#### **Utilities**
- `utils.ts` - General utility functions

### Hooks (src/hooks/)

- `useDynamicMaxDepth.ts` - Dynamic comment nesting depth
- `useEscapeKey.ts` - Escape key handler
- `useModalScrollPrevention.ts` - Prevent background scrolling in modals
- `useReactionTypes.ts` - Fetch and manage reaction types

### Scripts (scripts/)

- `seedShows.ts` - Seed shows from TMDB
- `seedReactions.ts` - Seed reaction types
- `seedPredictionTemplates.ts` - Seed prediction templates
- `seedActivityGroupMapping.ts` - Seed activity group mappings
- `updateShows.ts` - Update show data from TMDB
- `syncCharacters.ts` - Sync characters from TMDB
- `updateIsCompetition.ts` - Update competition flag for shows
- `testNewActivityTypes.ts` - Test activity types

### Configuration Files

- `next.config.ts` - Next.js configuration (image domains, server packages)
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `prisma/schema.prisma` - Database schema
- `middleware.ts` - Clerk authentication middleware

---

## Key Features

### 1. **Show Management**
- TMDB integration for show data
- Automatic updates via scripts
- Show details: ratings, networks, creators, seasons, episodes

### 2. **Reviews System**
- Three-level reviews: Show, Season, Episode
- Character favorites in reviews
- Tags and spoiler warnings
- Likes and comments

### 3. **Discussions & Threaded Comments**
- Reddit-style threaded discussions
- Materialized path for efficient tree traversal
- Voting system (upvote/downvote) with Wilson score
- Reactions (emoji-based, categorized)
- Sorting: New, Top, Best
- Lazy loading for deep threads

### 4. **Watchlists**
- User-curated lists
- Public/private/friends-only visibility
- Tags and comments
- Multiple seasons per show support

### 5. **Predictions Market**
- Prediction templates for competition shows
- Character-based predictions
- Share trading system (YES/NO shares)
- Results tracking (AI, Wikipedia, Manual)
- Pre-close and post-close comments

### 6. **Activity & Points System**
- Comprehensive activity tracking
- Activity groups: Content Creation, Engagement, Disengagement, Prediction Market, Social
- Privacy controls per activity group
- Points earned for activities
- Transaction history

### 7. **Social Features**
- Follow/unfollow system
- User profiles with stats
- Activity feeds
- Tag-based content discovery

### 8. **Watched Status Tracking**
- Mark shows/seasons/episodes as watched
- Cascade unwatching
- Auto-complete suggestions
- Timeline view

---

## Data Flow

### Authentication Flow
1. User signs in via Clerk
2. Clerk webhook syncs user to database (`/api/webhooks/clerk`)
3. Profile data stored in `User` table with Clerk ID as primary key

### Show Data Flow
1. Scripts fetch from TMDB API
2. Store in `Show`, `Season`, `Episode`, `Character`, `Person`, `Creator`, `Network` tables
3. Update logs tracked in `UpdateShowsLog`

### Content Creation Flow
1. User creates Review/Discussion/WatchList
2. Server action creates record in database
3. Activity logged in `UserActivity`
4. Points calculated and added to `UserPoints`
5. Transaction recorded in `PointsTransaction`

### Comment Threading Flow
1. Comment created with `parentId`
2. `path` field generated (materialized path)
3. Tree built client-side from sorted path array
4. Lazy loading loads deeper threads on demand

---

## External Integrations

### **Clerk Authentication**
- User authentication and management
- Profile images (via `imageUrl`)
- Webhook for user sync

### **TMDB (The Movie Database)**
- Show metadata (details, seasons, episodes)
- Images (posters, backdrops, stills)
- Network and creator information
- Character/cast data

---

## Security & Middleware

### Authentication
- Clerk middleware protects routes
- API routes check for authenticated users via `auth()` from Clerk

### Authorization
- Users can only edit/delete their own content
- Privacy settings control activity visibility
- Friends-only watchlists respect following relationships

---

## Performance Optimizations

### Database
- Comprehensive indexes on frequently queried fields
- Composite indexes for common query patterns
- Unique constraints prevent duplicates

### Frontend
- Next.js Image optimization
- Server-side rendering for initial page loads
- Client-side pagination for large lists
- Lazy loading for comment threads

---

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production (includes Prisma generate & migrate)
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seedShows    # Seed shows from TMDB
npm run updateIsCompetition  # Update competition flags
```

---

## Environment Variables (Expected)

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Clerk sign-in URL
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Clerk sign-up URL
- `CLERK_WEBHOOK_SECRET` - Clerk webhook secret
- `TMDB_API_KEY` - TMDB API key (for scripts)

---

## Future Enhancements (Noted in Code)

- Comment editing and deletion (currently deletion is soft-delete)
- Enhanced comment moderation tools
- Notification system for replies/mentions
- Comment search functionality
- Comment bookmarking
- AI-powered prediction result analysis
- Enhanced recommendation engine

---

## Notes

- The app uses Clerk's `imageUrl` for profile pictures (defaults to icon if none set)
- Profile sync page allows manual sync from Clerk to database
- Activity privacy can be controlled per activity group
- Predictions are specifically designed for competition reality shows
- Threaded comments support up to 10 levels of nesting (configurable)
