import { createIss, getSessionToken } from "./crypto.js";
import { LEGACY_BASE, LEGACY_ORIGIN, LEGACY_REFERER } from "./constants.js";
import type { ApiEnvelope, BoletasHistoricas, GradeItem, KardexData, KardexResult, PlanItem, ScheduleItem } from "./types.js";

type LegacyMethod = "GET" | "POST";
type CycleTerm = "A" | "B";

export type ParsedCycle = {
  year: number;
  term: CycleTerm;
};

export type KardexEndpointCandidate = {
  name: string;
  method: LegacyMethod;
  url: string;
  body?: unknown;
};

type LegacyResponse<T> = {
  ok: boolean;
  status: number;
  statusText: string;
  raw: string;
  json: ApiEnvelope<T> | null;
};

export function parseCycle(raw: string): ParsedCycle | null {
  const clean = raw.trim().toUpperCase();
  const match = clean.match(/^(\d{4})[- ]?([AB12])$/);
  if (!match) return null;

  const year = Number(match[1]);
  const termRaw = match[2];
  const term: CycleTerm = termRaw === "B" || termRaw === "2" ? "B" : "A";
  if (Number.isNaN(year)) return null;
  return { year, term };
}

function cycleToIndex(cycle: ParsedCycle): number {
  return cycle.year * 2 + (cycle.term === "A" ? 0 : 1);
}

function indexToCycle(index: number): ParsedCycle {
  const year = Math.floor(index / 2);
  const term: CycleTerm = index % 2 === 0 ? "A" : "B";
  return { year, term };
}

export function cycleVariants(ciclo: string): string[] {
  const base = ciclo.trim().toUpperCase();
  const parsed = parseCycle(base);
  const variants = [base];

  if (parsed) {
    const termNum = parsed.term === "A" ? "1" : "2";
    variants.push(`${parsed.year}-${parsed.term}`);
    variants.push(`${parsed.year}${parsed.term}`);
    variants.push(`${parsed.year}-${termNum}`);
    variants.push(`${parsed.year}${termNum}`);
  }

  return [...new Set(variants.filter(Boolean))];
}

export function buildHistoricalCycleCandidates(plans: PlanItem[]): string[] {
  const fromPlans = plans.flatMap((p) => [String(p.cicladmision ?? ""), String(p.ciclefectivo ?? "")]).filter(Boolean);
  const parsed = fromPlans.map(parseCycle).filter((v): v is ParsedCycle => v !== null);

  const ranged: string[] = [];
  if (parsed.length > 0) {
    const indexes = parsed.map(cycleToIndex);
    const min = Math.min(...indexes) - 2;
    const max = Math.max(...indexes) + 2;

    for (let i = min; i <= max; i++) {
      const c = indexToCycle(i);
      ranged.push(`${c.year}-${c.term}`);
    }
  }

  const all = [...new Set([...fromPlans, ...ranged])];
  return all.sort((a, b) => {
    const pa = parseCycle(a);
    const pb = parseCycle(b);
    if (!pa && !pb) return a.localeCompare(b);
    if (!pa) return 1;
    if (!pb) return -1;
    return cycleToIndex(pa) - cycleToIndex(pb);
  });
}

export function buildKardexEndpointCandidates(studentCode: string, plan: PlanItem): KardexEndpointCandidate[] {
  const base = `${LEGACY_BASE}/alumnos-esc`;
  const idcentro = String(plan.idcentro ?? "");
  const idsede = String(plan.idsede ?? "");
  const idprograma = String(plan.idprograma ?? "");
  const idciclo = String(plan.ciclefectivo ?? "");
  const idcicloadmi = String(plan.cicladmision ?? "");

  const bodyVariants = [
    { idalumno: studentCode, idcentro, idciclo, idcicloadmi, idprograma, idsede },
    { idalumno: studentCode, idcentro, idciclo: idciclo.replace("-", ""), idcicloadmi, idprograma, idsede },
    { idalumno: studentCode, idcentro, idciclo, idcicloadmi: idcicloadmi.replace("-", ""), idprograma, idsede },
    { idalumno: studentCode, idcentro, idciclo: idciclo.replace("-", ""), idcicloadmi: idcicloadmi.replace("-", ""), idprograma, idsede },
  ];

  return [
    { name: "kardex_get_student", method: "GET", url: `${base}/${studentCode}/kardex` },
    { name: "kardex_get_program", method: "GET", url: `${base}/${studentCode}/${idprograma}/${idciclo}/kardex` },
    { name: "kardex_get_full", method: "GET", url: `${base}/${studentCode}/${idprograma}/${idciclo}/${idcicloadmi}/kardex` },
    ...bodyVariants.map((b, i) => ({
      name: `kardex_post_root_v${i + 1}`,
      method: "POST" as const,
      url: `${base}/kardex`,
      body: b,
    })),
    ...bodyVariants.map((b, i) => ({
      name: `kardex_post_student_v${i + 1}`,
      method: "POST" as const,
      url: `${base}/${studentCode}/kardex`,
      body: b,
    })),
  ];
}

