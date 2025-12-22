# EGZIT - AI-Powered Smart Moving Assistant

> Transforming Chaotic Moves into Streamlined, Intelligent Processes


## What is EGZIT?

EGZIT is an AI-powered web application designed to revolutionize the relocation experience by combining artificial intelligence, real-time tracking, and cloud-based logistics. The platform addresses the inefficiencies plaguing the traditional moving industry - from misplaced belongings and poor organization to suboptimal route planning and elevated costs.

## Database Architecture

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | Extends auth.users with display name/email. Created automatically via the `handle_new_user` trigger when users sign up. |
| `inventories` | Container for user's items. Each user gets one on signup via trigger. Items reference this via `inventory_id`. |
| `items` | Individual belongings with name, category, room, fragile flag, weight, QR code, image_url, and packed status. References `inventory_id` and optionally `box_id`. |
| `boxes` | Packing boxes with size, weight tracking, room assignment, and QR codes for scanning. |
| `moves` | Move requests with pickup/delivery addresses, move_date, status tracking, assigned_mover_id, and GPS coordinates (current_lat/lng) for live tracking. |
| `movers` | Moving company profiles including name, description, rating, review_count, min_price, verified/insured flags, and availability. |
| `mover_services` | Junction table linking movers to their offered services (packing, storage, fragile handling, etc.). |
| `mover_reviews` | Customer reviews for movers with ratings and comments. |
| `bookings` | Booking records linking users, moves, and movers with payment tracking via Stripe. |
| `quotes` | Quote generation for moves with itemized pricing breakdown. |
| `user_roles` | Role-based access control (admin/moderator/user). Uses `app_role` enum. |
| `move_tracking_events` | Timeline of move events with GPS coordinates and metadata. |
| `move_performance` | Analytics data for completed moves (duration, distance, ratings). |
| `chat_messages` | In-app messaging between users and admins/movers. |

### Security Implementation

- **Row Level Security (RLS)**: All tables have RLS enabled
- **User Isolation**: Users can only SELECT/INSERT/UPDATE/DELETE their own records (`WHERE user_id = auth.uid()`)
- **Admin Access**: Admins bypass restrictions via the `has_role()` function with `SECURITY DEFINER`
- **Public Data**: Movers table is publicly readable (for marketplace) but only admins can modify
- **RLS Recursion Prevention**: The `has_role()` function uses `SECURITY DEFINER` to avoid recursive policy checks

### Database Functions

```sql
-- Check if user has a specific role (prevents RLS recursion)
has_role(_user_id uuid, _role app_role) RETURNS boolean

-- Trigger: Creates profile + default inventory on user signup
handle_new_user() RETURNS trigger
```

### Foreign Key Relationships

- `items` → `inventories` (via `inventory_id`)
- `items` → `boxes` (via `box_id`, optional)
- `items` → `moves` (via `move_id`, optional)
- `boxes` → `inventories` (via `inventory_id`)
- `moves` → `movers` (via `assigned_mover_id`)
- `moves` → `inventories` (via `inventory_id`)
- `moves` → `quotes` (via `quote_id`)
- `mover_services` → `movers` (via `mover_id`)
- `mover_reviews` → `movers` (via `mover_id`)
- `bookings` → `moves` (via `move_id`)
- `bookings` → `movers` (via `mover_id`)
- `quotes` → `moves` (via `move_id`)
- `move_tracking_events` → `moves` (via `move_id`)
- `move_performance` → `moves` (via `move_id`)
- `chat_messages` → `moves` (via `move_id`)

## Key Features

- **AI-Powered Inventory Management**: Smart item cataloging with QR code generation, photo recognition, and automatic categorization
- **Intelligent Packing Assistant**: ML-based recommendations for optimal packing configurations and box sizing
- **Real-Time Item Tracking**: QR code-based tracking system for monitoring items throughout relocation
- **Smart Route Optimization**: Integration with mapping services for efficient routing
- **Moving Company Marketplace**: Platform connecting users with verified moving service providers
- **Secure Payments**: Stripe integration for payment processing
- **Live GPS Tracking**: Real-time mover location tracking with map visualization
- **Two-Factor Authentication**: Optional TOTP-based 2FA for enhanced account security

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **AI**:  (GPT/Gemini) for packing recommendations and categorization
- **Maps**: Leaflet + OpenStreetMap for routing and tracking
- **Payments**: Stripe for secure payment processing
- **PWA**: Progressive Web App with offline support

**Local Development**:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```
