-- Fix: políticas DELETE faltantes para el módulo de cobros

create policy "auth_delete_conceptos_cobro"
  on conceptos_cobro for delete to authenticated using (true);

create policy "auth_delete_pagos_jugador"
  on pagos_jugador for delete to authenticated using (true);
