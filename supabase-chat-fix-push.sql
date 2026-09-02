-- ══════════════════════════════════════════
-- PANTERAS — Fix: entrenadores no podían guardar su suscripción push
-- push_subscriptions solo tenía política de RLS para padre_id (de cuando
-- era solo para papás). Un entrenador activando notificaciones se
-- rechazaba en silencio porque su fila no calzaba esa regla.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

create policy "Entrenador gestiona sus subs" on push_subscriptions for all
  using (auth.uid() = entrenador_id)
  with check (auth.uid() = entrenador_id);
