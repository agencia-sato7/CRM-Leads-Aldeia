DO $$
BEGIN
  INSERT INTO public.product_categories (name) VALUES
    ('Acessórios de banheiro'),
    ('Metais e Sanitários'),
    ('Pisos e Revestimentos'),
    ('Argamassas e Rejuntes'),
    ('Chuveiros e Duchas'),
    ('Cubas e Pias'),
    ('Banheiras'),
    ('Iluminação'),
    ('Tintas'),
    ('Ferramentas')
  ON CONFLICT (name) DO NOTHING;
END $$;
