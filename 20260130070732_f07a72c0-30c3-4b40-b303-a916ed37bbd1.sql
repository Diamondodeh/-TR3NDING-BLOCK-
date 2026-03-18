-- Create favorites table
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Create deleted_movies table (stores names of movies deleted by user)
CREATE TABLE public.deleted_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_title text NOT NULL,
  deleted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on deleted_movies
ALTER TABLE public.deleted_movies ENABLE ROW LEVEL SECURITY;

-- RLS policies for deleted_movies
CREATE POLICY "Users can view their own deleted movies"
ON public.deleted_movies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add deleted movies"
ON public.deleted_movies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from deleted movies list"
ON public.deleted_movies FOR DELETE
USING (auth.uid() = user_id);

-- Create episodes table for series
CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  season_number integer NOT NULL DEFAULT 1,
  episode_number integer NOT NULL DEFAULT 1,
  title text,
  video_url text,
  duration text,
  file_size_360p text DEFAULT '~250 MB',
  file_size_480p text DEFAULT '~500 MB',
  file_size_720p text DEFAULT '~800 MB',
  file_size_1080p text DEFAULT '~1.5 GB',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(movie_id, season_number, episode_number)
);

-- Enable RLS on episodes
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- RLS policies for episodes
CREATE POLICY "Anyone can view episodes"
ON public.episodes FOR SELECT
USING (true);

CREATE POLICY "Admins can insert episodes"
ON public.episodes FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update episodes"
ON public.episodes FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete episodes"
ON public.episodes FOR DELETE
USING (is_admin(auth.uid()));

-- Create downloads table to track downloaded movies
CREATE TABLE public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id uuid REFERENCES public.movies(id) ON DELETE SET NULL,
  episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL,
  movie_title text NOT NULL,
  quality text NOT NULL,
  file_size text,
  video_url text,
  poster_url text,
  downloaded_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'completed'
);

-- Enable RLS on downloads
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies for downloads
CREATE POLICY "Users can view their own downloads"
ON public.downloads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add downloads"
ON public.downloads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their downloads"
ON public.downloads FOR DELETE
USING (auth.uid() = user_id);

-- Update get_user_role function to include executive_admin
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'main_admin' THEN 1 
      WHEN 'executive_admin' THEN 2
      WHEN 'admin' THEN 3 
      ELSE 4 
    END
  LIMIT 1
$$;

-- Update is_admin function to include executive_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'executive_admin', 'main_admin')
  )
$$;

-- Create function to check if user is executive admin or above
CREATE OR REPLACE FUNCTION public.is_executive_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('executive_admin', 'main_admin')
  )
$$;