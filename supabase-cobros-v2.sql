-- Actualización v2: agrega campo monto_pagado a pagos_jugador
-- Ejecutar en el SQL Editor de Supabase

alter table pagos_jugador
  add column if not exists monto_pagado numeric(10,2) not null default 0;
