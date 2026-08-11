-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant: módulos opcionales por club
-- Panteras conserva todos los módulos (tienda, patrocinadores, partidos,
-- métricas, padres, avisos, sitio público) — Inter y cualquier club nuevo
-- arrancan solo con lo operativo (categorías, jugadores, entrenadores,
-- documentos, asistencias, evaluaciones), sin nada de esto.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

update clubes
set modulos_activos = array['metricas','partidos','patrocinadores','tienda','padres','avisos','sitio_publico']
where slug = 'panteras';
