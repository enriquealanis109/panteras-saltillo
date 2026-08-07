import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createAppointment } from "@/lib/calendar";
import { trackEvento } from "@/lib/analytics";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate limit en memoria: ~10 mensajes/min por IP. No persiste entre cold starts
// ni se comparte entre instancias serverless, pero frena scripts/loops obvios
// sin depender de infraestructura nueva (Redis, etc.).
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  HITS.set(ip, hits);
  return hits.length > MAX_HITS;
}

const SYSTEM = `Eres el asistente de Panteras Saltillo, academia de futbol.

INFORMACION GENERAL:
- Ubicacion: Canchas del Colegio Vivir, Carretera Los Gonzalez Km 1, Los Tulipanes, Saltillo
- Horarios: Lunes a jueves, 5:00 pm a 7:00 pm
- WhatsApp: 844 502 8582

CATEGORIAS (por año de nacimiento):
- CAT 2021: 4-5 años
- CAT 2020: 5-6 años
- CAT 2019: 6-7 años
- CAT 2018: 7-8 años
- CAT 2017: 8-9 años
- CAT 2016: 9-10 años
- CAT 2015: 10-11 años
- CAT 2014: 11-12 años
- CAT 2013: 12-13 años

CATEGORIAS NO DISPONIBLES:
- Si el niño es de 2012, 2011 o anterior, responde: "Por el momento no contamos con categoria para ese año de nacimiento. En cuanto se abra una nueva categoria te avisamos. Puedes dejarnos tu WhatsApp para mantenerte informado."

PORTEROS:
- Si preguntan sobre entrenamiento de porteros: si hay, dos veces por semana, pero el horario depende del entrenador asignado.
- Si el papa o mama esta interesado, continuar con el flujo de agendar la clase de prueba.

ROPA PARA LA PRUEBA:
- Si preguntan que ropa llevar: short negro y playera blanca, nada mas.

ESTILO:
- Solo en espanol
- Sin emojis
- Respuestas cortas con saltos de linea
- Una pregunta a la vez

FLUJO PARA AGENDAR CLASE DE PRUEBA:

PASO 1 — Recopila estos datos, uno por uno:
1. Nombre del padre o madre
2. Nombre del niño
3. Categoria (año de nacimiento) — Si ya la mencionaron antes, NO volver a preguntar. Si no la mencionaron, preguntar el año de nacimiento del niño para asignar la categoria correcta.
4. Dia preferido (solo lunes, martes, miercoles o jueves)
5. Numero de WhatsApp

IMPORTANTE: Si el padre ya menciono la categoria o el año de nacimiento del niño en la conversacion, NO preguntes la edad ni la categoria de nuevo. Usa la informacion que ya dieron.

PASO 2 — Cuando tengas todos los datos, muestra resumen y pide confirmacion:
"Resumen de la cita:

Padre/Madre: [nombre]
Niño: [nombre]
Categoria: CAT [año]
Dia: [dia]
WhatsApp: [numero]

Todo correcto? Responde si para confirmar."

PASO 3 — SOLO cuando el usuario responda "si" o "confirmo", responde UNICAMENTE con:
[CITA:{"padre":"NOMBRE","nino":"NOMBRE","edad":"CAT AÑO","dia":"DIA","telefono":"NUMERO"}]

REGLAS:
1. Solo en espanol
2. Sin emojis
3. NO escribas [CITA:...] hasta que el usuario confirme con "si" o "confirmo"
4. Si no tienes la informacion, ofrece el WhatsApp: 844 502 8582
5. No inventes datos
6. Si la categoria no esta disponible (2012 o anterior), no agendes la cita`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { reply: "Demasiados mensajes seguidos. Escribe al WhatsApp: 844 502 8582" },
      { status: 429 }
    );
  }

  try {
    const { message, history = [] } = await req.json();

    if (typeof message !== "string" || !message.trim() || message.length > 2000) {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }

    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM,
      messages,
    });

    let reply = (response.content[0] as { type: string; text: string }).text;

    // Detectar confirmación de cita
    const citaMatch = reply.match(/\[CITA:(\{[\s\S]*?\})\]/);
    if (citaMatch) {
      try {
        const datos = JSON.parse(citaMatch[1]);
        const evento = await createAppointment(datos);
        reply = reply.replace(/\[CITA:[\s\S]*?\]/, "").trim();

        if (evento.success) {
          await trackEvento("cita_agendada", { nino: datos.nino, dia: datos.dia, categoria: datos.edad });
          reply = `Cita agendada.\n\nNiño: ${datos.nino}\nDia: ${datos.dia}\nHorario: 5:00 pm\nLugar: Canchas del Colegio Vivir, Carretera Los Gonzalez Km 1\n\nNos vemos en la cancha.`;
        } else if (evento.reason === "full") {
          reply = `Ese dia ya no tiene lugar.\n\nElige otro dia disponible:\nLunes, Martes, Miercoles o Jueves.`;
        } else {
          reply = `Hubo un problema tecnico al agendar.\n\nEscribe al WhatsApp para confirmar tu cita:\n844 502 8582`;
        }
      } catch {
        reply = "Hubo un problema al agendar. Escribe al WhatsApp: 844 502 8582";
      }
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { reply: "Hubo un error. Escribe al WhatsApp: 844 502 8582" },
      { status: 500 }
    );
  }
}
