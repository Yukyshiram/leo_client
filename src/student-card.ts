import type { LoginSuccess, StudentCardResult } from "./types.js";
import { SOYUDG_BASE } from "./constants.js";

function encodeStudentCode(studentCode: string): string {
  const value = `${studentCode}-${Math.floor(Date.now() / 1000)}`;
  const once = Buffer.from(value, "utf8").toString("base64");
  return Buffer.from(once, "utf8").toString("base64");
}

export async function getStudentCard(session: LoginSuccess): Promise<StudentCardResult> {
  const encryptedId = encodeStudentCode(session.usua_id);
  const url = `${SOYUDG_BASE}?encryptedId=${encodeURIComponent(encryptedId)}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as { data?: { error?: unknown } };

    if (!response.ok || data?.data?.error) {
      throw new Error(`HTTP ${response.status} al consultar studentCard`);
    }

    return { value: data.data ?? null, ok: true };
  } catch (error) {
    return {
      value: null,
      ok: false,
      reason: String((error as { message?: string })?.message ?? error),
    };
  }
}
