CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_product_categories" ON public.product_categories;
CREATE POLICY "authenticated_select_product_categories" ON public.product_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_product_categories" ON public.product_categories;
CREATE POLICY "authenticated_insert_product_categories" ON public.product_categories FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_product_categories" ON public.product_categories;
CREATE POLICY "authenticated_update_product_categories" ON public.product_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_product_categories" ON public.product_categories;
CREATE POLICY "authenticated_delete_product_categories" ON public.product_categories FOR DELETE TO authenticated USING (true);
