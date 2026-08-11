-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant: fix de políticas "públicas"
-- Encontrado en la prueba adversarial: las políticas de solo-lectura pública
-- (para la landing sin sesión) se dejaron sin restricción de rol, por lo que
-- también le aplicaban a CUALQUIER usuario autenticado de CUALQUIER club,
-- dejando ver contenido de otros clubes (ej. categorías de Panteras en el
-- dashboard de Inter). Se restringen a "to anon" (sin sesión) — la landing
-- pública sigue funcionando igual, pero un usuario logueado de otro club ya
-- no pasa por esta política, solo por la que sí exige que el club coincida.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

drop policy if exists "Lectura pública categorias" on categorias;
create policy "Lectura pública categorias" on categorias for select to anon using (true);

drop policy if exists "Público ve ligas" on ligas;
create policy "Público ve ligas" on ligas for select to anon using (true);

drop policy if exists "Padres leen partidos" on partidos;
create policy "Padres leen partidos" on partidos for select to anon using (true);

drop policy if exists "Público ve productos activos" on productos;
create policy "Público ve productos activos" on productos for select to anon using (activo = true);

drop policy if exists "Público ve categorías" on categorias_tienda;
create policy "Público ve categorías" on categorias_tienda for select to anon using (true);

drop policy if exists "Público ve variantes" on producto_variantes;
create policy "Público ve variantes" on producto_variantes for select to anon using (true);

drop policy if exists "Leer código para validar" on codigos_invitacion;
create policy "Leer código para validar" on codigos_invitacion for select to anon using (true);

-- Estas 6 son las que yo mismo creé en el Batch C con el mismo error:
drop policy if exists "Público ve galeria" on galeria;
create policy "Público ve galeria" on galeria for select to anon using (true);

drop policy if exists "Público ve portadas" on portadas;
create policy "Público ve portadas" on portadas for select to anon using (true);

drop policy if exists "Público ve palmares" on palmares;
create policy "Público ve palmares" on palmares for select to anon using (true);

drop policy if exists "Público ve cuerpo_tecnico" on cuerpo_tecnico;
create policy "Público ve cuerpo_tecnico" on cuerpo_tecnico for select to anon using (true);

drop policy if exists "Público ve plantel" on plantel;
create policy "Público ve plantel" on plantel for select to anon using (true);

drop policy if exists "Público ve patrocinadores" on patrocinadores;
create policy "Público ve patrocinadores" on patrocinadores for select to anon using (true);
