-- ══════════════════════════════════════════
-- PANTERAS — Fix: conversaciones/mensajes no llenaban club_id solos
-- Ejecutar en Supabase SQL Editor, después de supabase-chat.sql.
-- ══════════════════════════════════════════

drop trigger if exists trg_club_id_conversaciones on conversaciones;
create trigger trg_club_id_conversaciones before insert on conversaciones
  for each row execute function inherit_club_id('entrenador_id', 'entrenadores');

drop trigger if exists trg_club_id_mensajes on mensajes;
create trigger trg_club_id_mensajes before insert on mensajes
  for each row execute function inherit_club_id('conversacion_id', 'conversaciones');
