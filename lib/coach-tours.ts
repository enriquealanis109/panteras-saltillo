import type { TourStep } from "./admin-tours";

export const DASHBOARD_STEPS: TourStep[] = [
  {
    title: "Resumen del día",
    body: "Estas tarjetas muestran los jugadores activos a tu cargo, el porcentaje de asistencia de hoy y cuántos jugadores tienen documentos pendientes.",
    targetId: "tour-coach-kpis",
  },
  {
    title: "Acciones rápidas",
    body: "Accesos directos a Avisos (generar mensajes de WhatsApp), Partidos (historial de juegos) y el sitio web de Panteras.",
    targetId: "tour-coach-acciones",
  },
  {
    title: "Mis categorías",
    body: "Cada tarjeta corresponde a una categoría asignada. Muestra el estado de la lista de hoy, la asistencia y los botones de acción: Lista, Semanal, Mensual, Evaluar y Docs.",
    targetId: "tour-coach-categorias",
  },
  {
    title: "Menú de opciones",
    body: "Accede al menú con el ícono de tres líneas. Desde ahí puedes ir al sitio web, cambiar tu contraseña o cerrar sesión.",
  },
];

export const LISTA_STEPS: TourStep[] = [
  {
    title: "Progreso de la lista",
    body: "La barra verde en el encabezado muestra en tiempo real cuántos jugadores ya fueron marcados. Se vuelve verde sólido cuando la lista está completa.",
  },
  {
    title: "Resumen rápido",
    body: "Muestra de un vistazo cuántos jugadores están presentes, cuántos faltan por marcar y cuántos están ausentes en este momento.",
    targetId: "tour-lista-resumen",
  },
  {
    title: "Marcar todos presentes",
    body: "Atajo para marcar a todo el grupo como presente con un solo toque. Solo aparece cuando hay jugadores sin marcar. Puedes ajustar individualmente después.",
    targetId: "tour-lista-todos",
  },
  {
    title: "Registrar asistencia",
    body: "Para cada jugador elige: Presente, Tarde (cuenta como asistencia), Permiso (falta justificada, no afecta el porcentaje) o Ausente. Puedes agregar una nota en los tres últimos estados.",
    targetId: "tour-lista-jugadores",
  },
  {
    title: "Guardar la lista",
    body: "Toca este botón para guardar la asistencia del día. Los jugadores sin estado asignado se guardan automáticamente como ausentes. La lista solo se puede pasar una vez por día.",
    targetId: "tour-lista-guardar",
  },
];

export const AVISOS_STEPS: TourStep[] = [
  {
    title: "Tipo de aviso",
    body: "Elige el tipo: Partido para el aviso de juego (también registra el partido en el sistema), Cancelación para avisar que no hay práctica, o General para cualquier mensaje libre.",
    targetId: "tour-avisos-tipo",
  },
  {
    title: "Datos del aviso",
    body: "Llena la liga, rival, día, horario, lugar y uniforme. Si tienes más de una categoría, selecciona a cuál aplica para que el partido se registre correctamente y puedas pasar lista después.",
    targetId: "tour-avisos-form",
  },
  {
    title: "Convocatoria",
    body: "Toca 'Agregar convocatoria' para seleccionar qué jugadores van a ese partido. Útil cuando tienes muchos niños en diferentes ligas. La lista numerada de convocados se incluye en el mensaje de WhatsApp y solo ellos quedan registrados en la asistencia del partido.",
    targetId: "tour-avisos-form",
  },
  {
    title: "Vista previa",
    body: "Aquí ves exactamente cómo quedará el mensaje en WhatsApp antes de enviarlo. El mensaje se genera automáticamente con el formato establecido.",
    targetId: "tour-avisos-preview",
  },
  {
    title: "Copiar o enviar",
    body: "'Copiar' pone el texto en el portapapeles. 'Enviar por WhatsApp' abre la app con el mensaje listo para pegar. Al enviar un aviso de partido, se registra automáticamente en el historial.",
    targetId: "tour-avisos-botones",
  },
];

export const REPORTES_STEPS: TourStep[] = [
  {
    title: "Navegar por semanas",
    body: "Usa 'Anterior' y 'Siguiente' para moverte entre semanas. La tabla siempre muestra Lunes a Jueves de la semana seleccionada.",
    targetId: "tour-reportes-semana",
  },
  {
    title: "Tabla de asistencia",
    body: "P = Presente, T = Tarde (cuenta como asistencia), Pe = Permiso (no afecta el porcentaje), A = Ausente, — = Sin registro. La columna 'Asist.' calcula el porcentaje real excluyendo los permisos.",
    targetId: "tour-reportes-tabla",
  },
  {
    title: "Compartir PDF",
    body: "Genera un reporte en PDF con la tabla de asistencia de la semana actual. En móvil abre el menú de compartir; en desktop descarga el archivo directamente.",
  },
];

