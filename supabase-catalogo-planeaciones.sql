-- ══════════════════════════════════════════
-- PANTERAS — Catálogo de planeaciones modelo (banda de edad + progresión semanal)
-- Ejecutar en Supabase SQL Editor, después de supabase-planeaciones.sql.
-- ══════════════════════════════════════════

-- ── Banda de edad por categoría ──
alter table categorias add column if not exists banda_edad text;

-- Asignación inicial para las categorías conocidas de Panteras (ajustable después
-- desde el panel admin, en el modal de editar categoría).
update categorias set banda_edad = 'menores'     where nombre in ('CAT 2018','CAT 2019','CAT 2020','CAT 2021') and club_id = (select id from clubes where slug = 'panteras');
update categorias set banda_edad = 'intermedios' where nombre in ('CAT 2015','CAT 2016','CAT 2017')            and club_id = (select id from clubes where slug = 'panteras');
update categorias set banda_edad = 'mayores'     where nombre in ('CAT 2013','CAT 2014')                       and club_id = (select id from clubes where slug = 'panteras');

-- ── Catálogo de planeaciones modelo ──
create table if not exists plantillas_planeacion (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references clubes(id),
  banda_edad          text not null,
  semana              integer not null,
  titulo              text not null,
  objetivo            text,
  calentamiento_desc  text,
  calentamiento_min   integer,
  tecnica_desc        text,
  tecnica_min         integer,
  tactica_desc        text,
  tactica_min         integer,
  cierre_desc         text,
  cierre_min          integer,
  materiales          text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_plantillas_banda_semana on plantillas_planeacion(club_id, banda_edad, semana);

alter table plantillas_planeacion enable row level security;

-- Cualquier autenticado del club puede LEER el catálogo.
drop policy if exists "Autenticados leen plantillas" on plantillas_planeacion;
create policy "Autenticados leen plantillas" on plantillas_planeacion for select
  using (auth.role() = 'authenticated' and club_id = current_club_id());

-- Solo admin/coordinador pueden crear, editar o borrar plantillas del catálogo.
drop policy if exists "Admin y coordinador escriben plantillas" on plantillas_planeacion;
create policy "Admin y coordinador escriben plantillas" on plantillas_planeacion for all
  using (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol in ('admin','coordinador','ambos'))
  )
  with check (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol in ('admin','coordinador','ambos'))
  );

-- ── Contenido — Panteras, banda "menores" (5-8 años) ──
-- Enfoque: motricidad, relación con el balón, diversión. Nada de fuerza con
-- carga externa — todo el trabajo físico va disfrazado de juego.
insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'menores', 1, 'Bienvenida al balón — conducción y contacto',
  'Perder el miedo al balón y mejorar la conducción básica con ambos pies.',
  'Juego "Congelados con balón": cada niño con su balón conduce libremente por el área; al silbatazo se congela con el pie encima del balón.', 10,
  'Circuito de conducción entre conos (slalom), alternando pie derecho e izquierdo. Carrera de relevos por equipos conduciendo el balón.', 15,
  'Juego "Rey del área": dentro de un cuadro marcado, cada niño protege su balón mientras intenta quitarle el balón a otro (1v1 simplificado, noción de proteger el balón).', 10,
  'Juego de persecución "La cadena" sin balón (velocidad y coordinación de forma divertida) + estiramiento jugando a las estatuas.', 10,
  'Conos, un balón por niño, pecheras'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'menores', 2, 'Pase y recepción',
  'Introducir el pase con el interior del pie y la recepción con control simple.',
  'Por parejas, pase del balón caminando y luego trotando ("pase y sigue").', 10,
  'Estaciones de pase por parejas a distancia corta (3-5m). Recepción con la planta o el interior del pie.', 15,
  'Rondo gigante 4 vs 1 en espacio reducido: mantener el balón dentro del grupo.', 10,
  'Carreras de velocidad cortas (10m) en parejas + juego de saltos con obstáculos bajos de conos.', 10,
  'Conos, balones, aros o escalera de agilidad si hay'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'menores', 3, 'Golpeo y tiro a gol',
  'Primer contacto con el golpeo de balón hacia el arco.',
  'Juego "Tiburones y sardinas" con balón: conducción evadiendo a los "tiburones" que intentan quitar el balón.', 10,
  'Estaciones de tiro a gol con balón parado desde corta distancia. Enfoque en golpear con el empeine o interior sin fuerza excesiva.', 15,
  'Juego reducido 3 vs 3 con porterías chicas, sin arquero fijo (todos rotan).', 10,
  'Circuito de saltos (sapito, un pie, dos pies) sin balón — coordinación y fuerza de piernas en forma de juego.', 10,
  'Porterías chicas o conos como porterías, balones'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'menores', 4, 'Repaso y partido',
  'Integrar lo trabajado en las tres semanas anteriores en un mini-partido dirigido.',
  'Juego libre de conducción y pase en parejas.', 10,
  'Repaso rápido de conducción + pase en circuito combinado.', 10,
  'Partido dirigido 4 vs 4 o 5 vs 5 sin arquero fijo. El entrenador pausa brevemente para dar indicaciones cortas (ej. "¡pásasela a tu compañero libre!").', 15,
  'Juego de despedida "La papa caliente" con balón en círculo + estiramiento.', 10,
  'Porterías chicas, pecheras, balones'
from clubes where slug = 'panteras';

