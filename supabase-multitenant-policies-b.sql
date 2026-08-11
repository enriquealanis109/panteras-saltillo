-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant Fase 2, Batch B
-- Tienda, cobros, padres, ligas/partidos (sin UI para Inter todavía,
-- pero necesitan aislamiento por club a nivel de base de datos).
-- Las políticas públicas/anónimas (checkout, landing) se dejan intactas.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

-- ── conceptos_cobro / pagos_jugador ──
drop policy if exists "auth_select_conceptos_cobro" on conceptos_cobro;
create policy "auth_select_conceptos_cobro" on conceptos_cobro for select to authenticated
  using (club_id = current_club_id());

drop policy if exists "auth_insert_conceptos_cobro" on conceptos_cobro;
create policy "auth_insert_conceptos_cobro" on conceptos_cobro for insert to authenticated
  with check (club_id = current_club_id());

drop policy if exists "auth_update_conceptos_cobro" on conceptos_cobro;
create policy "auth_update_conceptos_cobro" on conceptos_cobro for update to authenticated
  using (club_id = current_club_id()) with check (club_id = current_club_id());

drop policy if exists "auth_delete_conceptos_cobro" on conceptos_cobro;
create policy "auth_delete_conceptos_cobro" on conceptos_cobro for delete to authenticated
  using (club_id = current_club_id());

drop policy if exists "auth_select_pagos_jugador" on pagos_jugador;
create policy "auth_select_pagos_jugador" on pagos_jugador for select to authenticated
  using (club_id = current_club_id());

drop policy if exists "auth_insert_pagos_jugador" on pagos_jugador;
create policy "auth_insert_pagos_jugador" on pagos_jugador for insert to authenticated
  with check (club_id = current_club_id());

drop policy if exists "auth_update_pagos_jugador" on pagos_jugador;
create policy "auth_update_pagos_jugador" on pagos_jugador for update to authenticated
  using (club_id = current_club_id()) with check (club_id = current_club_id());

drop policy if exists "auth_delete_pagos_jugador" on pagos_jugador;
create policy "auth_delete_pagos_jugador" on pagos_jugador for delete to authenticated
  using (club_id = current_club_id());

-- ── tienda: "Público ve..." y "Cualquiera crea..." se dejan intactas (checkout anónimo) ──
drop policy if exists "Admin gestiona productos" on productos;
create policy "Admin gestiona productos" on productos for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Admin gestiona variantes" on producto_variantes;
create policy "Admin gestiona variantes" on producto_variantes for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Admin gestiona pedidos" on pedidos;
create policy "Admin gestiona pedidos" on pedidos for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Admin gestiona items de pedido" on pedido_items;
create policy "Admin gestiona items de pedido" on pedido_items for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Admin gestiona categorías" on categorias_tienda;
create policy "Admin gestiona categorías" on categorias_tienda for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

-- ── padres: los self-scoped (auth.uid() = id / padre_id) se dejan intactos, ──
-- solo se ajustan las que dan acceso de staff.
drop policy if exists "Entrenador ve nombres de padres" on padres;
create policy "Entrenador ve nombres de padres" on padres for select
  using (
    exists (select 1 from entrenadores where id = auth.uid())
    and club_id = current_club_id()
  );

drop policy if exists "Admin gestiona padres" on padres;
create policy "Admin gestiona padres" on padres for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Admin gestiona códigos" on codigos_invitacion;
create policy "Admin gestiona códigos" on codigos_invitacion for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Admin lee subs" on push_subscriptions;
create policy "Admin lee subs" on push_subscriptions for select
  using (
    exists (select 1 from entrenadores where id = auth.uid())
    and club_id = current_club_id()
  );

drop policy if exists "Entrenador ve confirmaciones" on confirmaciones_partido;
create policy "Entrenador ve confirmaciones" on confirmaciones_partido for select
  using (
    exists (select 1 from entrenadores where id = auth.uid())
    and club_id = current_club_id()
  );

-- ── ligas / partidos / asistencia_partidos ──
-- "Público ve ligas" y "Padres leen partidos" (SELECT true) se dejan intactas.
drop policy if exists "auth_insert_ligas" on ligas;
create policy "auth_insert_ligas" on ligas for insert to authenticated
  with check (club_id = current_club_id());

drop policy if exists "auth_update_ligas" on ligas;
create policy "auth_update_ligas" on ligas for update to authenticated
  using (club_id = current_club_id()) with check (club_id = current_club_id());

drop policy if exists "auth_delete_ligas" on ligas;
create policy "auth_delete_ligas" on ligas for delete to authenticated
  using (club_id = current_club_id());

drop policy if exists "Solo autenticados partidos" on partidos;
create policy "Solo autenticados partidos" on partidos for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());

drop policy if exists "Solo autenticados asistencia_partidos" on asistencia_partidos;
create policy "Solo autenticados asistencia_partidos" on asistencia_partidos for all
  using (auth.role() = 'authenticated' and club_id = current_club_id())
  with check (auth.role() = 'authenticated' and club_id = current_club_id());
