export interface TourStep {
  title: string;
  body: string;
  targetId?: string;
}

export interface PanelTourData {
  label: string;
  steps: TourStep[];
}

export const ADMIN_TOURS: Record<string, PanelTourData> = {
  "/admin": {
    label: "Dashboard",
    steps: [
      {
        title: "Estado global de listas",
        body: "Este badge muestra si todos los entrenadores ya pasaron lista hoy. Verde significa al día. Gris pulsando significa que hay categorías pendientes.",
        targetId: "tour-badge-listas",
      },
      {
        title: "Indicadores del panel",
        body: "Cada tarjeta muestra un dato clave: jugadores activos, asistencia de hoy, documentos pendientes y citas agendadas. Toca cualquier tarjeta para ir directamente a esa sección.",
        targetId: "tour-kpis",
      },
      {
        title: "Asistencia por categoría",
        body: "Muestra en tiempo real qué entrenadores ya pasaron lista y el porcentaje de asistencia de cada categoría. El punto gris indica lista aún pendiente.",
        targetId: "tour-cat-asistencia",
      },
      {
        title: "Accesos rápidos",
        body: "Atajos para navegar a todas las secciones del panel. También puedes usar el menú lateral en desktop o la barra inferior en móvil.",
        targetId: "tour-accesos-rapidos",
      },
    ],
  },
  "/admin/entrenadores": {
    label: "Cuerpo Técnico",
    steps: [
      {
        title: "Agregar miembro al staff",
        body: "Toca este botón para dar acceso a un entrenador, coordinador o administrador. Asígnale un rol y las categorías que tendrá a cargo.",
        targetId: "tour-btn-nuevo-miembro",
      },
      {
        title: "Filtros por rol y categoría",
        body: "Filtra la lista por tipo de usuario (Admin, Coordinador, Entrenador) o por categoría asignada para encontrar rápidamente a quien necesitas.",
        targetId: "tour-filtros-rol",
      },
      {
        title: "Gestión de cada miembro",
        body: "Cada tarjeta muestra el nombre, rol y categorías asignadas. Toca 'Editar' para cambiar datos o categorías. 'Eliminar' revoca el acceso completamente.",
        targetId: "tour-lista-miembros",
      },
    ],
  },
  "/admin/documentos": {
    label: "Documentos",
    steps: [
      {
        title: "Estado de expedientes por categoría",
        body: "Cada tarjeta muestra el porcentaje de jugadores con expediente completo. Completo significa que el jugador tiene Acta, CURP y al menos Constancia o Pasaporte subidos.",
        targetId: "tour-docs-lista",
      },
      {
        title: "Desglose por tipo de documento",
        body: "Los 5 indicadores en cada tarjeta (Acta, CURP, Const., Pasap., Foto) muestran cuántos jugadores tienen ese documento subido. Ideal para detectar qué documentos faltan masivamente.",
        targetId: "tour-docs-lista",
      },
      {
        title: "Gestión por jugador",
        body: "Toca cualquier categoría para ver el expediente jugador por jugador. Desde ahí puedes subir, reemplazar o eliminar documentos y generar un PDF unificado del expediente completo.",
      },
    ],
  },
  "/admin/jugadores": {
    label: "Jugadores",
    steps: [
      {
        title: "Buscar jugador",
        body: "Escribe el nombre para filtrar en tiempo real entre todos los jugadores activos de la academia.",
        targetId: "tour-jugadores-busqueda",
      },
      {
        title: "Filtrar por categoría",
        body: "Usa este selector para ver solo los jugadores de una categoría específica. Se puede combinar con la búsqueda por nombre.",
        targetId: "tour-jugadores-categoria",
      },
      {
        title: "Lista de jugadores activos",
        body: "Muestra todos los jugadores activos con su categoría y alias. Vista de solo lectura — los jugadores se gestionan desde el portal de cada entrenador.",
        targetId: "tour-jugadores-tabla",
      },
    ],
  },
  "/admin/metricas": {
    label: "Métricas",
    steps: [
      {
        title: "Seleccionar período",
        body: "Cambia entre 7, 30 o 90 días para analizar la actividad en diferentes rangos de tiempo. Útil para reportes mensuales o detectar tendencias.",
        targetId: "tour-metricas-periodo",
      },
      {
        title: "Actividad del sitio público",
        body: "Registra cuántas personas hicieron clic en 'Inscribir', abrieron el chatbot o agendaron una cita desde el sitio web de Panteras.",
        targetId: "tour-metricas-actividad",
      },
      {
        title: "Gestión de citas",
        body: "Cada cita agendada aparece aquí. Toca el badge 'Pendiente' para marcarla como 'Realizada' una vez atendida. El botón X elimina la cita del registro.",
        targetId: "tour-metricas-citas",
      },
    ],
  },
  "/admin/padres": {
    label: "Padres",
    steps: [
      {
        title: "Generar código de invitación",
        body: "Selecciona la categoría del hijo y genera un código de un solo uso válido por 24 horas. Toca 'Copiar link' y envíalo por WhatsApp al padre para que cree su cuenta antes de que expire.",
        targetId: "tour-padres-generar",
      },
      {
        title: "Cambiar entre vistas",
        body: "La pestaña 'Padres registrados' lista todas las cuentas. La pestaña 'Codigos' muestra los códigos generados con su estado y fecha de expiración. Puedes eliminar códigos no deseados con el ícono de basurero.",
        targetId: "tour-padres-tabs",
      },
      {
        title: "Control de acceso y eliminación",
        body: "Usa 'Desactivar' para bloquear el acceso temporalmente sin borrar la cuenta. Usa el ícono de basurero para eliminar la cuenta por completo — esto borra todos sus datos de confirmaciones y notificaciones.",
      },
    ],
  },
  "/admin/partidos": {
    label: "Partidos",
    steps: [
      {
        title: "Filtrar por categoría",
        body: "Usa estos chips para ver los partidos de una sola categoría o todos al mismo tiempo.",
        targetId: "tour-partidos-filtro",
      },
      {
        title: "Historial de partidos",
        body: "Cada tarjeta muestra la liga, rival, fecha y el porcentaje de asistencia. El resultado aparece cuando el entrenador lo registra desde su portal de estadísticas.",
        targetId: "tour-partidos-lista",
      },
      {
        title: "Detalle y asistencia",
        body: "Toca cualquier partido para ver la lista de jugadores que asistieron y para registrar el resultado final si tienes permisos de edición.",
      },
    ],
  },
  "/admin/patrocinadores": {
    label: "Patrocinadores",
    steps: [
      {
        title: "Agregar patrocinador",
        body: "Escribe el nombre, URL del sitio web (opcional) y sube el logo. El logo aparece automáticamente en la sección de patrocinadores del sitio público.",
        targetId: "tour-pat-form",
      },
      {
        title: "Gestionar visibilidad",
        body: "El botón 'Activo' / 'Oculto' controla si el patrocinador se muestra en el sitio web. 'Borrar' elimina el registro y la imagen de forma permanente.",
        targetId: "tour-pat-lista",
      },
    ],
  },
  "/admin/tienda": {
    label: "Tienda",
    steps: [
      {
        title: "Agregar producto",
        body: "Escribe nombre, descripción y precio, sube una imagen (verás la vista previa) y marca 'Personalizable' si el cliente debe escribir nombre y número (ej. uniformes). Agrega las tallas y su stock ahí mismo, antes de guardar — para niños usa talla y edad, para adultos usa S/M/L/XL. El producto aparece automáticamente en la tienda pública si está marcado como activo.",
        targetId: "tour-tienda-form",
      },
      {
        title: "Gestionar catálogo",
        body: "El botón 'Activo' / 'Oculto' controla si el producto se muestra en la tienda. 'Borrar' elimina el producto y su imagen de forma permanente.",
        targetId: "tour-tienda-lista",
      },
      {
        title: "Editar tallas, stock y personalización después",
        body: "Toca 'Gestionar tallas y stock' en cualquier producto ya creado para agregar más variantes, ajustar el inventario o quitar tallas. El botón 'Personalizable' / 'Sin personalizar' junto a él activa o desactiva en cualquier momento que el cliente pueda escribir nombre y número, aunque el producto ya esté publicado.",
        targetId: "tour-tienda-variantes",
      },
    ],
  },
  "/admin/pedidos": {
    label: "Pedidos",
    steps: [
      {
        title: "Filtrar por estado",
        body: "Usa estos chips para ver solo los pedidos pendientes de pago, pagados, listos para recoger, entregados o cancelados.",
        targetId: "tour-pedidos-filtro",
      },
      {
        title: "Revisar pedidos",
        body: "Cada tarjeta muestra el cliente, teléfono y total. Toca 'Ver items' para revisar qué productos, tallas y cantidades pidió antes de confirmar el pago.",
        targetId: "tour-pedidos-lista",
      },
      {
        title: "Avanzar y cancelar pedidos",
        body: "Una vez que confirmes el pago por transferencia, usa el botón de estado para avanzar el pedido paso a paso hasta 'Entregado'. 'Cancelar' restaura automáticamente el stock de cada producto.",
        targetId: "tour-pedidos-cancelar",
      },
    ],
  },
  "/admin/categorias": {
    label: "Categorías",
    steps: [
      {
        title: "Gestionar cada categoría",
        body: "Toca cualquier tarjeta para gestionar el contenido público de esa categoría: palmarés de títulos, plantel de jugadores, galería de fotos y cuerpo técnico.",
        targetId: "tour-cats-grid",
      },
      {
        title: "Indicadores por categoría",
        body: "Cada tarjeta muestra cuántos jugadores activos tiene y si hay documentos pendientes. El número gris indica jugadores con expediente incompleto.",
      },
    ],
  },
};
