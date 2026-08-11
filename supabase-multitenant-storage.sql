-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant Fase 2, storage.objects (bucket documentos)
-- VERSIÓN FINAL — incluye la política SELECT que faltaba.
-- Causa raíz: al subir un archivo, Supabase hace INSERT + RETURNING *,
-- y sin una política SELECT que cubra la fila recién creada, TODA la
-- operación se cancela y se reporta como error de RLS — aunque el
-- permiso de subir esté bien. Por eso "subir" fallaba y "borrar" no.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

-- Limpieza de las políticas de prueba temporales
drop policy if exists "TEST sin restriccion" on storage.objects;

-- Cast seguro: si el path no trae un uuid válido en la primera carpeta,
-- regresa null en vez de tronar la política con un error.
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

drop policy if exists "Auth select documentos storage" on storage.objects;
create policy "Auth select documentos storage" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from jugadores j
      where j.id = safe_uuid((storage.foldername(name))[1])
        and j.club_id = public.current_club_id()
    )
  );

drop policy if exists "Auth upload documentos storage" on storage.objects;
create policy "Auth upload documentos storage" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from jugadores j
      where j.id = safe_uuid((storage.foldername(name))[1])
        and j.club_id = public.current_club_id()
    )
  );

drop policy if exists "Auth update documentos storage" on storage.objects;
create policy "Auth update documentos storage" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from jugadores j
      where j.id = safe_uuid((storage.foldername(name))[1])
        and j.club_id = public.current_club_id()
    )
  )
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from jugadores j
      where j.id = safe_uuid((storage.foldername(name))[1])
        and j.club_id = public.current_club_id()
    )
  );

drop policy if exists "Auth delete documentos storage" on storage.objects;
create policy "Auth delete documentos storage" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from jugadores j
      where j.id = safe_uuid((storage.foldername(name))[1])
        and j.club_id = public.current_club_id()
    )
  );
