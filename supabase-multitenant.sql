-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant: fundamento (clubes + club_id)
-- Fase 1 del plan de expansión a otros clubes (piloto Inter)
-- Ejecutar en Supabase SQL Editor.
-- Aditivo: agrega columnas/función/triggers nuevos, no toca ninguna
-- política ni comportamiento existente. Todas las tablas "raíz" quedan
-- con DEFAULT = Panteras, así que el código actual sigue funcionando
-- igual hasta que el código de la Fase 3 empiece a pasar club_id explícito.
-- ══════════════════════════════════════════

-- ── Tabla clubes ──────────────────────────
create table if not exists clubes (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  slug             text not null unique,
  activo           boolean not null default true,
  modulos_activos  text[] not null default '{}',
  created_at       timestamptz not null default now()
);

alter table clubes enable row level security;

drop policy if exists "Autenticados leen clubes" on clubes;
create policy "Autenticados leen clubes" on clubes
  for select to authenticated using (true);

insert into clubes (nombre, slug)
values ('Panteras Saltillo', 'panteras')
on conflict (slug) do nothing;

-- ── club_id: tablas raíz — default Panteras (vía trigger, Postgres no permite
-- subquery en DEFAULT), se asignan explícito por código en Fase 3 ──
alter table entrenadores      add column if not exists club_id uuid references clubes(id);
alter table categorias        add column if not exists club_id uuid references clubes(id);
alter table categorias_tienda add column if not exists club_id uuid references clubes(id);
alter table productos         add column if not exists club_id uuid references clubes(id);
alter table pedidos           add column if not exists club_id uuid references clubes(id);

-- ── club_id: tablas que heredan de un padre automáticamente (trigger abajo) ──
alter table jugadores              add column if not exists club_id uuid references clubes(id);
alter table documentos             add column if not exists club_id uuid references clubes(id);
alter table asistencias            add column if not exists club_id uuid references clubes(id);
alter table evaluaciones           add column if not exists club_id uuid references clubes(id);
alter table conceptos_cobro        add column if not exists club_id uuid references clubes(id);
alter table pagos_jugador          add column if not exists club_id uuid references clubes(id);
alter table ligas                  add column if not exists club_id uuid references clubes(id);
alter table partidos               add column if not exists club_id uuid references clubes(id);
alter table asistencia_partidos    add column if not exists club_id uuid references clubes(id);
alter table galeria                add column if not exists club_id uuid references clubes(id);
alter table portadas               add column if not exists club_id uuid references clubes(id);
alter table palmares               add column if not exists club_id uuid references clubes(id);
alter table cuerpo_tecnico         add column if not exists club_id uuid references clubes(id);
alter table padres                 add column if not exists club_id uuid references clubes(id);
alter table codigos_invitacion     add column if not exists club_id uuid references clubes(id);
alter table push_subscriptions     add column if not exists club_id uuid references clubes(id);
alter table confirmaciones_partido add column if not exists club_id uuid references clubes(id);
alter table producto_variantes     add column if not exists club_id uuid references clubes(id);
alter table pedido_items           add column if not exists club_id uuid references clubes(id);

-- ── Función auxiliar: club del usuario autenticado (para Fase 2) ──
create or replace function current_club_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select club_id from entrenadores where id = auth.uid();
$$;

-- ── Trigger: tablas raíz sin club_id explícito caen en Panteras por default ──
create or replace function default_club_id_panteras()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if NEW.club_id is null then
    NEW.club_id := (select id from clubes where slug = 'panteras');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_default_club_entrenadores on entrenadores;
create trigger trg_default_club_entrenadores before insert on entrenadores
  for each row execute function default_club_id_panteras();

drop trigger if exists trg_default_club_categorias on categorias;
create trigger trg_default_club_categorias before insert on categorias
  for each row execute function default_club_id_panteras();

drop trigger if exists trg_default_club_categorias_tienda on categorias_tienda;
create trigger trg_default_club_categorias_tienda before insert on categorias_tienda
  for each row execute function default_club_id_panteras();

drop trigger if exists trg_default_club_productos on productos;
create trigger trg_default_club_productos before insert on productos
  for each row execute function default_club_id_panteras();

drop trigger if exists trg_default_club_pedidos on pedidos;
create trigger trg_default_club_pedidos before insert on pedidos
  for each row execute function default_club_id_panteras();

-- ── Backfill: todo lo que ya existe hoy es de Panteras, luego se cierra NOT NULL ──
do $$
declare
  panteras_id uuid := (select id from clubes where slug = 'panteras');
  t text;
begin
  foreach t in array array[
    'entrenadores','categorias','categorias_tienda','productos','pedidos',
    'jugadores','documentos','asistencias','evaluaciones','conceptos_cobro',
    'pagos_jugador','ligas','partidos','asistencia_partidos','galeria',
    'portadas','palmares','cuerpo_tecnico','padres','codigos_invitacion',
    'push_subscriptions','confirmaciones_partido','producto_variantes','pedido_items'
  ]
  loop
    execute format('update %I set club_id = $1 where club_id is null', t) using panteras_id;
    execute format('alter table %I alter column club_id set not null', t);
  end loop;
