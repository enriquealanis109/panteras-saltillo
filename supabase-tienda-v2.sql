-- ══════════════════════════════════════════
-- PANTERAS — Tienda: categorías y personalización
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════

-- Categorías de la tienda, gestionadas libremente por el admin
CREATE TABLE IF NOT EXISTS categorias_tienda (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  orden      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categorias_tienda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público ve categorías" ON categorias_tienda FOR SELECT USING (true);
CREATE POLICY "Admin gestiona categorías" ON categorias_tienda FOR ALL
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

-- Productos: categoría opcional + flag de personalización
ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias_tienda(id) ON DELETE SET NULL;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS personalizable BOOLEAN NOT NULL DEFAULT false;

-- Pedido items: texto de personalización por línea
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS personalizacion_nombre TEXT;
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS personalizacion_numero TEXT;
