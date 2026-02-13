# Product Embeddings (RAG) Setup

This project is prepared for semantic search using pgvector. To generate embeddings
for the seeded products, you can use the `@google/generative-ai` SDK together with
the Supabase service role key **outside of the browser** (e.g. in a Node script).

High-level steps:

1. Ensure the `product_embeddings` table and `vector` extension are created
   by running `supabase/schema.sql` in the Supabase SQL editor.
2. Create a Node script (not bundled in Vite) that:
   - Reads all rows from `public.products`
   - Builds a text string like `${name}. ${description}. ${tags}. ${metadata.season} ...`
   - Calls the Gemini embeddings API with that text
   - Writes the resulting vector into `public.product_embeddings.embedding`
3. Run the script locally using environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY` (never expose this to the browser)
   - `VITE_SUPABASE_URL` (project URL)
   - `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`

At runtime, the Clerk agent uses Supabase SQL to perform a similarity search over
`product_embeddings` to power semantic queries like “outfit for a summer wedding in Italy”.

