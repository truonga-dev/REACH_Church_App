-- Migration: Update Row Level Security (RLS) policies for livestreams table

-- Ensure RLS is enabled
ALTER TABLE public.livestreams ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users with admin/superadmin roles to insert, update, delete
CREATE POLICY "Allow admin to insert livestreams"
  ON public.livestreams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Allow admin to update livestreams"
  ON public.livestreams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Allow admin to delete livestreams"
  ON public.livestreams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
