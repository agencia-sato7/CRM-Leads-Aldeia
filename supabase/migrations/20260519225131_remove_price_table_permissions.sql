-- Remove orphaned permissions related to the Price Table module
DELETE FROM public.role_permissions 
WHERE resource IN ('price-table', 'price_table', 'Preços', 'Tabela de Preços');