export class LegacyClient {
  constructor(
    private readonly userToken: string,
    private readonly privateKey: string,
    private readonly retries: number = 3,
  ) {}

  private async requestLegacy<T>(url: string, method: LegacyMethod, body?: unknown): Promise<LegacyResponse<T>> {
    const sessionToken = getSessionToken(this.userToken);

    const response = await fetch(url, {
      method,
      headers: {
        Referer: LEGACY_REFERER,
        Origin: LEGACY_ORIGIN,
        authorization: `Bearer ${createIss(this.privateKey)}`,
        "authorization-key": `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const raw = await response.text();
    let json: ApiEnvelope<T> | null = null;

    try {
      json = JSON.parse(raw) as ApiEnvelope<T>;
    } catch {
      json = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      raw,
      json,
    };
  }

  async fetchLegacy<T>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      const res = await this.requestLegacy<T>(url, "GET");

      if (!res.json) {
        if (res.status >= 500 && attempt < this.retries) {
          await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
          continue;
        }
        throw new Error(`HTTP ${res.status} GET ${url}: respuesta no JSON (${res.raw.slice(0, 200)})`);
      }

      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}: ${res.json.mensaje || "Error desconocido"}`);
        if (res.status >= 500 && attempt < this.retries) {
          lastError = err;
          await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
          continue;
        }
        throw err;
      }

      if (res.json.respuesta === undefined) {
        throw new Error(`Respuesta legacy sin datos: ${JSON.stringify(res.json).slice(0, 250)}`);
      }

      if (Array.isArray(res.json.respuesta)) {
        const first = res.json.respuesta[0] as { error?: string } | undefined;
        if (first?.error) throw new Error(first.error);
      }

      return res.json.respuesta as T;
    }

    throw lastError ?? new Error("No se pudo consultar endpoint legacy");
  }

  async getPlans(studentCode: string): Promise<PlanItem[]> {
    return this.fetchLegacy<PlanItem[]>(`${LEGACY_BASE}/alumnos-esc/${studentCode}/planes-estudios`);
  }

  async getSchedule(studentCode: string, idprograma: string, ciclo: string): Promise<ScheduleItem[]> {
    const base = `${LEGACY_BASE}/alumnos-esc`;
    const variants = cycleVariants(ciclo);
    let lastError: Error | null = null;

    for (const variant of variants) {
      try {
        return await this.fetchLegacy<ScheduleItem[]>(`${base}/${studentCode}/${idprograma}/${variant}/horarios`);
      } catch (error) {
        lastError = error as Error;
      }
    }

    throw lastError ?? new Error("No se pudo obtener horario en ninguna variante de ciclo");
  }

  async getBoletas(studentCode: string, idprograma: string, ciclo: string): Promise<GradeItem[]> {
    const base = `${LEGACY_BASE}/alumnos-esc`;
    const variants = cycleVariants(ciclo);
    let lastError: Error | null = null;

    for (const variant of variants) {
      try {
        return await this.fetchLegacy<GradeItem[]>(`${base}/${studentCode}/${idprograma}/${variant}/boletas`);
      } catch (error) {
        lastError = error as Error;
      }
    }

    throw lastError ?? new Error("No se pudieron obtener boletas en ninguna variante de ciclo");
  }

  async getHistoricalBoletas(studentCode: string, idprograma: string, plans: PlanItem[]): Promise<BoletasHistoricas> {
    const cycles = buildHistoricalCycleCandidates(plans);
    const byCycle: Record<string, GradeItem[]> = {};

    for (const cycle of cycles) {
      try {
        byCycle[cycle] = await this.getBoletas(studentCode, idprograma, cycle);
      } catch {
        byCycle[cycle] = [];
      }
    }

    const consolidated = Object.entries(byCycle).flatMap(([ciclo, boletas]) =>
      boletas.map((boleta) => ({ ciclo, boleta })),
    );

    return { byCycle, consolidated };
  }

  async getKardexAdvanced(studentCode: string, plan: PlanItem): Promise<KardexResult<KardexData>> {
    const attempts: KardexResult["attempts"] = [];
    const endpoints = buildKardexEndpointCandidates(studentCode, plan);

    for (const endpoint of endpoints) {
      try {
        const res = await this.requestLegacy<unknown>(endpoint.url, endpoint.method, endpoint.body);
        const message = res.json?.mensaje || (!res.json ? "respuesta no JSON" : undefined);

        attempts.push({
          name: endpoint.name,
          method: endpoint.method,
          url: endpoint.url,
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          message,
        });

        if (res.ok && res.json?.respuesta !== undefined) {
          const r = res.json.respuesta;
          const hasContent = Array.isArray(r) ? r.length > 0 : r !== null && r !== "";
          if (hasContent) {
            return { data: r as KardexData, attempts };
          }
        }
      } catch (error) {
        attempts.push({
          name: endpoint.name,
          method: endpoint.method,
          url: endpoint.url,
          ok: false,
          status: 0,
          statusText: "NETWORK_ERROR",
          message: String((error as { message?: string })?.message ?? error),
        });
      }
    }

    return { data: null, attempts };
  }
}
