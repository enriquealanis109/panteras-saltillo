-- ══════════════════════════════════════════
-- PANTERAS — Políticas de Storage para el bucket "tienda"
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════
-- El bucket "tienda" se creó marcado como público (lectura), pero subir/editar/borrar
-- archivos pasa por RLS de storage.objects igual que cualquier otra tabla — sin estas
-- políticas, el admin no puede subir imágenes de producto.

CREATE POLICY "Público lee imágenes de tienda" ON storage.objects FOR SELECT
  USING (bucket_id = 'tienda');

CREATE POLICY "Admin sube imágenes de tienda" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tienda' AND EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Admin actualiza imágenes de tienda" ON storage.objects FOR UPDATE
  USING (bucket_id = 'tienda' AND EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Admin borra imágenes de tienda" ON storage.objects FOR DELETE
  USING (bucket_id = 'tienda' AND EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));
