-- Add is_todays_pick column to movies table for "Today's Pick" feature
ALTER TABLE public.movies ADD COLUMN is_todays_pick boolean DEFAULT false;

-- Create index for faster querying of today's pick
CREATE INDEX idx_movies_todays_pick ON public.movies(is_todays_pick) WHERE is_todays_pick = true;