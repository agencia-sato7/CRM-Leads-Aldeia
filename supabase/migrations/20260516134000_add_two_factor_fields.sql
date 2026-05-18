ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_code text,
ADD COLUMN IF NOT EXISTS two_factor_expires_at timestamptz;
