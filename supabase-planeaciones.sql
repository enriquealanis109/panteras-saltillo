-- ══════════════════════════════════════════
-- PANTERAS — Planeaciones de entrenamiento (módulo opcional "planeaciones")
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

create table if not exists planeaciones (
  id                  uuid primary key default gen_random_uuid(),
  categoria_id        uuid not null references categorias(id) on delete cascade,
  entrenador_id       uuid not null references entrenadores(id) on delete cascade,
  club_id             uuid references clubes(id),
  fecha               date not null,
  objetivo            text,
  calentamiento_desc  text,
  calentamiento_min   integer,
  tecnica_desc        text,
  tecnica_min         integer,
  tactica_desc        text,
  tactica_min         integer,
  cierre_desc         text,
  cierre_min          integer,
  materiales          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_planeaciones_categoria_fecha on planeaciones(categoria_id, fecha desc);

alter table planeaciones enable row level security;

drop policy if exists "Solo autenticados planeaciones" on planeaciones;
create policy "Solo autenticados planeaciones" on planeaciones for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

-- Hereda club_id de la categoría, igual que jugadores/asistencias/evaluaciones/etc.
drop trigger if exists trg_club_id_planeaciones on planeaciones;
create trigger trg_club_id_planeaciones before insert on planeaciones
  for each row execute function inherit_club_id('categoria_id', 'categorias');

-- updated_at automático en cada edición
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_planeaciones_updated_at on planeaciones;
create trigger trg_planeaciones_updated_at before update on planeaciones
  for each row execute function set_updated_at();

-- Activa el módulo para Panteras. Otros clubes lo prenden después si lo quieren.
update clubes
set modulos_activos = array_append(modulos_activos, 'planeaciones')
where slug = 'panteras' and not ('planeaciones' = any(modulos_activos));
