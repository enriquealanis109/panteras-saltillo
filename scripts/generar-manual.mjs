/**
 * Genera el PDF del Manual del Coordinador (Panteras Saltillo)
 * Ejecutar: node scripts/generar-manual.mjs
 */
import { jsPDF } from "jspdf";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, "..");
const OUT   = join(ROOT, "public", "manual-coordinador.pdf");

// ── Paleta de colores ──────────────────────────────────────────────────────
const C = {
  bg:      [10, 10, 10],
  white:   [255, 255, 255],
  green:   [22, 163, 74],
  greenLt: [134, 239, 172],
  gray:    [110, 110, 110],
  lgray:   [180, 180, 180],
  dark:    [25, 25, 25],
  body:    [65, 65, 65],
  line:    [225, 225, 225],
  tipBg:   [240, 253, 244],
  warnBg:  [254, 252, 232],
  warnBd:  [202, 138, 4],
  alertBg: [254, 242, 242],
  alertBd: [185, 28, 28],
  infoBg:  [239, 246, 255],
  infoBd:  [59, 130, 246],
};

const W = 210, H = 297, M = 16, CW = W - M * 2;
let doc, y, pageCount;

// ── Helpers ────────────────────────────────────────────────────────────────

function newPage() {
  doc.addPage();
  pageCount++;
  y = M + 4;
  // Mini header
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.lgray);
  doc.text("Panteras Saltillo · Guía del Coordinador · Módulo de Cobros", M, y + 3);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.line(M, y + 5, W - M, y + 5);
  y += 11;
}

function check(needed) {
  if (y + needed > H - 18) newPage();
}

// Etiqueta de sección tipo "01 · SECCIÓN"
function sectionTag(code, label) {
  check(10);
  doc.setFillColor(...C.green);
  doc.rect(M, y, 3, 3.5, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.lgray);
  doc.text(`${code} · ${label.toUpperCase()}`, M + 6, y + 3);
  y += 9;
}

// Título grande con palabra de acento verde
function h1(base, accent = "") {
  check(22);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  if (accent) {
    doc.text(base + " ", M, y);
    const bw = doc.getTextWidth(base + " ");
    doc.setTextColor(...C.green);
    doc.text(accent, M + bw, y);
    doc.setTextColor(...C.dark);
  } else {
    doc.text(base, M, y);
  }
  y += 13;
}

// Subtítulo con subrayado verde
function h2(text) {
  check(13);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(text, M, y);
  doc.setDrawColor(...C.green);
  doc.setLineWidth(0.5);
  doc.line(M, y + 1.5, M + doc.getTextWidth(text), y + 1.5);
  y += 9;
}

// Cuerpo de texto
function body(text, indent = 0) {
  const lines = (() => {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    return doc.splitTextToSize(text, CW - indent);
  })();
  check(lines.length * 5 + 2);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.body);
  doc.text(lines, M + indent, y);
  y += lines.length * 5 + 3;
}

// Bullet point
function bullet(text) {
  check(10);
  doc.setFillColor(...C.green);
  doc.circle(M + 2, y - 1.2, 1, "F");
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.body);
  const lines = doc.splitTextToSize(text, CW - 8);
  doc.text(lines, M + 6, y);
  y += lines.length * 5 + 1.5;
}

