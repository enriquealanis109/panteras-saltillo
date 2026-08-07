-- Módulo: Cobros y Papelería para coordinadores
-- Ejecutar en el SQL Editor de Supabase

-- Conceptos de cobro (torneos, copas, actividades, etc.)
create table if not exists conceptos_cobro (
  id           uuid        primary key default gen_random_uuid(),
  nombre       text        not null,
  tipo         text        not null check (tipo in ('torneo', 'copa', 'actividad', 'otro')),
  categoria_id uuid        not null references categorias(id) on delete cascade,
  monto        numeric(10,2),
  activo       boolean     not null default true,
  created_by   uuid        references entrenadores(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Estatus de pago por jugador y concepto (completo / pendiente / na)
create table if not exists pagos_jugador (
  id          uuid        primary key default gen_random_uuid(),
  jugador_id  uuid        not null references jugadores(id) on delete cascade,
  concepto_id uuid        not null references conceptos_cobro(id) on delete cascade,
  estatus     text        not null check (estatus in ('completo', 'pendiente', 'na')) default 'pendiente',
  nota        text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references entrenadores(id) on delete set null,
  unique(jugador_id, concepto_id)
);

-- Row Level Security
alter table conceptos_cobro enable row level security;
alter table pagos_jugador   enable row level security;

-- Políticas: usuarios autenticados (coordinadores, entrenadores, admin) pueden leer y escribir
create policy "auth_select_conceptos_cobro"
  on conceptos_cobro for select to authenticated using (true);

create policy "auth_insert_conceptos_cobro"
  on conceptos_cobro for insert to authenticated with check (true);

create policy "auth_update_conceptos_cobro"
  on conceptos_cobro for update to authenticated using (true) with check (true);

create policy "auth_select_pagos_jugador"
  on pagos_jugador for select to authenticated using (true);

create policy "auth_insert_pagos_jugador"
  on pagos_jugador for insert to authenticated with check (true);

create policy "auth_update_pagos_jugador"
  on pagos_jugador for update to authenticated using (true) with check (true);
