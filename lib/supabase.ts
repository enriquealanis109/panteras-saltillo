import { createClient } from "@supabase/supabase-js";

export type Estado      = "presente" | "tarde" | "permiso" | "ausente";
export type Rol         = "entrenador" | "coordinador" | "ambos" | "admin";
export type TipoDoc     = "acta" | "curp" | "constancia" | "pasaporte" | "foto";
export type TipoCobro   = "torneo" | "copa" | "actividad" | "otro";
export type EstatusPago = "completo" | "pendiente" | "na";
export type EstadoPedido = "pendiente_pago" | "pagado" | "listo" | "entregado" | "cancelado";

export interface Categoria      { id: string; nombre: string }
export interface Jugador        { id: string; nombre: string; alias?: string; fecha_nacimiento: string; categoria_id: string; activo: boolean; foto_url?: string | null }
export interface Asistencia     { id: string; jugador_id: string; entrenador_id: string; fecha: string; estado: Estado; nota?: string }
export interface Entrenador     { id: string; nombre: string; rol: Rol }
export interface Documento      { id: string; jugador_id: string; tipo: TipoDoc; url: string; nombre_archivo?: string; created_at: string }
export interface ConceptoCobro  { id: string; nombre: string; tipo: TipoCobro; categoria_id: string; monto?: number | null; activo: boolean; created_by?: string; created_at: string }
export interface PagoJugador    { id: string; jugador_id: string; concepto_id: string; estatus: EstatusPago; monto_pagado: number; nota?: string; updated_at: string; updated_by?: string }
export interface CategoriaTienda { id: string; nombre: string; orden: number }
export interface Producto       { id: string; nombre: string; descripcion?: string | null; precio: number; imagen_url?: string | null; activo: boolean; orden: number; created_at: string; categoria_id?: string | null; personalizable: boolean }
export interface ProductoVariante { id: string; producto_id: string; talla: string; color?: string | null; stock: number }
export interface Pedido         { id: string; cliente_nombre: string; cliente_telefono: string; notas?: string | null; estado: EstadoPedido; total: number; created_at: string }
export interface PedidoItem     { id: string; pedido_id: string; variante_id?: string | null; producto_nombre: string; talla: string; color?: string | null; cantidad: number; precio_unitario: number; personalizacion_nombre?: string | null; personalizacion_numero?: string | null }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

/** Bearer header for the current session, for calling protected API routes. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}