// Paso numerado con círculo verde
function step(n, title, detail) {
  check(24);
  // Círculo verde
  doc.setFillColor(...C.green);
  doc.circle(M + 4, y, 4, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(String(n), n >= 10 ? M + 1.8 : M + 2.8, y + 1.5);
  // Título
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(title, M + 11, y + 1.5);
  y += 8;
  // Detalle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.body);
  const lines = doc.splitTextToSize(detail, CW - 11);
  check(lines.length * 4.5 + 4);
  doc.text(lines, M + 11, y);
  y += lines.length * 4.5 + 5;
  // Separador sutil
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.line(M + 11, y - 2, W - M, y - 2);
  y += 1;
}

// Caja de tip / alerta
function box(text, type = "tip") {
  const bg = type === "tip" ? C.tipBg : type === "warn" ? C.warnBg : C.alertBg;
  const bd = type === "tip" ? C.green : type === "warn" ? C.warnBd : C.alertBd;
  const icon = type === "tip" ? "Consejo:" : type === "warn" ? "Importante:" : "Atencion:";

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(text, CW - 12);
  const bh = lines.length * 5 + 12;
  check(bh + 4);

  doc.setFillColor(...bg);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, CW, bh, 2, 2, "FD");
  doc.setFillColor(...bd);
  doc.roundedRect(M, y, 3, bh, 1, 1, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...bd);
  doc.text(icon, M + 7, y + 7);
  const iconW = doc.getTextWidth(icon);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.body);
  doc.text(lines, M + 7, y + 7 + 5);
  y += bh + 5;
}

function sp(mm = 4) { y += mm; }

function sep() {
  check(6);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;
}

// ── INICIO ─────────────────────────────────────────────────────────────────
doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
pageCount = 1;

// Carga logo
let logo64 = null;
try {
  const buf = readFileSync(join(ROOT, "public", "icon-192.png"));
  logo64 = "data:image/png;base64," + buf.toString("base64");
} catch { /* sin logo */ }

// ────────────────────────────────────────────────────────────────────────────
// PORTADA
// ────────────────────────────────────────────────────────────────────────────
doc.setFillColor(...C.bg);
doc.rect(0, 0, W, H, "F");

// Barra verde inferior
doc.setFillColor(...C.green);
doc.rect(0, H - 4, W, 4, "F");

// Logo + nombre (esquina superior izquierda)
const logoX = M, logoY = 12, logoS = 18;
if (logo64) {
  doc.addImage(logo64, "PNG", logoX, logoY, logoS, logoS, "", "FAST");
}
const textX = logo64 ? logoX + logoS + 4 : logoX;
doc.setFontSize(11);
doc.setFont("helvetica", "bold");
doc.setTextColor(255, 255, 255);
doc.text("Panteras Saltillo", textX, logoY + 7);
doc.setFontSize(7.5);
doc.setFont("helvetica", "normal");
doc.setTextColor(...C.lgray);
doc.text("ACADEMIA DE FUTBOL · SALTILLO, COAHUILA", textX, logoY + 13);

// Sección central
const midY = 88;
// Barra + "DOCUMENTACIÓN OFICIAL"
doc.setFillColor(...C.green);
doc.rect(M, midY, 12, 0.7, "F");
doc.setFontSize(7.5);
doc.setFont("helvetica", "bold");
doc.setTextColor(...C.gray);
doc.text("DOCUMENTACION OFICIAL", M + 15, midY + 0.5);

// Título grande
doc.setFontSize(40);
doc.setFont("helvetica", "bold");
doc.setTextColor(255, 255, 255);
doc.text("Guia del", M, midY + 24);
doc.setTextColor(...C.green);
doc.text("Coordinador", M, midY + 43);

doc.setFontSize(11);
doc.setFont("helvetica", "normal");
doc.setTextColor(...C.gray);
doc.text("Modulo de Cobros del Portal Panteras Saltillo", M, midY + 55);

// Info inferior
const botY = 245;
doc.setDrawColor(...C.gray);
doc.setLineWidth(0.3);
doc.line(M, botY, W - M, botY);

const infoItems = [
  ["Portal web:",          "panteras-saltillo.vercel.app"],
  ["Panel coordinador:",   "panteras-saltillo.vercel.app/coach"],
  ["Soporte:",             "flowra.digital"],
  ["Version:",             "1.0 - Junio 2026"],
];
let iy = botY + 7;
infoItems.forEach(([label, val]) => {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 200, 200);
  doc.text(label, M, iy);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gray);
  doc.text(val, M + 44, iy);
  iy += 6;
});

// Flowra (derecha)
doc.setFontSize(9);
doc.setFont("helvetica", "bold");
doc.setTextColor(...C.green);
doc.text("Flowra", W - M, botY + 7, { align: "right" });

