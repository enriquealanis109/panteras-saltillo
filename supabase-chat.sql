-- ══════════════════════════════════════════
-- PANTERAS — Chat interno entrenador ↔ admin (módulo opcional "chat")
-- Solo roles 'entrenador' y 'ambos' (traen entrenador) pueden tener hilo propio;
-- 'admin' ve y responde todos los hilos; 'coordinador' puro queda fuera.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

create table if not exists conversaciones (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references clubes(id),
  entrenador_id       uuid not null references entrenadores(id) on delete cascade,
  ultimo_mensaje_at   timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  unique (entrenador_id)
);

create table if not exists mensajes (
  id                  uuid primary key default gen_random_uuid(),
  conversacion_id     uuid not null references conversaciones(id) on delete cascade,
  club_id             uuid not null references clubes(id),
  autor_id            uuid not null references entrenadores(id),
  texto               text not null,
  leido_por_coach     boolean not null default false,
  leido_por_admin     boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists idx_mensajes_conversacion on mensajes(conversacion_id, created_at);

alter table conversaciones enable row level security;
alter table mensajes enable row level security;

-- El coach dueño del hilo (rol entrenador/ambos) lo ve y escribe; cualquier admin ve/escribe todos.
drop policy if exists "Conversaciones: coach dueño o admin" on conversaciones;
create policy "Conversaciones: coach dueño o admin" on conversaciones for all
  using (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      (entrenador_id = auth.uid() and exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol in ('entrenador','ambos')))
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  )
  with check (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      (entrenador_id = auth.uid() and exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol in ('entrenador','ambos')))
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  );

drop policy if exists "Mensajes: del hilo propio o admin" on mensajes;
create policy "Mensajes: del hilo propio o admin" on mensajes for all
  using (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      exists (
        select 1 from conversaciones c
        join entrenadores e on e.id = auth.uid()
        where c.id = mensajes.conversacion_id and c.entrenador_id = auth.uid() and e.rol in ('entrenador','ambos')
      )
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  )
  with check (
    autor_id = auth.uid()
    and auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      exists (
        select 1 from conversaciones c
        join entrenadores e on e.id = auth.uid()
        where c.id = mensajes.conversacion_id and c.entrenador_id = auth.uid() and e.rol in ('entrenador','ambos')
      )
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  );

-- Tiempo real: los mensajes nuevos se transmiten por Supabase Realtime.
alter publication supabase_realtime add table mensajes;

-- Notificaciones push para entrenadores/admin (hoy push_subscriptions solo tenía padre_id).
alter table push_subscriptions add column if not exists entrenador_id uuid references entrenadores(id);
alter table push_subscriptions alter column padre_id drop not null;

-- Activa el módulo para Panteras.
update clubes
set modulos_activos = array_append(modulos_activos, 'chat')
where slug = 'panteras' and not ('chat' = any(modulos_activos));
