# Environment Variables Setup Guide

## Why You're Seeing These Warnings

The warnings appear because environment variables are not configured. The app will still work, but AI features (Clerk chat) and database features will be disabled.

## Quick Fix

1. **Create a `.env` file** in the root directory (same level as `package.json`)

2. **Copy this content** into `.env`:

```env
VITE_SUPABASE_URL=https://ibvpnzvpkgyugouqdeqw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_cG7j7SsVhDTM10c3Wqk56w_eCO2Sn1x
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

3. **Get your Gemini API Key**:
   - Go to https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key and replace `your_gemini_api_key_here` in `.env`

4. **Restart your dev server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

## What Each Variable Does

- **VITE_SUPABASE_URL**: Your Supabase project URL (already provided)
- **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous/public key (already provided)
- **VITE_GEMINI_API_KEY**: Your Google Gemini API key (you need to get this)

## Important Notes

- ⚠️ **Never commit `.env` to git** - it's already in `.gitignore`
- ✅ The app works without these variables, but AI features will be disabled
- ✅ You can test the UI and frontend without API keys
- ✅ Once you add the keys, restart the dev server for changes to take effect

## Troubleshooting

### Still seeing warnings after creating .env?
1. Make sure the file is named exactly `.env` (not `.env.txt`)
2. Make sure it's in the root directory (same folder as `package.json`)
3. Restart the dev server completely
4. Check that there are no extra spaces or quotes around the values

### Clerk chat not working?
- Make sure `VITE_GEMINI_API_KEY` is set correctly
- Check browser console for any API errors
- Verify the API key is valid at https://makersuite.google.com/app/apikey

### Products not loading?
- Make sure Supabase variables are set
- Run the SQL scripts in Supabase dashboard (see SETUP.md)
- Check browser console for database errors