// ────────────────────────────────────────────────────────────────────────────
// PÁGINA 2: TABLA DE CONTENIDO
// ────────────────────────────────────────────────────────────────────────────
doc.addPage();
pageCount = 2;
y = M + 8;

doc.setFontSize(28);
doc.setFont("helvetica", "bold");
doc.setTextColor(...C.dark);
doc.text("Contenido", M, y + 8);
y += 22;

const secciones = [
  ["01", "Panel principal",                            2],
  ["02", "Crear un concepto de cobro",                 3],
  ["03", "Registrar pagos y abonos",                   4],
  ["04", "Jugadores que no participan (N/A)",          5],
  ["05", "Resumen y compartir imagen PNG",             5],
  ["06", "Archivar, eliminar e historial",             6],
  ["07", "Sesion y seguridad",                         7],
];

secciones.forEach(([num, title, page]) => {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.green);
  doc.text(num, M, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.dark);
  doc.text(title, M + 13, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.body);
  doc.text(String(page), W - M, y, { align: "right" });

  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.25);
  doc.line(M, y + 2.5, W - M, y + 2.5);
  y += 11;
});

// ────────────────────────────────────────────────────────────────────────────
// PÁGINA 3: PANEL PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
doc.addPage(); pageCount = 3; y = M + 8;

sectionTag("01", "Panel principal");
h1("Panel", "principal");
body("Al iniciar sesion llegas a tu panel de coordinadora. Desde aqui tienes acceso a todas tus categorias asignadas y un resumen de la informacion mas importante.");
sp(3);

h2("Los 3 indicadores del resumen");
body("En la parte superior del panel veras tres tarjetas con informacion clave:");
sp(2);
bullet("Jugadores activos — total de ninos en todas tus categorias asignadas.");
bullet("Docs completos — porcentaje de jugadores con toda su papeleria subida (Acta + CURP + Constancia o Pasaporte).");
bullet("Docs pendientes — cuantos jugadores todavia les faltan documentos.");
sp(3);

h2("Las tarjetas de categoria");
body("Cada categoria asignada aparece como una tarjeta con el porcentaje de documentos completos y dos botones de acceso rapido:");
sp(2);
bullet("Docs — entra al modulo de documentos de esa categoria.");
bullet("Cobros — entra al modulo de cobros de esa categoria.");
sp(3);

box("Si tienes mas de una categoria asignada, veras una tarjeta por cada una. El color de la barra cambia de rojo a amarillo a verde conforme aumenta el porcentaje de documentos completos.", "tip");
sp(2);

h2("Menu de opciones");
step(1, "Toca el icono de tres lineas en la esquina superior derecha", "Se abre el menu con accesos a: Ver sitio web, Guia del coordinador, Cambiar contrasena y Cerrar sesion.");

// ────────────────────────────────────────────────────────────────────────────
// PÁGINA 4: CREAR CONCEPTO
// ────────────────────────────────────────────────────────────────────────────
doc.addPage(); pageCount = 4; y = M + 8;

sectionTag("02", "Crear un concepto de cobro");
h1("Crear un", "concepto de cobro");
body("Un concepto es cualquier cobro que necesites gestionar: torneo, copa, venta de chocolates, uniforme, etc. Tu creas y administras los conceptos de tus categorias de forma independiente.");
sp(3);

step(1, "Entra a Cobros desde tu panel", "Toca el boton Cobros en la tarjeta de la categoria que quieres gestionar.");
step(2, "Toca + Nuevo en el encabezado de la tabla", "El boton verde + Nuevo aparece en la parte superior del encabezado de la tabla.");
step(3, "Escribe el nombre del concepto", "Por ejemplo: Copa Saltillo, Chocolates mayo, Torneo Monterrey, Uniforme temporada.");
step(4, "Elige el tipo", "Selecciona Torneo, Copa, Actividad u Otro. Solo cambia el color del indicador en la tabla.");
step(5, "Escribe el monto por jugador (opcional)", "Si pones un monto (ej. $1,550), el sistema calculara automaticamente cuanto se ha recaudado y cuanto falta. Sin monto, las celdas son chips simples que cambias entre Completo y Pendiente.");
step(6, "Toca Crear", "El concepto aparece como una columna nueva en la tabla con todos los jugadores en estado pendiente.");
sp(2);