export const MENSUAL_STEPS: TourStep[] = [
  {
    title: "Navegar por meses",
    body: "Usa 'Anterior' y 'Siguiente' para cambiar de mes. La tabla muestra el resumen de todos los días Lun-Jue del mes seleccionado.",
    targetId: "tour-mensual-selector",
  },
  {
    title: "Resumen mensual",
    body: "Cada fila muestra el número de veces Presente (P), Tarde (T) y Ausente (A) de cada jugador, más el porcentaje de asistencia real del mes (los permisos no cuentan como falta).",
    targetId: "tour-mensual-tabla",
  },
  {
    title: "Generar PDF mensual",
    body: "El botón 'PDF' en la esquina superior derecha genera el reporte mensual completo listo para compartir o imprimir.",
  },
];

export const EVALUAR_STEPS: TourStep[] = [
  {
    title: "Seleccionar jugador",
    body: "Toca el nombre de un jugador para acceder a su ficha de evaluación individual. Puedes calificar aspectos técnicos, tácticos y físicos, y agregar notas de seguimiento personalizado.",
    targetId: "tour-evaluar-lista",
  },
];

export const DOCUMENTOS_STEPS: TourStep[] = [
  {
    title: "Estado de documentos",
    body: "Cada fila muestra qué documentos tiene subido el jugador: Acta de nacimiento, CURP, Constancia de estudios, Pasaporte y Foto. El círculo verde indica que el documento está cargado.",
    targetId: "tour-docs-lista",
  },
  {
    title: "Gestionar expediente",
    body: "Toca cualquier jugador para ver su expediente completo. Desde ahí puedes subir, reemplazar o eliminar documentos, verlos directamente o generar un PDF unificado del expediente.",
  },
  {
    title: "Imprimir todos",
    body: "El botón 'Imprimir todos' en el encabezado genera un PDF con todos los documentos de todos los jugadores de la categoría en un solo archivo.",
  },
];

export const COBROS_STEPS: TourStep[] = [
  {
    title: "Tabla de cobros",
    body: "Cada fila es un jugador. Las columnas son los torneos, copas o actividades que creaste. Toca cualquier celda para anotar el pago.",
    targetId: "tour-cobros-tabla",
  },
  {
    title: "Anotar cuánto pagó cada papá",
    body: "Si el concepto tiene monto (ej. $1,500), al tocar la celda se abre un campo para anotar cuánto te entregaron. El sistema calcula automáticamente si está completo o cuánto falta. Si el jugador no participa, marca N/A.",
  },
  {
    title: "Conceptos sin monto fijo",
    body: "Si no defines un monto, las celdas son chips que ciclan entre PENDIENTE, COMPLETO y N/A con un solo toque. Útil para permisos o entregas que no tienen costo variable.",
  },
  {
    title: "Crear nuevo concepto",
    body: "Toca '+ Nuevo' al final del encabezado de la tabla para agregar un torneo, copa o actividad. Si defines el monto por jugador, el resumen mostrará el total recaudado vs el esperado.",
    targetId: "tour-cobros-nuevo",
  },
  {
    title: "Resumen y totales",
    body: "Al final de la página aparece un resumen por concepto: total recaudado, meta y porcentaje de avance. Los conceptos terminados se pueden archivar para mantener el historial.",
    targetId: "tour-cobros-resumen",
  },
];

export const PARTIDOS_COACH_STEPS: TourStep[] = [
  {
    title: "Historial de partidos",
    body: "Lista todos los partidos de tus categorías ordenados por fecha. Muestra el resultado, la asistencia registrada y el porcentaje. Los partidos se crean desde la sección 'Avisos'.",
    targetId: "tour-coach-partidos-lista",
  },
  {
    title: "Acciones por partido",
    body: "Cada tarjeta tiene 4 acciones: Editar datos (liga, rival, fecha, uniforme), Compartir PDF con la lista de asistentes, Notificar a los padres por push notification, y Eliminar el partido.",
  },
  {
    title: "Ver detalle del partido",
    body: "Toca la tarjeta (fuera de los botones de acción) para ver el detalle completo: quiénes asistieron al partido, el resultado y las estadísticas.",
  },
];