end $$;

-- ── entrenador_categorias no tiene columna propia (se deriva de sus 2 FKs) ──
-- Solo higiene de datos: evita cruzar un entrenador de un club con una categoría de otro.
-- La barrera de seguridad real es el RLS de entrenadores/categorias (Fase 2), esto es un extra.
create or replace function check_entrenador_categoria_mismo_club()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  club_entrenador uuid;
  club_categoria  uuid;
begin
  select club_id into club_entrenador from entrenadores where id = NEW.entrenador_id;
  select club_id into club_categoria  from categorias   where id = NEW.categoria_id;
  if club_entrenador is distinct from club_categoria then
    raise exception 'entrenador y categoria pertenecen a clubes distintos';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_check_entrenador_categoria_club on entrenador_categorias;
create trigger trg_check_entrenador_categoria_club
  before insert or update on entrenador_categorias
  for each row execute function check_entrenador_categoria_mismo_club();

-- ── Trigger genérico: heredar club_id del padre en INSERT (evita tocar ~30 archivos del cliente) ──
create or replace function inherit_club_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  fk_column     text := TG_ARGV[0];
  parent_table  text := TG_ARGV[1];
  parent_id     uuid;
  resolved_club uuid;
begin
  if NEW.club_id is not null then
    return NEW;
  end if;

  parent_id := (to_jsonb(NEW) ->> fk_column)::uuid;
  if parent_id is null then
    return NEW;
  end if;

  execute format('select club_id from %I where id = $1', parent_table) using parent_id into resolved_club;
  NEW.club_id := resolved_club;
  return NEW;
end;
$$;

drop trigger if exists trg_club_id_jugadores on jugadores;
create trigger trg_club_id_jugadores before insert on jugadores
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_documentos on documentos;
create trigger trg_club_id_documentos before insert on documentos
  for each row execute function inherit_club_id('jugador_id', 'jugadores');

drop trigger if exists trg_club_id_asistencias on asistencias;
create trigger trg_club_id_asistencias before insert on asistencias
  for each row execute function inherit_club_id('jugador_id', 'jugadores');

drop trigger if exists trg_club_id_evaluaciones on evaluaciones;
create trigger trg_club_id_evaluaciones before insert on evaluaciones
  for each row execute function inherit_club_id('jugador_id', 'jugadores');

drop trigger if exists trg_club_id_conceptos_cobro on conceptos_cobro;
create trigger trg_club_id_conceptos_cobro before insert on conceptos_cobro
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_pagos_jugador on pagos_jugador;
create trigger trg_club_id_pagos_jugador before insert on pagos_jugador
  for each row execute function inherit_club_id('jugador_id', 'jugadores');

drop trigger if exists trg_club_id_ligas on ligas;
create trigger trg_club_id_ligas before insert on ligas
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_partidos on partidos;
create trigger trg_club_id_partidos before insert on partidos
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_asistencia_partidos on asistencia_partidos;
create trigger trg_club_id_asistencia_partidos before insert on asistencia_partidos
  for each row execute function inherit_club_id('partido_id', 'partidos');

drop trigger if exists trg_club_id_galeria on galeria;
create trigger trg_club_id_galeria before insert on galeria
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_portadas on portadas;
create trigger trg_club_id_portadas before insert on portadas
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_palmares on palmares;
create trigger trg_club_id_palmares before insert on palmares
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_cuerpo_tecnico on cuerpo_tecnico;
create trigger trg_club_id_cuerpo_tecnico before insert on cuerpo_tecnico
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_padres on padres;
create trigger trg_club_id_padres before insert on padres
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_codigos_invitacion on codigos_invitacion;
create trigger trg_club_id_codigos_invitacion before insert on codigos_invitacion
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_push_subscriptions on push_subscriptions;
create trigger trg_club_id_push_subscriptions before insert on push_subscriptions
  for each row execute function inherit_club_id('padre_id', 'padres');

drop trigger if exists trg_club_id_confirmaciones_partido on confirmaciones_partido;
create trigger trg_club_id_confirmaciones_partido before insert on confirmaciones_partido
  for each row execute function inherit_club_id('partido_id', 'partidos');

drop trigger if exists trg_club_id_producto_variantes on producto_variantes;
create trigger trg_club_id_producto_variantes before insert on producto_variantes
  for each row execute function inherit_club_id('producto_id', 'productos');

drop trigger if exists trg_club_id_pedido_items on pedido_items;
create trigger trg_club_id_pedido_items before insert on pedido_items
  for each row execute function inherit_club_id('pedido_id', 'pedidos');
