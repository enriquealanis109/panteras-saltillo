-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant: branding por club (logo + color de acento)
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

alter table clubes add column if not exists logo_url text;
alter table clubes add column if not exists color_acento text not null default '#16a34a';

-- Panteras conserva su verde de siempre (ya es el default de la columna, esto solo lo deja explícito).
update clubes set color_acento = '#16a34a' where slug = 'panteras' and color_acento is null;
