import type { LoginEnvelope, LoginSuccess } from "./types.js";
import { createIss } from "./crypto.js";
import { LEGACY_BASE, LEGACY_ORIGIN, LEGACY_REFERER } from "./constants.js";
import { LeoClientError } from "./errors.js";

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

  let payload: LoginEnvelope;
  try {
    payload = (await response.json()) as LoginEnvelope;
  } catch (error) {
    throw new LeoClientError("NON_JSON_RESPONSE", `LEO respondio con HTTP ${response.status}, pero la respuesta no fue JSON.`, {
      status: response.status,
      cause: error,
    });
  }

  if (!response.ok) {
    const message = payload.mensaje || "Error desconocido";
    const code = response.status === 401 ? "INVALID_CREDENTIALS" : "HTTP_ERROR";
    throw new LeoClientError(
      code,
      response.status === 401
        ? `No se pudo iniciar sesion en LEO. Revisa codigo, contrasena y token.pem. Detalle: ${message}`
        : `LEO respondio HTTP ${response.status}: ${message}`,
      { status: response.status },
    );
  }

  if (!payload.respuesta || Array.isArray(payload.respuesta)) {
    const apiError = Array.isArray(payload.respuesta) ? payload.respuesta[0]?.error : payload.mensaje;
    throw new LeoClientError("LEGACY_EMPTY_RESPONSE", apiError || "No se obtuvo respuesta de login");
  }

  return payload.respuesta;
}