-- ── Contenido — Panteras, banda "intermedios" (9-11 años) ──
-- Enfoque: técnica más fina, primeras nociones tácticas (posesión, marcaje,
-- táctica fija básica) y trabajo físico ligero en forma de circuito.
insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'intermedios', 1, 'Control orientado',
  'Mejorar el primer toque orientado hacia el espacio libre.',
  'Activación con desplazamientos (laterales, skipping, talones) + pase en movimiento por parejas.', 10,
  'Control orientado con un toque hacia zonas marcadas con conos, alternando pie.', 15,
  'Rondo 5 vs 2 en espacio reducido, con énfasis en abrir el cuerpo para recibir orientado.', 15,
  'Circuito físico corto con peso corporal: sentadillas, saltos laterales, plancha 20s — 2 vueltas tipo estación.', 10,
  'Conos, balones, cronómetro o silbato'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'intermedios', 2, 'Pase largo y amplitud',
  'Introducir el pase de media distancia y el uso del ancho de la cancha.',
  'Pase progresivo en parejas aumentando la distancia gradualmente.', 10,
  'Estaciones de pase largo (10-15m) con control orientado de recepción.', 15,
  'Juego posicional 4 vs 4 + 2 comodines en espacio amplio, buscando cambios de orientación.', 15,
  'Circuito físico: escalera de agilidad o aros + sprint corto de 15m.', 10,
  'Conos, balones, escalera de agilidad si hay'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'intermedios', 3, 'Defensa individual y presión',
  'Primeras nociones de marcaje y recuperación del balón.',
  'Juego de pillar en parejas (marcaje de sombra, sin contacto).', 10,
  '1 vs 1 en espacio reducido, enfoque en la posición defensiva (cuerpo de lado, no ir de frente).', 15,
  'Juego 4 vs 4 con transición: al perder el balón, presión inmediata durante 5 segundos.', 15,
  'Circuito físico: burpees suaves, zancadas, saltos a cajón bajo si hay — 2 vueltas.', 10,
  'Conos, pecheras, balones'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'intermedios', 4, 'Táctica fija: saques de banda y esquinas',
  'Introducir las primeras jugadas a balón parado.',
  'Activación general + pase con precisión a un objetivo.', 10,
  'Ejecución de saque de banda largo y corto. Centro desde el tiro de esquina.', 10,
  'Práctica de jugadas ensayadas simples: una variante de saque de banda y una de esquina, con movimientos de apoyo.', 15,
  'Partido dirigido 5 vs 5 aplicando lo practicado + estiramiento final.', 10,
  'Conos, balones, pecheras'
from clubes where slug = 'panteras';

-- ── Contenido — Panteras, banda "mayores" (12-13 años) ──
-- Enfoque: táctica colectiva más elaborada, táctica fija completa, técnica
-- bajo presión, y trabajo físico estructurado (peso corporal / pliometría ligera).
insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'mayores', 1, 'Posesión bajo presión',
  'Mantener el balón bajo presión real de rivales.',
  'Activación dinámica + rondo de calentamiento 6 vs 2.', 10,
  'Control-pase a un toque bajo presión de un defensor.', 15,
  'Posesión 6 vs 6 en espacio reducido, con transición rápida al perder el balón.', 15,
  'Circuito de fuerza con peso corporal: sentadillas búlgaras, plancha lateral, saltos suaves — 2-3 vueltas.', 10,
  'Conos, pecheras, balones'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'mayores', 2, 'Ataque por bandas y centros',
  'Explotar el ancho de la cancha y definir con centros al área.',
  'Desplazamientos + pase largo en movimiento.', 10,
  'Centros desde banda al área, con rematadores llegando por distintos carriles.', 15,
  'Juego 7 vs 7 con condición: finalizar jugadas por banda antes de rematar.', 15,
  'Circuito físico: sprints repetidos de 20m con cambios de dirección + core (plancha y antirotación).', 10,
  'Conos, balones, porterías'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'mayores', 3, 'Presión organizada y transiciones',
  'Presión coordinada en bloque medio y transición ofensiva rápida.',
  'Activación + rondo con presión progresiva.', 10,
  'Recuperación y salida rápida en espacio reducido (máximo 2 toques).', 15,
  'Juego 7 vs 7 con línea de presión definida, premiando recuperar y atacar en menos de 6 segundos.', 15,
  'Circuito de fuerza/agilidad: escalera + saltos + sprint — 2 vueltas.', 10,
  'Conos, balones, pecheras'
from clubes where slug = 'panteras';

insert into plantillas_planeacion (club_id, banda_edad, semana, titulo, objetivo, calentamiento_desc, calentamiento_min, tecnica_desc, tecnica_min, tactica_desc, tactica_min, cierre_desc, cierre_min, materiales)
select id, 'mayores', 4, 'Táctica fija completa',
  'Ejecutar jugadas ensayadas de tiro libre, esquina y saque de banda con movimientos coordinados.',
  'Activación + golpeo de balón parado (precisión).', 10,
  'Ejecución técnica de tiro libre directo/indirecto y centro de esquina.', 10,
  'Práctica de dos jugadas ensayadas de esquina y una de tiro libre, con roles definidos (rematador, bloqueo, segundo palo).', 15,
  'Partido dirigido 7 vs 7 aplicando jugadas fijas cuando se presenten + estiramiento.', 10,
  'Conos, balones, pecheras, porterías'
from clubes where slug = 'panteras';