box("Si tienes varios torneos activos al mismo tiempo, puedes crear un concepto por cada uno. Cada columna de la tabla corresponde a un concepto diferente.", "tip");

// ────────────────────────────────────────────────────────────────────────────
// PÁGINA 5: PAGOS Y ABONOS
// ────────────────────────────────────────────────────────────────────────────
doc.addPage(); pageCount = 5; y = M + 8;

sectionTag("03", "Registrar pagos y abonos");
h1("Registrar pagos", "y abonos");
body("El sistema de abonos te permite registrar pagos parciales que se acumulan automaticamente. No necesitas hacer ninguna suma manual.");
sp(3);

h2("Registrar el primer pago");
step(1, "Toca la celda del jugador", "La celda muestra Tocar para anotar. Al tocarla se abre el modal de pago.");
step(2, "Escribe la cantidad que entrego", "Solo lo que te dieron en esa ocasion. Por ejemplo: 500. No escribas el total acumulado.");
step(3, "Revisa el calculo automatico", "El sistema muestra: Total despues del abono: $500 (falta $1,050). Verifica que este correcto.");
step(4, "Toca Guardar", "La celda se actualiza mostrando $500 con una barra de progreso amarilla.");
sp(3);

h2("Agregar un abono la semana siguiente");
body("Cuando el papa entrega mas dinero, NO tienes que sumar manualmente. El sistema lo hace por ti.");
sp(2);
step(1, "Toca la celda del jugador que ya tiene un abono", "Veras el acumulado anterior. Ej: Acumulado: $500.");
step(2, "El modo + Abonar ya esta activo", "Solo escribe lo nuevo que entregaron, por ejemplo: 500.");
step(3, "El sistema calcula el nuevo total", "Muestra: Total despues del abono: $1,000 (falta $550). Toca Guardar.");
sp(2);

box("Cada vez que abres la celda de un jugador, el sistema ya sabe cuanto lleva acumulado. Solo escribe el nuevo abono, nunca el total.", "tip");
sp(2);

h2("Corregir un error");
step(1, "Toca la celda del jugador", "Se abre el modal con el acumulado actual.");
step(2, "Toca la pestana Corregir total", "Cambia al modo de correccion de total exacto.");
step(3, "Escribe el total correcto y toca Guardar", "El sistema reemplaza el total con el valor correcto.");

// ────────────────────────────────────────────────────────────────────────────
// PÁGINA 6: N/A + RESUMEN + IMAGEN
// ────────────────────────────────────────────────────────────────────────────
doc.addPage(); pageCount = 6; y = M + 8;

sectionTag("04", "Jugadores que no participan");
h1("Jugadores que", "no participan (N/A)");
body("Cuando un jugador no va a participar en un torneo o actividad especifica, marcalo como N/A para que no cuente en el total esperado de ese concepto.");
sp(2);

step(1, "Toca la celda del jugador", "Se abre el modal de pago.");
step(2, "Activa No participa en este cobro (N/A)", "Toca la casilla al fondo del modal. Se marca con una paloma.");
step(3, "Toca Guardar", "La celda cambia a N/A en gris y el jugador deja de contar en los totales.");
sp(2);
box("El resumen calcula el total esperado multiplicando el monto por los jugadores que SI participan (los que no son N/A). El porcentaje siempre es exacto.", "tip");
sp(4);

sectionTag("05", "Resumen y compartir imagen");
h1("Resumen y", "compartir imagen PNG");
sp(1);

h2("Leer el resumen");
body("Al fondo de la pagina de cobros hay una tarjeta de resumen por cada concepto activo:");
sp(1);
bullet("Total recaudado hasta el momento.");
bullet("Meta total (monto x jugadores que participan, excluyendo N/A).");
bullet("Barra de progreso: rojo (<40%), amarillo (40-79%), verde (80% o mas).");
sp(3);

