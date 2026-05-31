import type { LoginEnvelope, LoginSuccess } from "./types.js";
import { createIss } from "./crypto.js";
import { LEGACY_BASE, LEGACY_ORIGIN, LEGACY_REFERER } from "./constants.js";

async function hashPassword(password: string): Promise<string> {
  const bunRef = (globalThis as { Bun?: { password: { hashSync: (pwd: string, algo: string) => string } } }).Bun;
  if (bunRef) return bunRef.password.hashSync(password, "bcrypt");

  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 10);
}

export async function loginWithPem(user: string, password: string, privateKey: string): Promise<LoginSuccess> {
  const pwd = await hashPassword(password);
  const response = await fetch(`${LEGACY_BASE}/login/validar`, {
    method: "POST",
    headers: {
      Referer: LEGACY_REFERER,
      Origin: LEGACY_ORIGIN,
      authorization: `Bearer ${createIss(privateKey)}`,
      "authorization-key": "Bearer ",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ usr: user, pwd }),
  });

  const payload = (await response.json()) as LoginEnvelope;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${payload.mensaje || "Error desconocido"}`);
  }

  if (!payload.respuesta || Array.isArray(payload.respuesta)) {
    const apiError = Array.isArray(payload.respuesta) ? payload.respuesta[0]?.error : payload.mensaje;
    throw new Error(apiError || "No se obtuvo respuesta de login");
  }

  return payload.respuesta;
}
