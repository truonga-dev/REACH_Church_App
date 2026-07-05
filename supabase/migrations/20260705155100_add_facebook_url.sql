-- Migration: Add facebook_url to livestreams table

ALTER TABLE public.livestreams 
ADD COLUMN IF NOT EXISTS facebook_url TEXT;