h2("Generar imagen PNG para WhatsApp");
step(1, "Baja al Resumen al fondo de la pantalla", "Veras la tarjeta del concepto con el total recaudado.");
step(2, "Toca Imagen PNG", "El portal genera en segundos una imagen con la lista completa de jugadores, montos y total.");
step(3, "Se abre el menu de compartir del telefono", "Aparecen opciones: WhatsApp, guardar en fotos, Instagram, etc.");
step(4, "Toca WhatsApp y elige el grupo", "La imagen se envia directamente. Los papas pueden ver el estatus de todos claramente.");
sp(2);
box("La imagen incluye: nombre del concepto, categoria, monto por jugador, estatus de cada jugador con barra de progreso parcial, y total recaudado vs. la meta.", "tip");

// ────────────────────────────────────────────────────────────────────────────
// PÁGINA 7: ARCHIVAR / HISTORIAL
// ────────────────────────────────────────────────────────────────────────────
doc.addPage(); pageCount = 7; y = M + 8;

sectionTag("06", "Archivar, eliminar e historial");
h1("Archivar, eliminar", "e historial");
body("Cuando un cobro termina, puedes archivarlo para mantener el portal limpio sin perder el historial. Hay dos opciones con comportamientos muy diferentes:");
sp(3);

// Caja ARCHIVAR
const ay = y;
const aH = 26;
doc.setFillColor(...C.tipBg);
doc.setDrawColor(...C.line);
doc.setLineWidth(0.2);
doc.roundedRect(M, ay, CW, aH, 2, 2, "FD");
doc.setFillColor(...C.green);
doc.roundedRect(M, ay, 3, aH, 1, 1, "F");
doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.green);
doc.text("Archivar", M + 7, ay + 8);
doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.body);
const aLines = doc.splitTextToSize("Oculta el concepto de la tabla activa. Todos los registros de pago se conservan. Usalo cuando el cobro ya termino pero quieres guardar el historial.", CW - 10);
doc.text(aLines, M + 7, ay + 14);
y = ay + aH + 5;

// Caja ELIMINAR
const ey = y;
const eH = 26;
doc.setFillColor(...C.alertBg);
doc.setDrawColor(...C.line);
doc.roundedRect(M, ey, CW, eH, 2, 2, "FD");
doc.setFillColor(...C.alertBd);
doc.roundedRect(M, ey, 3, eH, 1, 1, "F");
doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.alertBd);
doc.text("Eliminar", M + 7, ey + 8);
doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.body);
const eLines = doc.splitTextToSize("Borra el concepto y TODOS sus registros de pago de forma permanente. Usalo solo si creaste el concepto por error. No se puede deshacer.", CW - 10);
doc.text(eLines, M + 7, ey + 14);
y = ey + eH + 7;

h2("Como archivar un concepto");
step(1, "Toca opciones bajo el nombre del concepto en el encabezado de la tabla", "Aparece el menu con las opciones Archivar y Eliminar.");
step(2, "Toca Archivar", "El concepto desaparece de la tabla activa pero se guarda en el historial.");
sp(2);

h2("Ver el historial de archivados");
body("Al fondo de la pagina de cobros hay un boton Ver historial archivado (N). Al tocarlo se despliegan todos los conceptos archivados con el total que llegaron a recaudar.");
sp(2);
box("Es buena practica archivar los conceptos al terminar cada temporada. El portal queda limpio para la siguiente y el historial siempre esta disponible.", "tip");

// ────────────────────────────────────────────────────────────────────────────
// PÁGINA 8: SESIÓN Y SOPORTE
// ────────────────────────────────────────────────────────────────────────────
doc.addPage(); pageCount = 8; y = M + 8;

sectionTag("07", "Sesion y seguridad");
h1("Sesion", "y seguridad");
body("El portal cierra la sesion automaticamente en dos situaciones para proteger la informacion de los jugadores y sus familias.");
sp(3);

