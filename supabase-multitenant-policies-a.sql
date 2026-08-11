-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant Fase 2, Batch A
-- Tablas núcleo del panel coordinador + coach
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

-- entrenadores
drop policy if exists "Solo autenticados entrenadores" on entrenadores;
create policy "Solo autenticados entrenadores" on entrenadores for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

-- categorias: solo se toca la política de autenticados.
-- "Lectura pública categorias" se deja intacta a propósito (landing pública sin sesión).
drop policy if exists "Autenticados full categorias" on categorias;
create policy "Autenticados full categorias" on categorias for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

-- jugadores
drop policy if exists "Solo autenticados jugadores" on jugadores;
create policy "Solo autenticados jugadores" on jugadores for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

-- documentos
drop policy if exists "Solo autenticados documentos" on documentos;
create policy "Solo autenticados documentos" on documentos for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

-- asistencias
drop policy if exists "Solo autenticados asistencias" on asistencias;
create policy "Solo autenticados asistencias" on asistencias for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

-- evaluaciones
drop policy if exists "Solo autenticados evaluaciones" on evaluaciones;
create policy "Solo autenticados evaluaciones" on evaluaciones for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

-- entrenador_categorias: no tiene columna club_id propia, se valida por join
drop policy if exists "Solo autenticados entrenador_categorias" on entrenador_categorias;
create policy "Solo autenticados entrenador_categorias" on entrenador_categorias for all
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from entrenadores e
      where e.id = entrenador_categorias.entrenador_id and e.club_id = current_club_id()
    )
  )
  with check (
    auth.role() = 'authenticated'
    and exists (
      select 1 from entrenadores e
      where e.id = entrenador_categorias.entrenador_id and e.club_id = current_club_id()
    )
  );
