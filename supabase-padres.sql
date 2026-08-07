-- ══════════════════════════════════════════
-- PANTERAS — Sistema de Padres y Notificaciones
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════

-- Padres (cuenta propia en auth.users)
CREATE TABLE IF NOT EXISTS padres (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  telefono    TEXT UNIQUE NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Códigos de invitación (un solo uso por familia)
CREATE TABLE IF NOT EXISTS codigos_invitacion (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
  usado        BOOLEAN DEFAULT false,
  usado_por    UUID REFERENCES padres(id) ON DELETE SET NULL,
  expira_en    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Suscripciones push (un padre puede tener múltiples dispositivos)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  padre_id  UUID NOT NULL REFERENCES padres(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Confirmaciones de asistencia por partido
CREATE TABLE IF NOT EXISTS confirmaciones_partido (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  padre_id   UUID NOT NULL REFERENCES padres(id) ON DELETE CASCADE,
  estado     TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | asiste | no_asiste
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partido_id, padre_id)
);

-- ══════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════
ALTER TABLE padres               ENABLE ROW LEVEL SECURITY;
ALTER TABLE codigos_invitacion   ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmaciones_partido ENABLE ROW LEVEL SECURITY;

-- PADRES
CREATE POLICY "Padre ve su perfil"       ON padres FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Padre actualiza su perfil" ON padres FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insertar en registro"      ON padres FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin gestiona padres"     ON padres FOR ALL
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

-- CODIGOS
CREATE POLICY "Leer código para validar" ON codigos_invitacion FOR SELECT USING (true);
CREATE POLICY "Admin gestiona códigos"   ON codigos_invitacion FOR ALL
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid() AND rol = 'admin'));

-- PUSH SUBS
CREATE POLICY "Padre gestiona sus subs" ON push_subscriptions FOR ALL USING (auth.uid() = padre_id);
CREATE POLICY "Admin lee subs"          ON push_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid()));

-- CONFIRMACIONES
CREATE POLICY "Padre gestiona sus confirmaciones" ON confirmaciones_partido
  FOR ALL USING (auth.uid() = padre_id);
CREATE POLICY "Entrenador ve confirmaciones" ON confirmaciones_partido FOR SELECT
  USING (EXISTS (SELECT 1 FROM entrenadores WHERE id = auth.uid()));
