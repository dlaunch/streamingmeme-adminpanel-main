# Newsletter Admin Panel

A modern, full-stack admin panel for managing newsletter articles built with Next.js 16.1, Supabase, and Drizzle ORM.

## Features

- **Article Management**: View, approve, decline, and archive articles with bulk actions support
- **Real-time Updates**: Live updates using Supabase Realtime when other admins modify articles
- **Top News Promotion**: Promote approved articles to the newsletter highlights section
- **AI Analytics**: View AI scoring metrics and summaries for articles
- **Sponsor Management**: Create and manage sponsored content for newsletters
- **Admin History**: Complete audit trail of all admin actions with filtering
- **Role-based Access Control**: Admin, Editor, and Viewer roles with different permissions
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth with @supabase/ssr
- **Styling**: Tailwind CSS v4.1+ with shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **State**: React Server Components + Server Actions
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account ([sign up here](https://supabase.com))
- Vercel account for deployment ([sign up here](https://vercel.com))

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd streamingmeme-adminpanel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project in your [Supabase Dashboard](https://app.supabase.com)

2. Once created, go to **Project Settings > Database** and copy your connection string

3. Go to **Project Settings > API** and copy:
   - Project URL
   - anon/public API key
   - service_role secret key (keep this secure!)

4. Set up the database schema by running the SQL in `drizzle/0000_init.sql`:
   - Go to **SQL Editor** in your Supabase dashboard
   - Paste the contents of `drizzle/0000_init.sql`
   - Click **Run** to execute the migration

5. Enable Realtime:
   - Go to **Database > Replication**
   - Ensure `articles`, `admin_history`, and `top_news_items` tables are enabled

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database (Direct Connection for Drizzle ORM)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_key_here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create Your First Admin User

1. Navigate to [http://localhost:3000/auth/sign-up](http://localhost:3000/auth/sign-up)
2. Create an account with your email and password
3. Check your email for verification (if email verification is enabled in Supabase)
4. Sign in at [http://localhost:3000/auth/sign-in](http://localhost:3000/auth/sign-in)

To make yourself an admin, run this SQL in your Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE user_profile_roles
SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'your-email@example.com');
```

## Database Schema

The application uses the following main tables:

- `articles` - Newsletter articles with status, classification, and AI metrics
- `top_news_items` - Featured articles for newsletter highlights
- `admin_history` - Audit trail of all admin actions
- `sponsors` - Sponsored content management
- `user_profiles` - User account information
- `user_roles` - Role definitions (admin, editor, viewer)
- `user_profile_roles` - User-to-role assignments

## Available Scripts

```bash
# Development with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Generate database migrations
npm run db:generate

# Run database migrations
npm run db:migrate

# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Deploying to Vercel

### 1. Push to GitHub

Push your code to a GitHub repository.

### 2. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New... > Project**
3. Import your GitHub repository
4. Vercel will automatically detect Next.js

### 3. Configure Environment Variables

In Vercel Project Settings > Environment Variables, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)

### 4. Deploy

Click **Deploy** and Vercel will build and deploy your application.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Protected admin routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── articles/      # Article management
│   │   ├── top-news/      # Top news management
│   │   ├── sponsors/      # Sponsor management
│   │   ├── admin-history/ # Audit trail
│   │   ├── users/         # User management
│   │   └── settings/      # User settings
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard components
│   ├── articles/         # Article components
│   ├── sponsors/         # Sponsor components
│   └── ...
├── lib/                   # Utility functions
│   ├── actions/          # Server Actions
│   ├── db/               # Database schema & client
│   ├── supabase/         # Supabase clients
│   └── validations/      # Zod schemas
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

## Key Features Explained

### Article Classification States

- **pending**: Awaiting initial review
- **approved**: Approved for newsletter publishing
- **declined**: Rejected with optional reason
- **archive_only**: Archived, not for publishing

### Article Status Flow

1. `pending_review` - Articles enter for review
2. `approved_for_publishing` - Approved articles ready for newsletter
3. `filtered_out` - Declined or archived articles
4. `published` - Articles that have been published

### Bulk Actions

Select multiple articles and perform batch operations:
- Bulk Approve
- Bulk Decline (with optional reason)
- Bulk Archive

### Real-time Updates

The application uses Supabase Realtime to push live updates:
- See when other admins modify articles
- Notification bell shows recent changes
- Connection status indicator in the header

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Service Role Key**: Only use on the server, never expose to the client
3. **Row Level Security**: RLS is enabled on all tables
4. **Authentication**: All admin routes require authentication via middleware

## Troubleshooting

### Common Issues

**Database connection errors:**
- Verify your `DATABASE_URL` is correct
- Check if your IP is allowed in Supabase (Database > Network)

**Authentication not working:**
- Ensure Supabase URL and keys are correct
- Check if cookies are being set properly

**Real-time not updating:**
- Verify tables are added to Supabase Realtime publication
- Check browser console for connection errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
## EDIT_FOR_VERCEL