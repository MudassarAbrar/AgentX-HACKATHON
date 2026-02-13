# AI Shopkeeper Backend Setup Guide

## Overview
This project implements a full-stack e-commerce platform with an AI Personal Shopper ("The Clerk") using Supabase backend and Google Gemini AI.

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Google Gemini API key

## Step 1: Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://ibvpnzvpkgyugouqdeqw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_cG7j7SsVhDTM10c3Wqk56w_eCO2Sn1x
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase/schema.sql` to create all tables
4. Run the SQL from `supabase/seed-products.sql` to insert initial products

### Enable pgvector Extension (for RAG)

In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 4: Install Supabase Dependencies

The following packages should already be in package.json:
- `@supabase/supabase-js` - Supabase client
- `@google/generative-ai` - Gemini SDK

If not installed, run:
```bash
npm install @supabase/supabase-js @google/generative-ai
```

## Step 5: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Features Implemented

### ✅ Backend (Supabase)
- Product management with rich metadata
- Cart management (guest sessions)
- Order processing
- Coupon system
- User activity tracking
- Product embeddings for RAG

### ✅ AI Clerk Agent
- Semantic product search using RAG
- Inventory checking
- Product recommendations
- Vibe Filter (real-time UI control)
- Add to cart without clicking buttons
- Haggle Mode (discount negotiation)

### ✅ Frontend Features
- Clerk chat widget (bottom-right)
- Product search and filtering
- Cart with coupon support
- Checkout flow
- Real-time UI updates from Clerk actions

## Testing the Features

### 1. Semantic Search
Open Clerk chat and try:
- "I need an outfit for a summer wedding in Italy"
- "Show me casual sneakers"
- "Find me a blue blazer"

### 2. Vibe Filter
Try these commands in Clerk chat:
- "Show me cheaper options" → UI sorts by price ascending
- "Filter by shoes category" → UI filters to shoes

### 3. Haggle Mode
Try:
- "It's my birthday, can I get a discount?"
- "I'm buying multiple items, any deals?"
- "First time customer, any welcome discount?"

The Clerk will analyze your request and generate a unique coupon code!

### 4. No-Menu Purchase
You can complete a purchase entirely through chat:
1. Ask Clerk to find a product
2. Ask Clerk to add it to cart
3. Go to checkout (cart will be populated)
4. Complete purchase

## Database Schema

The following tables are created:
- `products` - Product inventory
- `cart_items` - Shopping cart items
- `orders` - Customer orders
- `order_items` - Order line items
- `coupons` - Discount codes
- `user_activity` - User browsing/purchase history
- `product_embeddings` - Vector embeddings for semantic search

## Troubleshooting

### Clerk Chat Not Appearing
- Check that `VITE_GEMINI_API_KEY` is set in `.env`
- Check browser console for errors

### Products Not Loading
- Verify Supabase connection in `.env`
- Check that products were seeded in database
- Check browser console for API errors

### Coupons Not Working
- Ensure coupons table exists in Supabase
- Check that coupon codes are being generated correctly
- Verify coupon validation logic

## Next Steps

1. **Generate Embeddings**: For better semantic search, you can generate embeddings for products using a script (see `supabase/generate-embeddings-notes.md`)

2. **Add Authentication**: Currently using guest sessions. Add Supabase Auth for user accounts.

3. **Payment Integration**: Integrate Stripe or similar for real payments.

4. **Email Notifications**: Add email service for order confirmations.

## Hackathon Demo Flow

1. **Show Semantic Search**: "Find me something for a summer wedding"
2. **Show Vibe Filter**: "Show cheaper options" → UI updates
3. **Show Haggle Mode**: "It's my birthday" → Get coupon code
4. **Show No-Menu Purchase**: Complete purchase via chat only
5. **Show Recommendations**: Ask Clerk for suggestions

## Support

For issues or questions, check:
- Supabase logs in dashboard
- Browser console for frontend errors
- Network tab for API call issues
