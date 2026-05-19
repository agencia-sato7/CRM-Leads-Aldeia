CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, name)
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_brands" ON public.brands;
CREATE POLICY "authenticated_select_brands" ON public.brands FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_brands" ON public.brands;
CREATE POLICY "authenticated_insert_brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_brands" ON public.brands;
CREATE POLICY "authenticated_update_brands" ON public.brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_brands" ON public.brands;
CREATE POLICY "authenticated_delete_brands" ON public.brands FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_products" ON public.products;
CREATE POLICY "authenticated_select_products" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_products" ON public.products;
CREATE POLICY "authenticated_insert_products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_products" ON public.products;
CREATE POLICY "authenticated_update_products" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_products" ON public.products;
CREATE POLICY "authenticated_delete_products" ON public.products FOR DELETE TO authenticated USING (true);

DO $$
DECLARE
  b_id uuid;
  r_id uuid;
BEGIN
  -- Insert Atlas
  INSERT INTO public.brands (name) VALUES ('Atlas') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Atlas';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pastilhas', 'Pastilha de porcelana, Pastilha para piscina, Pastilha para fachada, Pastilha hexagonal, Pastilha esmaltada'),
    (b_id, 'Pisos industrial', 'Piso para industrias, Piso para cozinhas industriais, Piso para cozinhas de restaurante, Porcelanato técnico')
  ON CONFLICT DO NOTHING;

  -- Insert Castelatto
  INSERT INTO public.brands (name) VALUES ('Castelatto') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Castelatto';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Concreto arquitetônico', 'Piso cimentício, Piso de cimento, Piso de concreto, Piso para deck, Piso para calçadas, Piso drenante, Piso atérmico, Decs atérmico, Revestimento cimentício, Revestimento de cimento, Revestimento de concreto, Revestimento para fachada')
  ON CONFLICT DO NOTHING;

  -- Insert Ceusa
  INSERT INTO public.brands (name) VALUES ('Ceusa') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Ceusa';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Porcelanato Ceusa, Piso Ceusa, Revestimento Ceusa, Azulejo Ceusa')
  ON CONFLICT DO NOTHING;

  -- Insert Colormix
  INSERT INTO public.brands (name) VALUES ('Colormix') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Colormix';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Revestimento espelhado, Revestimento de madrepérola, Piso orgânico, Porcelanato orgânico')
  ON CONFLICT DO NOTHING;

  -- Insert Deca Assentos
  INSERT INTO public.brands (name) VALUES ('Deca Assentos') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Deca Assentos';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Assentos sanitários', 'Assento Deca, Assento de vaso Deca, Assento sanitário Deca, Assento para bacia Deca')
  ON CONFLICT DO NOTHING;

  -- Insert Deca Louças
  INSERT INTO public.brands (name) VALUES ('Deca Louças') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Deca Louças';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Louças sanitárias e de cozinha', 'Bacia sanitária Deca, Vaso sanitário Deca, Bacia Deca, Vaso Deca, Bacia convencional Deca, Vaso convenciona Deca, Bacia com caixa acoplada Deca, Vaso com caixa acoplada Deca, Bacia suspensa Deca, Vaso suspenso Deca, Bacia PNE Deca, Vaso PNE Deca, Bacia para cadeirante Deca, Vaso para cadeirante Deca, Mictório Deca, Cuba Deca, Lavatório Deca, Lavatório suspenso Deca, Cuba de apoio Deca, Cuba de embutir Deca, Cuba de sobrepor Deca, Cuba semi encaixe Deca, Cuba de inox Deca, Pia de inox Deca, Cuba de cozinha Deca')
  ON CONFLICT DO NOTHING;

  -- Insert Deca Metais
  INSERT INTO public.brands (name) VALUES ('Deca Metais') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Deca Metais';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Metais sanitários e de cozinha', 'Metal sanitário Deca, Metal Deca, Torneira Deca, Torneira bica alta Deca, Torneira bica baixa Deca, Misturador Deca, Monocomando Deca, Monocomando de chuveiro Deca, Monocomando de banheira Deca, Torneira de cozinha Deca, Monocomando de cozinha Deca, Torneira gourmet Deca, Ducha higiênica Deca, Chuveiro Deca, Ducha Deca, Acabamento de registro Deca, Sifão Deca, Válvula de descarga Deca, Toalheiro Deca, Papeleira Deca, Prateleira Deca, Cabide Deca, Saboneteira Deca')
  ON CONFLICT DO NOTHING;

  -- Insert Docol Louças
  INSERT INTO public.brands (name) VALUES ('Docol Louças') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Docol Louças';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Louças sanitárias', 'Bacia sanitária Docol, Vaso sanitário Docol, Bacia Docol, Vaso Docol, Bacia convencional Docol, Vaso convenciona Docol, Bacia com caixa acoplada Docol, Vaso com caixa acoplada Docol, Cuba Docol, Cuba de apoio Docol, Cuba de embutir Docol, Cuba de sobrepor Docol, Cuba semi encaixe Docol, Banheira Docol, Banheira de imersão Docol')
  ON CONFLICT DO NOTHING;

  -- Insert Docol Metais
  INSERT INTO public.brands (name) VALUES ('Docol Metais') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Docol Metais';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Metais sanitários e de cozinha', 'Metal sanitário Docol, Metal Docol, Torneira Docol, Torneira bica alta Docol, Torneira bica baixa Docol, Misturador Docol, Monocomando Docol, Monocomando de chuveiro Docol, Monocomando de banheira Docol, Torneira de cozinha Docol, Monocomando de cozinha Docol, Torneira gourmet Docol, Ducha higiênica Docol, Chuveiro Docol, Ducha Docol, Acabamento de registro Docol, Sifão Docol, Válvula de descarga Docol, Toalheiro Docol, Papeleira Docol, Prateleira Docol, Cabide Docol, Saboneteira Docol, Alças de apoio Docol, Acessórios PNE Docol')
  ON CONFLICT DO NOTHING;

  -- Insert Doka
  INSERT INTO public.brands (name) VALUES ('Doka') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Doka';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Banheiras de imersão, Cubas de banheiro, Metais sanitários e Acessório de banheiro', 'Metal sanitário Doka, Metal Doka, Torneira Doka, Misturador Doka, Monocomando Doka, Monocomando de chuveiro Doka, Monocomando de banheira Doka, Ducha higiênica Doka, Chuveiro Doka, Ducha Doka, Acabamento de registro Doka, Sifão Doka, Válvula de descarga Doka, Toalheiro Doka, Papeleira Doka, Prateleira Doka, Cabide Doka, Saboneteira Doka, Cuba Doka, Cuba de geostone Doka, Cuba de apoio Doka, Banheira de imersão Doka, Banheira vitoriana Doka, Banheira com air massage Doka')
  ON CONFLICT DO NOTHING;

  -- Insert Donata Stones
  INSERT INTO public.brands (name) VALUES ('Donata Stones') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Donata Stones';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pedra industrializada', 'Piso Donata, Pedra Donata, Piso de polímero')
  ON CONFLICT DO NOTHING;

  -- Insert Eliane
  INSERT INTO public.brands (name) VALUES ('Eliane') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Eliane';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Piso Eliane, Porcelanato Eliane, Revestimento Eliane, Revestimento de piscina Eliane, Revestimento para fachada Incepa, Azulejo Eliane')
  ON CONFLICT DO NOTHING;

  -- Insert Franke
  INSERT INTO public.brands (name) VALUES ('Franke') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Franke';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Cubas de inox, Metais de cozinha Eletros de cozinha', 'Cuba Franke, Cuba de inox Franke, Cuba de cozinha Franke, Triturador de lixo, Triturador de lixo Franke, Torneira Franke, Torneira de cozinha Franke, Torneira gourmet Franke, Lixeira de bancada Franke, Lixeira embutida de inox, Lixeira embutida Franke, Monocomando Franke, Monocomando de cozinha Franke, Cooktop Franke, Cooktop de indução, Cooktop de indução Franke, Cooktop elétrico Franke, Cooktop à gás Franke, Forno elétrico Franke, Forno de embutir Franke, Microondas Franke, Gaveta aquecida Franke, Adega Franke, Coifa Franke, Coifa de teto Franke, Coifa de parede Franke, Coifa de embutir Franke, Coifa retrátil Franke, Galeria Franke')
  ON CONFLICT DO NOTHING;

  -- Insert Immersi
  INSERT INTO public.brands (name) VALUES ('Immersi') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Immersi';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Banheiras de imersão e metais para banheira', 'Banheira de imersão Immersi, Banheira vitoriana, Banheira vitoriana Immersi, Monocomando de piso para banheira Immersi, Monocomando de parede para banheira Immersi')
  ON CONFLICT DO NOTHING;

  -- Insert Incepa
  INSERT INTO public.brands (name) VALUES ('Incepa') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Incepa';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Piso Incepa, Porcelanato Incepa, Revestimento Incepa, Revestimento de piscina Incepa, Revestimento para fachada Incepa, Azulejo Incepa')
  ON CONFLICT DO NOTHING;

  -- Insert Insinkerator
  INSERT INTO public.brands (name) VALUES ('Insinkerator') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Insinkerator';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Trituradores de lixo', 'Triturador de lixo')
  ON CONFLICT DO NOTHING;

  -- Insert Jacuzzi
  INSERT INTO public.brands (name) VALUES ('Jacuzzi') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Jacuzzi';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Banheiras de hidromassagem, Banheiras de imersão e SPAs', 'Banheira de imersão Jacuzzi, Jacuzzi de imersão, Banheira de hidromassagem Jacuzzi, Banheira com coromoterapia, Hidromassagem Jacuzzi, Jacuzzi com hidromassagem, SPA Jacuzzi, Jacuzzi para área externa')
  ON CONFLICT DO NOTHING;

  -- Insert Kopa Revestimentos
  INSERT INTO public.brands (name) VALUES ('Kopa Revestimentos') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Kopa Revestimentos';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Decks, revestimentos e forros em madeira teca', 'Deck de madeira teca, Revestimento de madeira teca, Forro de madeira teca, Teto de madeira teca, Ripado de madeira teca')
  ON CONFLICT DO NOTHING;

  -- Insert Lepri
  INSERT INTO public.brands (name) VALUES ('Lepri') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Lepri';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos extrudados', 'Piso Lepri, Revestimento Lepri, Brick Lepri, Piso extrudado, Lajota Lepri')
  ON CONFLICT DO NOTHING;

  -- Insert Mekal
  INSERT INTO public.brands (name) VALUES ('Mekal') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Mekal';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Cubas de inox', 'Cuba Mekal, Cuba de inox Mekal, Cuba de cozinha Mekal, Lixeira de bancada Mekal, Lixeira embutida de inox, Lixeira embutida Mekal, Calha úmida de inox, Calha úmida Mekal')
  ON CONFLICT DO NOTHING;

  -- Insert Mosarte
  INSERT INTO public.brands (name) VALUES ('Mosarte') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Mosarte';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Mosaicos de mármore, pedras e porcelanatos', 'Mosaico de mármore, Mosaico de mármore Mosarte, Mosaico de porcelanato Mosarte, Revestimento de mármore Mosarte'),
    (b_id, 'Porcelanatos', 'Porcelanato Mosarte, Piso Mosarte')
  ON CONFLICT DO NOTHING;

  -- Insert Mozaik
  INSERT INTO public.brands (name) VALUES ('Mozaik') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Mozaik';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Ralos, grelhas e filetes em aço inox', 'Ralo de inox Mozaik, Ralo colorido de inox, Ralo de inox colorido, Ralo colorido Mozaik, Ralo oculto, Ralo oculto Mozaik, Grelha Mozaik, Grelha oculta Mozaik, Filete de aço inox Mozaik, Filete de aço Mozaik, Filete de aço colorido, Filete de aço colorido Mozaik')
  ON CONFLICT DO NOTHING;

  -- Insert Palimanan
  INSERT INTO public.brands (name) VALUES ('Palimanan') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Palimanan';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos em pedras e argilas', 'Piso Palimanan, Pedra Palimanan, Pedra hijau Palimanan, Pedra hitam Palimanan, Piso água marinha, Pedra para piscina Palimanan, Piso travertino Palimanan, Revestimento hijau Palimanan, Revestimento hitam Palimanan, Revestimento água marinha, Revestimento travertino Palimanan, Rockface Palimanan, Revestimento para fachada Palimanan, Seixo Palimanan, Brick Palimanan, Tijolo Palimanan, Mosaico de pedra Palimanan, Revestimento de pedra Palimanan, Revestimento para fachada Palimanan, Lâmina de pedra Palimanan, Piso de mármore Palimanan')
  ON CONFLICT DO NOTHING;

  -- Insert Portinari
  INSERT INTO public.brands (name) VALUES ('Portinari') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Portinari';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Piso Portinari, Porcelanato Portinari, Revestimento Portinari, Revestimento de piscina Portinari, Porcelanato para piscina Portinari, Revestimento para fachada Portinari, Porcelanato para fachada Portinari, Azulejo Portinari, Porcelanato grandes formatos Portinari, Grandes formatos Portinari, Lastra Portinari')
  ON CONFLICT DO NOTHING;

  -- Insert Portobello
  INSERT INTO public.brands (name) VALUES ('Portobello') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Portobello';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Piso Portobello, Porcelanato Portobello, Revestimento Portobello, Revestimento de piscina Portobello, Porcelanato para piscina Portobello, Revestimento para fachada Portobello, Porcelanato para fachada Portobello, Azulejo Portobello, Porcelanato grandes formatos Portobello, Grandes formatos Portobello, Lastra Portobello')
  ON CONFLICT DO NOTHING;

  -- Insert Portokoll
  INSERT INTO public.brands (name) VALUES ('Portokoll') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Portokoll';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Argamassas e rejuntes', 'Rejunte Portokoll, Rejunte para piscina Portokoll, Argamassa Portokoll')
  ON CONFLICT DO NOTHING;

  -- Insert Ritallio
  INSERT INTO public.brands (name) VALUES ('Ritallio') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Ritallio';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Revestimentos importados de pedra e cerâmica', 'Revestimento Ritallio, Azulejo Ritallio, Revestimento de mármore Ritallio, Tijolos de mármore Ritallio, Seixo Ritallio, Revestimento de pedra Ritallio, Revestimento para fachada Ritallio, Mosaico de mármore Ritallio, Mosaico de madrepérola')
  ON CONFLICT DO NOTHING;

  -- Insert Roca
  INSERT INTO public.brands (name) VALUES ('Roca') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Roca';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Piso Roca, Porcelanato Roca, Revestimento Roca, Revestimento de piscina Roca, Porcelanato para piscina Roca, Revestimento para fachada Roca, Porcelanato para fachada Roca, Azulejo Roca, Porcelanato grandes formatos Roca, Grandes formatos Roca, Lastra Roca')
  ON CONFLICT DO NOTHING;

  -- Insert Rubinettos
  INSERT INTO public.brands (name) VALUES ('Rubinettos') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Rubinettos';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Metais sanitários e de cozinha', 'Metal sanitário Rubinettos, Metal Rubinettos, Torneira Rubinettos, Torneira bica alta Rubinettos, Torneira bica baixa Rubinettos, Misturador Rubinettos, Monocomando Rubinettos, Monocomando de chuveiro Rubinettos, Monocomando de banheira Rubinettos, Torneira de cozinha Rubinettos, Monocomando de cozinha Rubinettos, Torneira gourmet Rubinettos, Ducha higiênica Rubinettos, Chuveiro Rubinettos, Ducha Rubinettos, Acabamento de registro Rubinettos, Toalheiro Rubinettos, Papeleira Rubinettos, Prateleira Rubinettos, Cabide Rubinettos, Saboneteira Rubinettos')
  ON CONFLICT DO NOTHING;

  -- Insert Santa Luzia
  INSERT INTO public.brands (name) VALUES ('Santa Luzia') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Santa Luzia';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Rodapés e revestimentos de poliestireno', 'Rodapé Santa Luzia, Boiserie Santa Luzia, Rodateto Santa Luzia, Revestimento Santa Luzia')
  ON CONFLICT DO NOTHING;

  -- Insert Sika
  INSERT INTO public.brands (name) VALUES ('Sika') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Sika';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Argamassas e rejuntes', 'Rejunte Sika, Rejunte para piscina Sika, Argamassa Sika')
  ON CONFLICT DO NOTHING;

  -- Insert Studio Morandin
  INSERT INTO public.brands (name) VALUES ('Studio Morandin') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Studio Morandin';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos em argila', 'Piso Studio Morandin, Revestimento Studio Morandin, Brick Studio Morandin, Piso de argila, Piso para deck em argila, Revestimento de argila, Piso extrudado, Revestimento extrudado, Lajota Studio Morandin')
  ON CONFLICT DO NOTHING;

  -- Insert Tarkett
  INSERT INTO public.brands (name) VALUES ('Tarkett') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Tarkett';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos vinílicos', 'Piso vinílico Tarkett, Paviflex, Paviflex Tarkett, Manta vinílica Tarkett, Manta vinílica')
  ON CONFLICT DO NOTHING;

  -- Insert Triângulo
  INSERT INTO public.brands (name) VALUES ('Triângulo') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Triângulo';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Madeira para pisos, revestimentos e tetos', 'Piso de madeira Triângulo, Piso Triângulo, Madeira Triângulo, Revestimento Triângulo, Forro Triângulo, Revestimento para teto Triângulo')
  ON CONFLICT DO NOTHING;

  -- Insert Villagrês
  INSERT INTO public.brands (name) VALUES ('Villagrês') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Villagrês';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Pisos e revestimentos', 'Piso Villagrês, Porcelanato Villagrês, Revestimento Villagrês, Revestimento de piscina Villagrês, Porcelanato para piscina Villagrês, Revestimento para fachada Villagrês, Porcelanato para fachada Villagrês, Porcelanato grandes formatos Villagrês, Grandes formatos Villagrês')
  ON CONFLICT DO NOTHING;

  -- Insert Zen Design
  INSERT INTO public.brands (name) VALUES ('Zen Design') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO b_id FROM public.brands WHERE name = 'Zen Design';
  INSERT INTO public.products (brand_id, name, search_terms) VALUES 
    (b_id, 'Acessórios de banheiro', 'Toalheiro Zen Design, Papeleira Zen Design, Prateleira Zen Design, Cabide Zen Design, Saboneteira Zen Design, Lixeira Zen Design, Porta sabonete líquido Zen Design, Saboneteira líquida Zen Design')
  ON CONFLICT DO NOTHING;

  -- Add role permissions for COMMERCIAL to manage products
  SELECT id INTO r_id FROM public.roles WHERE name = 'COMMERCIAL';
  IF FOUND THEN
    INSERT INTO public.role_permissions (role_id, resource, can_create, can_read, can_update, can_delete)
    VALUES (r_id, 'products', true, true, true, true)
    ON CONFLICT (role_id, resource) DO NOTHING;
  END IF;
END $$;
