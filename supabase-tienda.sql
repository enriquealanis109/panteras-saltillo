-- ══════════════════════════════════════════
-- PANTERAS — Tienda de Merchandise
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════

-- Productos del catálogo
CREATE TABLE IF NOT EXISTS productos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  imagen_url  TEXT,
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes por talla/color con su propio stock
CREATE TABLE IF NOT EXISTS producto_variantes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  talla        TEXT NOT NULL,          -- texto libre: "4", "6", "S", "M", "XL", "Única", etc.
  color        TEXT,                   -- opcional
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos (creados por clientes sin necesidad de cuenta/login)
CREATE TABLE IF NOT EXISTS pedidos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nombre   TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  notas            TEXT,
  estado           TEXT NOT NULL DEFAULT 'pendiente_pago',
                   -- pendiente_pago | pagado | listo | entregado | cancelado
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Items de cada pedido (denormalizado: sobrevive aunque se borre el producto/variante)
CREATE TABLE IF NOT EXISTS pedido_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id        UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  variante_id      UUID REFERENCES producto_variantes(id) ON DELETE SET NULL,
  producto_nombre  TEXT NOT NULL,
  talla            TEXT NOT NULL,
  color            TEXT,
  cantidad         INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario  NUMERIC(10,2) NOT NULL
);

-- ══════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════
ALTER TABLE productos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_variantes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items        ENABLE ROW LEVEL SECURITY;

-- PRODUCTOS: público ve solo activos, admin ve/gestiona todo
CREATE POLICY "Público ve productos activos" ON productos FOR SELECT USING (activo = true);
CREATE POLICY "Admin gestiona productos" ON productos FOR ALL
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

-- VARIANTES: público lee (para mostrar tallas/stock en detalle), admin gestiona
CREATE POLICY "Público ve variantes" ON producto_variantes FOR SELECT USING (true);
CREATE POLICY "Admin gestiona variantes" ON producto_variantes FOR ALL
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

-- PEDIDOS: cualquiera puede crear (checkout sin login), solo admin lee/edita/borra
CREATE POLICY "Cualquiera crea pedido" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin gestiona pedidos" ON pedidos FOR ALL
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

-- PEDIDO_ITEMS: mismo criterio
CREATE POLICY "Cualquiera crea items de pedido" ON pedido_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin gestiona items de pedido" ON pedido_items FOR ALL
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));
