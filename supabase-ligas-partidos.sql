-- ══════════════════════════════════════════
-- PANTERAS — Ligas/Copas con estadísticas + partidos
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════

-- La tabla `ligas` ya existe (id, categoria_id, nombre, activo) — se le agrega tipo.
ALTER TABLE ligas ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'liga' CHECK (tipo IN ('liga', 'copa'));

-- Evita recrear el problema de nombres duplicados/typos ("Rayados" vs "RAYADOS")
CREATE UNIQUE INDEX IF NOT EXISTS ligas_categoria_nombre_unico
  ON ligas (categoria_id, lower(trim(nombre)));

-- RLS: hoy la escritura no está restringida (un insert anónimo solo falla por FK).
-- Se deja lectura pública (landing la consume sin sesión) y se restringe escritura a autenticados.
ALTER TABLE ligas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Público ve ligas" ON ligas;
CREATE POLICY "Público ve ligas" ON ligas FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_insert_ligas" ON ligas;
CREATE POLICY "auth_insert_ligas" ON ligas FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ligas" ON ligas;
CREATE POLICY "auth_update_ligas" ON ligas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_ligas" ON ligas;
CREATE POLICY "auth_delete_ligas" ON ligas FOR DELETE TO authenticated USING (true);

-- Partidos: se reemplaza el texto libre de liga y el resultado tipo "6-1" por columnas estructuradas.
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS liga_id UUID REFERENCES ligas(id) ON DELETE SET NULL;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS goles_favor INTEGER;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS goles_contra INTEGER;

-- Seguro: la tabla partidos está vacía (se borró el historial viejo antes de esta migración).
ALTER TABLE partidos DROP COLUMN IF EXISTS liga;
ALTER TABLE partidos DROP COLUMN IF EXISTS resultado;
