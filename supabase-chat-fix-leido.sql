-- ══════════════════════════════════════════
-- PANTERAS — Fix: marcar mensajes como leídos fallaba siempre
-- La política "for all" de mensajes exigía autor_id = auth.uid() incluso
-- para UPDATE — pero marcar como leído un mensaje ajeno es justo lo
-- contrario (actualizas un mensaje que NO escribiste tú). Se separa en
-- tres políticas: insert exige ser el autor, select/update no.
-- Ejecutar en Supabase SQL Editor.
-- ══════════════════════════════════════════

drop policy if exists "Mensajes: del hilo propio o admin" on mensajes;

create policy "Mensajes: select propio hilo o admin" on mensajes for select
  using (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      exists (
        select 1 from conversaciones c
        join entrenadores e on e.id = auth.uid()
        where c.id = mensajes.conversacion_id and c.entrenador_id = auth.uid() and e.rol in ('entrenador','ambos')
      )
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  );

create policy "Mensajes: insert como autor" on mensajes for insert
  with check (
    autor_id = auth.uid()
    and auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      exists (
        select 1 from conversaciones c
        join entrenadores e on e.id = auth.uid()
        where c.id = mensajes.conversacion_id and c.entrenador_id = auth.uid() and e.rol in ('entrenador','ambos')
      )
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  );

create policy "Mensajes: update leido propio hilo o admin" on mensajes for update
  using (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      exists (
        select 1 from conversaciones c
        join entrenadores e on e.id = auth.uid()
        where c.id = mensajes.conversacion_id and c.entrenador_id = auth.uid() and e.rol in ('entrenador','ambos')
      )
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  )
  with check (
    auth.role() = 'authenticated' and club_id = current_club_id()
    and (
      exists (
        select 1 from conversaciones c
        join entrenadores e on e.id = auth.uid()
        where c.id = mensajes.conversacion_id and c.entrenador_id = auth.uid() and e.rol in ('entrenador','ambos')
      )
      or exists (select 1 from entrenadores e where e.id = auth.uid() and e.rol = 'admin')
    )
  );
