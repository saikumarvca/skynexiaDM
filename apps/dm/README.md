# Skynexia Digital Marketing Review Management Dashboard

A comprehensive internal client-specific digital marketing review management dashboard built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and MongoDB.

## Features

### Client Management
- Create, edit, and manage client accounts
- Client status tracking (Active, Inactive, Archived)
- Comprehensive client information storage

### Review Management
- AI-generated review storage and management
- Bulk import functionality for multiple reviews
- Review status tracking (Unused, Used, Archived)
- Categorization and language support

### Usage Tracking
- Mark reviews as used with detailed metadata
- Track usage by platform, team member, and profile
- Comprehensive usage history and analytics

### Dashboard Analytics
- Real-time statistics and metrics
- Client-wise and system-wide analytics
- Recent activity monitoring

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: MongoDB with Mongoose ODM
- **Icons**: Lucide React
- **Build Tool**: Turborepo

## Project Structure

```
apps/dm/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── clients/           # Client management pages
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility libraries
├── models/               # Mongoose models
├── types/                # TypeScript type definitions
└── ...
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd apps/dm
npm install
```

2. Set up environment variables:
Create `.env.local` with:
```env
MONGODB_URI=mongodb://localhost:27017/skynexia-dm
NEXT_PUBLIC_API_URL=http://localhost:3152
AUTH_SECRET=change-me-to-a-random-long-secret
```

3. Start MongoDB service

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3152](http://localhost:3152) in your browser

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get client details
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Archive client

### Reviews
- `GET /api/reviews` - List reviews (with filters)
- `POST /api/reviews` - Create review
- `POST /api/reviews/bulk` - Bulk import reviews
- `GET /api/reviews/[id]` - Get review details
- `PATCH /api/reviews/[id]` - Update review
- `DELETE /api/reviews/[id]` - Archive review
- `POST /api/reviews/mark-used` - Mark review as used

### Analytics
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/review-usage` - Usage history

## Database Schema

### Client
```javascript
{
  name: String,
  businessName: String,
  brandName: String,
  contactName: String,
  phone: String,
  email: String,
  notes: String,
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
  createdAt: Date,
  updatedAt: Date
}
```

### Review
```javascript
{
  clientId: ObjectId,
  shortLabel: String,
  reviewText: String,
  category: String,
  language: String,
  ratingStyle: String,
  status: 'UNUSED' | 'USED' | 'ARCHIVED',
  createdAt: Date,
  updatedAt: Date
}
```

### ReviewUsage
```javascript
{
  clientId: ObjectId,
  reviewId: ObjectId,
  sourceName: String,
  usedBy: String,
  profileName: String,
  usedAt: Date,
  notes: String,
  createdAt: Date
}
```

## Key Features Implemented

✅ Client-first architecture
✅ MongoDB with Mongoose models
✅ Responsive admin dashboard
✅ Bulk review import
✅ Review usage tracking
✅ Status management
✅ Search and filtering
✅ Professional UI with shadcn/ui
✅ TypeScript throughout
✅ API routes with proper error handling

## Usage Workflow

1. **Create Client**: Admin creates a new client account
2. **Add Reviews**: Upload AI-generated reviews for the client
3. **Track Usage**: Mark reviews as used when deployed by marketing team
4. **Monitor Analytics**: View usage statistics and client performance

## Development

### Adding New Components
Components are located in `components/` directory. Use shadcn/ui for consistent styling.

### API Development
API routes follow Next.js App Router conventions in `app/api/`.

### Database Changes
Update Mongoose models in `models/` and corresponding types in `types/`.

## Deployment

Build for production:
```bash
npm run build
npm start
```

Ensure MongoDB connection string is properly configured for production environment.
