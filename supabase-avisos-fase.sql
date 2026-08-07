-- Agrega clasificación del partido a la tabla partidos
alter table partidos
  add column if not exists fase    text,
  add column if not exists jornada text;
