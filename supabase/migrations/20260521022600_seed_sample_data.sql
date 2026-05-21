DO $$
DECLARE
  v_admin_id uuid;
  v_comercial_id uuid;
  v_brand_id uuid;
  v_category_id uuid;
  v_product_id uuid;
  
  v_lead_novo1_id uuid := 'aaaa0001-0000-0000-0000-000000000000'::uuid;
  v_lead_novo2_id uuid := 'aaaa0002-0000-0000-0000-000000000000'::uuid;
  v_lead_negociacao1_id uuid := 'aaaa0003-0000-0000-0000-000000000000'::uuid;
  v_lead_negociacao2_id uuid := 'aaaa0004-0000-0000-0000-000000000000'::uuid;
  v_lead_ganho_id uuid := 'aaaa0005-0000-0000-0000-000000000000'::uuid;
  v_lead_perdido_id uuid := 'aaaa0006-0000-0000-0000-000000000000'::uuid;

  v_opp_ganha_id uuid;
BEGIN
  -- 1. ADMIN USER SEED
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'diretor@sato7.com.br';
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'diretor@sato7.com.br',
      crypt('Skip@Pass', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Diretor", "role": "ADMIN"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    
    -- Insert into profiles in case the handle_new_user trigger misses it due to transaction timing
    INSERT INTO public.profiles (id, email, name, role) 
    VALUES (v_admin_id, 'diretor@sato7.com.br', 'Diretor', 'ADMIN')
    ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
  END IF;

  -- 2. COMMERCIAL USER SEED
  SELECT id INTO v_comercial_id FROM auth.users WHERE email = 'comercial@sato7.com.br';
  IF v_comercial_id IS NULL THEN
    v_comercial_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_comercial_id, '00000000-0000-0000-0000-000000000000', 'comercial@sato7.com.br',
      crypt('Skip@Pass', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Comercial", "role": "COMMERCIAL"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, role) 
    VALUES (v_comercial_id, 'comercial@sato7.com.br', 'Comercial', 'COMMERCIAL')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 3. BRANDS, CATEGORIES, AND PRODUCTS SEED
  SELECT id INTO v_brand_id FROM public.brands WHERE name = 'Aldeia Acabamentos';
  IF v_brand_id IS NULL THEN
    v_brand_id := 'bbbb0001-0000-0000-0000-000000000000'::uuid;
    INSERT INTO public.brands (id, name) VALUES (v_brand_id, 'Aldeia Acabamentos') ON CONFLICT (id) DO NOTHING;
  END IF;

  SELECT id INTO v_category_id FROM public.product_categories WHERE name = 'Serviços de Marketing';
  IF v_category_id IS NULL THEN
    v_category_id := 'cccc0001-0000-0000-0000-000000000000'::uuid;
    INSERT INTO public.product_categories (id, name) VALUES (v_category_id, 'Serviços de Marketing') ON CONFLICT (id) DO NOTHING;
  END IF;

  SELECT id INTO v_product_id FROM public.products WHERE name = 'Consultoria SEO' AND brand_id = v_brand_id;
  IF v_product_id IS NULL THEN
    v_product_id := 'dddd0001-0000-0000-0000-000000000000'::uuid;
    INSERT INTO public.products (id, name, brand_id, category_id, price) 
    VALUES (v_product_id, 'Consultoria SEO', v_brand_id, v_category_id, 5000.00) 
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 4. LEADS SEED (Start as 'Novo')
  INSERT INTO public.leads (id, user_id, contact, company, email, phone, status, origin, product_id, estimated_value)
  VALUES 
    (v_lead_novo1_id, v_comercial_id, 'João Silva', 'Construtora Alpha', 'joao@alpha.com', '11999999999', 'Novo', 'Site', v_product_id, 10000),
    (v_lead_novo2_id, v_comercial_id, 'Maria Souza', 'Arquitetura Beta', 'maria@beta.com', '11888888888', 'Novo', 'Indicação', v_product_id, 15000),
    (v_lead_negociacao1_id, v_comercial_id, 'Carlos Lima', 'Engenharia Gama', 'carlos@gama.com', '11777777777', 'Novo', 'Site', v_product_id, 20000),
    (v_lead_negociacao2_id, v_comercial_id, 'Ana Paula', 'Design Delta', 'ana@delta.com', '11666666666', 'Novo', 'Redes Sociais', v_product_id, 25000),
    (v_lead_ganho_id, v_comercial_id, 'Roberto Costa', 'Incorporadora Echo', 'roberto@echo.com', '11555555555', 'Novo', 'Site', v_product_id, 50000),
    (v_lead_perdido_id, v_comercial_id, 'Fernanda Alves', 'Estúdio Zeta', 'fernanda@zeta.com', '11444444444', 'Novo', 'Indicação', v_product_id, 30000)
  ON CONFLICT (id) DO NOTHING;

  -- 5. PROGRESS LEADS TO 'Em Negociação'
  -- Trigger 'on_lead_status_change' will automatically create opportunities for these leads
  UPDATE public.leads SET status = 'Em Negociação' 
  WHERE id IN (v_lead_negociacao1_id, v_lead_negociacao2_id, v_lead_ganho_id, v_lead_perdido_id)
  AND status = 'Novo';

  -- 6. OPPORTUNITY UPDATES & CONVERSION
  -- Update one to 'Aguardando' to trigger 'Oportunidades que merecem atenção' widget
  UPDATE public.opportunities SET status = 'Aguardando' WHERE lead_id = v_lead_negociacao1_id AND status != 'Aguardando';
  
  -- The one we want 'Aberta', we leave as 'Aberta' (which is the default created by trigger)
  
  -- Update to 'Ganha'. The 'on_opportunity_status_change' trigger will sync Lead to 'Ganho' and create a Customer
  UPDATE public.opportunities SET status = 'Ganha' WHERE lead_id = v_lead_ganho_id AND status != 'Ganha';
  
  -- Update to 'Perdida'. The 'on_opportunity_status_change' trigger will sync Lead to 'Perdido'
  UPDATE public.opportunities SET status = 'Perdida' WHERE lead_id = v_lead_perdido_id AND status != 'Perdida';

  -- 7. MEETINGS SEED
  INSERT INTO public.meetings (id, lead_id, date, notes)
  VALUES 
    ('eeee0001-0000-0000-0000-000000000000'::uuid, v_lead_negociacao1_id, NOW() + INTERVAL '2 days', 'Apresentação da proposta comercial'),
    ('eeee0002-0000-0000-0000-000000000000'::uuid, v_lead_novo1_id, NOW() - INTERVAL '1 day', 'Reunião de alinhamento inicial (discovery)')
  ON CONFLICT (id) DO NOTHING;

  -- Ensure scheduled meeting date matches on the lead for accurate UI rendering
  UPDATE public.leads SET scheduled_meeting_date = NOW() + INTERVAL '2 days' WHERE id = v_lead_negociacao1_id AND scheduled_meeting_date IS NULL;

  -- 8. MESSAGES SEED (History between Admin and Commercial)
  INSERT INTO public.messages (id, from_id, to_id, text, read)
  VALUES 
    ('ffff0001-0000-0000-0000-000000000000'::uuid, v_admin_id, v_comercial_id, 'Olá, por favor priorize o contato com a Incorporadora Echo. Eles têm potencial para um ticket alto.', true),
    ('ffff0002-0000-0000-0000-000000000000'::uuid, v_comercial_id, v_admin_id, 'Feito! Acabamos de fechar negócio com a Echo.', true),
    ('ffff0003-0000-0000-0000-000000000000'::uuid, v_admin_id, v_comercial_id, 'Excelente trabalho. Não esqueça de preencher os dados de onboarding.', false)
  ON CONFLICT (id) DO NOTHING;

  -- 9. ONBOARDINGS SEED (Linked to the 'Ganha' opportunity)
  SELECT id INTO v_opp_ganha_id FROM public.opportunities WHERE lead_id = v_lead_ganho_id LIMIT 1;
  IF v_opp_ganha_id IS NOT NULL THEN
    INSERT INTO public.onboardings (id, opportunity_id, user_id, company_name, email, phone, service_description, marketing_context)
    VALUES (
      '0000aaaa-0000-0000-0000-000000000001'::uuid, 
      v_opp_ganha_id, 
      v_comercial_id, 
      'Incorporadora Echo', 
      'roberto@echo.com', 
      '11555555555', 
      'Consultoria SEO mensal e otimização de conversão.', 
      'O cliente busca aumentar em 30% a geração de leads qualificados no próximo trimestre.'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

END $$;
