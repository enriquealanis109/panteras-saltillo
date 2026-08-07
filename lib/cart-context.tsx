"use client";
import { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  lineId: string;
  varianteId: string;
  productoId: string;
  productoNombre: string;
  imagenUrl: string | null;
  talla: string;
  color: string | null;
  precioUnitario: number;
  cantidad: number;
  personalizable: boolean;
  personalizacionNombre?: string;
  personalizacionNumero?: string;
}

type NuevoItem = Omit<CartItem, "lineId" | "cantidad">;

interface CartContextValue {
  items: CartItem[];
  addItem: (item: NuevoItem, cantidad: number) => void;
  updateQty: (lineId: string, cantidad: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  totalItems: number;
  totalPrecio: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "panteras_cart";

function generarId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage no disponible o dato corrupto
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addItem: CartContextValue["addItem"] = (item, cantidad) => {
    // Los productos personalizables siempre crean una línea nueva e independiente
    // (cada unidad lleva su propio nombre/número, no se pueden fusionar).
    if (item.personalizable) {
      setItems((prev) => [...prev, { ...item, lineId: generarId(), cantidad: 1 }]);
      return;
    }
    setItems((prev) => {
      const existente = prev.find((i) => i.varianteId === item.varianteId && !i.personalizable);
      if (existente) {
        return prev.map((i) =>
          i.lineId === existente.lineId ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { ...item, lineId: generarId(), cantidad }];
    });
  };

  const updateQty = (lineId: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.lineId !== lineId)
        : prev.map((i) => (i.lineId === lineId ? { ...i, cantidad } : i))
    );
  };

  const removeItem = (lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  };

  const clear = () => setItems([]);

  const totalItems  = items.reduce((sum, i) => sum + i.cantidad, 0);
  const totalPrecio = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, totalItems, totalPrecio }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