h2("Al cerrar el navegador o la app");
body("Si cierras Chrome, Safari o la app del telefono por completo, la sesion se cierra. La proxima vez que entres al portal tendras que iniciar sesion de nuevo.");
sp(3);

h2("Por inactividad (45 minutos)");
body("Si dejas el portal abierto sin tocarlo por 45 minutos, aparece un aviso amarillo en la parte inferior: Sesion por cerrar — 3 min por inactividad.");
sp(2);
bullet("Toca Continuar para seguir usando el portal.");
bullet("Si no lo tocas en 3 minutos, la sesion se cierra automaticamente.");
sp(3);
box("Nunca compartas tu contrasena con nadie. Cada coordinadora tiene su propia cuenta para que los registros sean siempre precisos.", "warn");
sp(5);

sep();
sp(2);

// Seccion de soporte
h2("Necesitas ayuda?");
body("Para errores tecnicos, preguntas sobre el portal o nuevas funcionalidades, contacta al equipo de soporte de Flowra:");
sp(2);

// Dos tarjetas de info
const c1W = (CW - 4) / 2;

// Soporte tecnico
doc.setFillColor(245, 245, 245);
doc.setDrawColor(...C.line);
doc.setLineWidth(0.2);
doc.roundedRect(M, y, c1W, 30, 2, 2, "FD");
doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.lgray);
doc.text("SOPORTE TECNICO", M + 4, y + 6);
doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
doc.text("flowra.digital", M + 4, y + 13);
doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.body);
doc.text("Para errores, cambios o", M + 4, y + 19);
doc.text("nuevas funcionalidades.", M + 4, y + 24);
doc.setFontSize(8); doc.setTextColor(...C.green);
doc.text("enriquealanis109@gmail.com", M + 4, y + 29);

// Horario
const cx2 = M + c1W + 4;
doc.setFillColor(245, 245, 245);
doc.roundedRect(cx2, y, c1W, 30, 2, 2, "FD");
doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.lgray);
doc.text("TIEMPO DE RESPUESTA", cx2 + 4, y + 6);
doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
doc.text("24 – 48 horas", cx2 + 4, y + 13);
doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.body);
doc.text("Para solicitudes de cambio", cx2 + 4, y + 19);
doc.text("en dias habiles.", cx2 + 4, y + 24);
doc.setFontSize(8); doc.setTextColor(...C.green);
doc.text("Lunes a Sabado · 9am – 8pm", cx2 + 4, y + 29);

y += 36;

// Info del sitio (caja oscura)
doc.setFillColor(...C.bg);
doc.setDrawColor(...C.bg);
doc.roundedRect(M, y, CW, 32, 2, 2, "FD");
doc.setFillColor(...C.green);
doc.roundedRect(M, y, 3, 32, 1, 1, "F");

doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.green);
doc.text("INFORMACION DEL PORTAL", M + 7, y + 6);

doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(160, 160, 160);
doc.text("Portal:", M + 7, y + 13);
doc.text("panteras-saltillo.vercel.app", M + 30, y + 13);
doc.text("Panel admin:", M + 7, y + 19);
doc.text("panteras-saltillo.vercel.app/coach", M + 30, y + 19);
doc.text("Soporte:", M + 7, y + 25);
doc.text("flowra.digital", M + 30, y + 25);

doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
doc.setTextColor(...C.green);
doc.text("Flowra · Guia del Coordinador v1.0 · Junio 2026", W - M, y + 31, { align: "right" });

y += 32;

// ── Numeros de pagina en todas las paginas (excepto portada) ────────────────
const totalPages = doc.getNumberOfPages();
for (let i = 2; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.lgray);
  doc.text(`${i - 1} / ${totalPages - 1}`, W - M, H - 8, { align: "right" });
}

// ── Guardar ────────────────────────────────────────────────────────────────
const outBuf = Buffer.from(doc.output("arraybuffer"));
writeFileSync(OUT, outBuf);
console.log(`PDF generado: ${OUT}`);
