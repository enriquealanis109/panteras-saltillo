-- ══════════════════════════════════════════
-- PANTERAS — Multi-tenant Fase 2, Batch C
-- Contenido público de categoría — RLS estaba TOTALMENTE desactivado.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

-- club_id: heredan de categorias vía trigger
alter table galeria        add column if not exists club_id uuid references clubes(id);
alter table portadas       add column if not exists club_id uuid references clubes(id);
alter table palmares       add column if not exists club_id uuid references clubes(id);
alter table cuerpo_tecnico add column if not exists club_id uuid references clubes(id);
alter table plantel        add column if not exists club_id uuid references clubes(id);

-- club_id: patrocinadores es del club completo, no de una categoría — raíz, default Panteras
alter table patrocinadores add column if not exists club_id uuid references clubes(id);

drop trigger if exists trg_default_club_patrocinadores on patrocinadores;
create trigger trg_default_club_patrocinadores before insert on patrocinadores
  for each row execute function default_club_id_panteras();

-- Backfill + NOT NULL
do $$
declare
  panteras_id uuid := (select id from clubes where slug = 'panteras');
  t text;
begin
  foreach t in array array['galeria','portadas','palmares','cuerpo_tecnico','plantel','patrocinadores']
  loop
    execute format('update %I set club_id = $1 where club_id is null', t) using panteras_id;
    execute format('alter table %I alter column club_id set not null', t);
  end loop;
end $$;

-- Triggers de herencia desde categorias
drop trigger if exists trg_club_id_galeria on galeria;
create trigger trg_club_id_galeria before insert on galeria
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_portadas on portadas;
create trigger trg_club_id_portadas before insert on portadas
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_palmares on palmares;
create trigger trg_club_id_palmares before insert on palmares
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_cuerpo_tecnico on cuerpo_tecnico;
create trigger trg_club_id_cuerpo_tecnico before insert on cuerpo_tecnico
  for each row execute function inherit_club_id('categoria_id', 'categorias');

drop trigger if exists trg_club_id_plantel on plantel;
create trigger trg_club_id_plantel before insert on plantel
  for each row execute function inherit_club_id('categoria_id', 'categorias');

-- Activar RLS (estaba apagado) + políticas: lectura pública (landing), escritura solo admin de su club
alter table galeria        enable row level security;
alter table portadas       enable row level security;
alter table palmares       enable row level security;
alter table cuerpo_tecnico enable row level security;
alter table plantel        enable row level security;
alter table patrocinadores enable row level security;

drop policy if exists "Público ve galeria" on galeria;
create policy "Público ve galeria" on galeria for select using (true);
drop policy if exists "Admin gestiona galeria" on galeria;
create policy "Admin gestiona galeria" on galeria for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Público ve portadas" on portadas;
create policy "Público ve portadas" on portadas for select using (true);
drop policy if exists "Admin gestiona portadas" on portadas;
create policy "Admin gestiona portadas" on portadas for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Público ve palmares" on palmares;
create policy "Público ve palmares" on palmares for select using (true);
drop policy if exists "Admin gestiona palmares" on palmares;
create policy "Admin gestiona palmares" on palmares for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Público ve cuerpo_tecnico" on cuerpo_tecnico;
create policy "Público ve cuerpo_tecnico" on cuerpo_tecnico for select using (true);
drop policy if exists "Admin gestiona cuerpo_tecnico" on cuerpo_tecnico;
create policy "Admin gestiona cuerpo_tecnico" on cuerpo_tecnico for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Público ve plantel" on plantel;
create policy "Público ve plantel" on plantel for select using (true);
drop policy if exists "Admin gestiona plantel" on plantel;
create policy "Admin gestiona plantel" on plantel for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());

drop policy if exists "Público ve patrocinadores" on patrocinadores;
create policy "Público ve patrocinadores" on patrocinadores for select using (true);
drop policy if exists "Admin gestiona patrocinadores" on patrocinadores;
create policy "Admin gestiona patrocinadores" on patrocinadores for all
  using (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id())
  with check (exists (select 1 from entrenadores where id = auth.uid() and rol = 'admin') and club_id = current_club_id());
