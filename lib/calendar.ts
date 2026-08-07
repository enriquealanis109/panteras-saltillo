import { google } from "googleapis";

interface CitaData {
  padre: string;
  nino: string;
  edad: string;
  dia: string;
  telefono: string;
}

type AppointmentResult =
  | { success: true }
  | { success: false; reason: "full" | "error" | "no_config" };

function nextWeekday(dayName: string): Date {
  const map: Record<string, number> = {
    lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4,
  };
  const target = map[dayName.toLowerCase().trim()] ?? 1;
  const now  = new Date();
  const diff = (target - now.getDay() + 7) % 7 || 7;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  date.setHours(17, 0, 0, 0);
  return date;
}

export async function createAppointment(datos: CitaData): Promise<AppointmentResult> {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  // Manejo robusto de la clave privada — funciona con \n literal o saltos reales
  let privateKey = process.env.GOOGLE_PRIVATE_KEY ?? "";
  if (!privateKey.includes("\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!email || !privateKey || !calendarId) {
    console.error("Google Calendar: faltan credenciales", { email: !!email, key: !!privateKey, cal: !!calendarId });
    return { success: false, reason: "no_config" };
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const start = nextWeekday(datos.dia);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);

    // Verificar límite de 2 citas por día
    const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(start); dayEnd.setHours(23, 59, 59, 999);

    const existing = await calendar.events.list({
      calendarId,
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: true,
    });

    const count = existing.data.items?.length ?? 0;
    if (count >= 2) return { success: false, reason: "full" };

    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Clase prueba - ${datos.nino} (${datos.edad} años)`,
        description: `Padre/Madre: ${datos.padre}\nWhatsApp: ${datos.telefono}`,
        location: "Canchas del Colegio Vivir, Carretera Los González Km 1, Saltillo",
        start: { dateTime: start.toISOString(), timeZone: "America/Monterrey" },
        end:   { dateTime: end.toISOString(),   timeZone: "America/Monterrey" },
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Google Calendar error:", JSON.stringify(err));
    return { success: false, reason: "error" };
  }
}
