-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'main_admin');

-- Create user_roles table (secure role management)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create movies table
CREATE TABLE public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    poster_url TEXT,
    trailer_url TEXT,
    video_url TEXT,
    genre TEXT[] DEFAULT '{}',
    release_year INTEGER,
    rating NUMERIC(3,1) DEFAULT 0,
    duration TEXT,
    is_4k BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'movie' CHECK (category IN ('movie', 'series', 'anime')),
    cast_members JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on movies
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Create app_settings table for AdMob/AdSense IDs
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for media assets
INSERT INTO storage.buckets (id, name, public) VALUES ('media-assets', 'media-assets', true);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin or main_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'main_admin')
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
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
      WHEN 'admin' THEN 2 
      ELSE 3 
    END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Main admin can view all roles" 
ON public.user_roles FOR SELECT 
USING (public.has_role(auth.uid(), 'main_admin'));

CREATE POLICY "Main admin can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'main_admin'));

CREATE POLICY "Main admin can update roles" 
ON public.user_roles FOR UPDATE 
USING (public.has_role(auth.uid(), 'main_admin'));

CREATE POLICY "Main admin can delete roles" 
ON public.user_roles FOR DELETE 
USING (public.has_role(auth.uid(), 'main_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for movies
CREATE POLICY "Anyone can view movies" 
ON public.movies FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert movies" 
ON public.movies FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update movies" 
ON public.movies FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete movies" 
ON public.movies FOR DELETE 
USING (public.is_admin(auth.uid()));

-- RLS Policies for app_settings
CREATE POLICY "Anyone can view app_settings" 
ON public.app_settings FOR SELECT 
USING (true);

CREATE POLICY "Main admin can manage app_settings" 
ON public.app_settings FOR ALL 
USING (public.has_role(auth.uid(), 'main_admin'));

-- Storage policies for media-assets bucket
CREATE POLICY "Anyone can view media assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media-assets');

CREATE POLICY "Admins can upload media assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media-assets' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update media assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'media-assets' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete media assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media-assets' AND public.is_admin(auth.uid()));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Check if this is the main admin email
  IF NEW.email = 'jd1680711@gmail.com' THEN
    user_role := 'main_admin';
  ELSE
    user_role := 'user';
  END IF;
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ad settings
INSERT INTO public.app_settings (setting_key, setting_value) VALUES 
  ('admob_ad_id', ''),
  ('admob_app_id', '');