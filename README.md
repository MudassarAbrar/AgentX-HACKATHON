# TrendZone - AI-Powered Fashion E-Commerce

TrendZone is a modern e-commerce platform with an AI Personal Shopper (The Clerk) that helps customers find products, negotiate deals, and enjoy a personalized shopping experience.

## Features

### Storefront
- **Product Catalog** - Browse curated fashion collections
- **Product Detail** - View product information, sizes, and related items
- **Shopping Cart** - Add items, apply coupons, and checkout
- **Responsive Design** - Works on all devices

### AI Personal Shopper (The Clerk)
- **Semantic Search** - "Show me summer outfits for a wedding in Italy"
- **Inventory Check** - "Do you have this in size M?"
- **Add to Cart via Chat** - "Add the blazer to my cart"
- **Vibe Filter** - "Show me cheaper options" (updates UI in real-time)
- **Haggle Mode** - Negotiate discounts for special occasions

### Admin Panel
- **Dashboard** - Overview of sales, orders, and products
- **Product Management** - Add, edit, delete products with image upload
- **Order Management** - View and update order status
- **Coupon Management** - Create and manage discount codes
- **Settings** - Configure store and AI behavior

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini 2.5 Flash

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (optional, works with mock data)
- Google Gemini API key (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd bold-canvas

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL scripts in order:
   - `supabase/schema.sql` - Create tables
   - `supabase/seed-products.sql` - Add sample products
   - `supabase/admin-setup.sql` - Set up admin features

## Admin Access

Navigate to `/admin/login` and use:
- **Email**: admin@trendzone.com
- **Password**: admin123

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── admin/       # Admin-specific components
│   └── ui/          # shadcn/ui components
├── contexts/        # React contexts (Auth, Cart, Filter)
├── lib/            
│   ├── ai/          # AI agent and RAG logic
│   └── api/         # API functions
├── pages/           # Page components
│   └── admin/       # Admin pages
└── hooks/           # Custom React hooks
```

## License

MIT License
