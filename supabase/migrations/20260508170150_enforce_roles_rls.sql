-- Reforçando RLS para a tabela resources (Repositório)

-- Remove as políticas existentes para garantir idempotência
DROP POLICY IF EXISTS "resources_select" ON public.resources;
DROP POLICY IF EXISTS "resources_insert" ON public.resources;
DROP POLICY IF EXISTS "resources_update" ON public.resources;
DROP POLICY IF EXISTS "resources_delete" ON public.resources;

-- Leitura liberada para todos os usuários autenticados (Admin e Comercial)
CREATE POLICY "resources_select" ON public.resources
  FOR SELECT TO authenticated USING (true);

-- Inserção permitida apenas para perfis ADMIN
CREATE POLICY "resources_insert" ON public.resources
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Atualização permitida apenas para perfis ADMIN
CREATE POLICY "resources_update" ON public.resources
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Exclusão permitida apenas para perfis ADMIN
CREATE POLICY "resources_delete" ON public.resources
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Reforçando RLS para o bucket de storage (Arquivos do Repositório)
DROP POLICY IF EXISTS "resources_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "resources_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "resources_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "resources_bucket_delete" ON storage.objects;

-- Leitura de arquivos liberada para todos
CREATE POLICY "resources_bucket_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'resources');

-- Upload permitido apenas para ADMIN
CREATE POLICY "resources_bucket_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Atualização de arquivos permitida apenas para ADMIN
CREATE POLICY "resources_bucket_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Exclusão de arquivos permitida apenas para ADMIN
CREATE POLICY "resources_bucket_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'resources' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
