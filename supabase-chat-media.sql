-- ══════════════════════════════════════════
-- PANTERAS — Chat: imágenes/documentos + borrar mensajes propios
-- Antes de correr esto: crea un bucket llamado "chat" en Supabase →
-- Storage → New bucket → nombre "chat", marcado como Public.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

alter table mensajes add column if not exists tipo text not null default 'texto';
alter table mensajes add column if not exists archivo_url text;
alter table mensajes add column if not exists archivo_nombre text;
alter table mensajes add column if not exists eliminado boolean not null default false;

-- safe_uuid ya existe (viene de supabase-multitenant-storage.sql) — por si
-- este script se corre en un proyecto que no lo tiene, se crea aquí también.
create or replace function safe_uuid(input text)
returns uuid
language plpgsql
immutable
as $$
begin
  return input::uuid;
exception when others then
  return null;
end;
$$;

-- Los archivos se guardan como chat/{conversacion_id}/{archivo} — la política
-- valida que esa conversación pertenezca al club del que sube/lee.
drop policy if exists "Auth select chat storage" on storage.objects;
create policy "Auth select chat storage" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat'
    and exists (
      select 1 from conversaciones c
      where c.id = safe_uuid((storage.foldername(name))[1])
        and c.club_id = public.current_club_id()
    )
  );

drop policy if exists "Auth upload chat storage" on storage.objects;
create policy "Auth upload chat storage" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat'
    and exists (
      select 1 from conversaciones c
      where c.id = safe_uuid((storage.foldername(name))[1])
        and c.club_id = public.current_club_id()
    )
  );

drop policy if exists "Auth delete chat storage" on storage.objects;
create policy "Auth delete chat storage" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'chat'
    and exists (
      select 1 from conversaciones c
      where c.id = safe_uuid((storage.foldername(name))[1])
        and c.club_id = public.current_club_id()
    )
  );
