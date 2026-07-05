-- Migration: Add multilingual columns (English & Korean) to key tables

-- 1. events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_ko TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ko TEXT,
ADD COLUMN IF NOT EXISTS location_en TEXT,
ADD COLUMN IF NOT EXISTS location_ko TEXT;

-- 2. news
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_ko TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT,
ADD COLUMN IF NOT EXISTS content_ko TEXT;

-- 3. livestreams
ALTER TABLE public.livestreams 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_ko TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ko TEXT;

-- 4. devotionals
ALTER TABLE public.devotionals 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_ko TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT,
ADD COLUMN IF NOT EXISTS content_ko TEXT;

-- 5. sermons
ALTER TABLE public.sermons 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_ko TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ko TEXT;
