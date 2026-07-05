-- Fix missing columns in ministries table
-- Run this if you are getting errors when updating a ministry

ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS "desc" TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS leader TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS mission TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Notify Supabase PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
