ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS site text,
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS instagram text;
