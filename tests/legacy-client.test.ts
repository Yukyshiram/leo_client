import { describe, expect, test } from "vitest";
import {
  buildHistoricalCycleCandidates,
  buildKardexEndpointCandidates,
  cycleVariants,
  parseCycle,
} from "../src/legacy-client.js";

describe("parseCycle", () => {
  test("acepta formato YYYY-A", () => {
    expect(parseCycle("2026-A")).toEqual({ year: 2026, term: "A" });
  });

  test("acepta formato YYYYB", () => {
    expect(parseCycle("2026B")).toEqual({ year: 2026, term: "B" });
  });

  test("acepta numerico YYYY-1/2", () => {
    expect(parseCycle("2026-1")).toEqual({ year: 2026, term: "A" });
    expect(parseCycle("2026-2")).toEqual({ year: 2026, term: "B" });
  });

  test("rechaza formato invalido", () => {
    expect(parseCycle("26-A")).toBeNull();
    expect(parseCycle("2026-C")).toBeNull();
  });
});

describe("cycleVariants", () => {
  test("genera variantes unicas para A", () => {
    expect(cycleVariants("2026-A")).toEqual(["2026-A", "2026A", "2026-1", "20261"]);
  });

  test("normaliza y genera variantes para B", () => {
    expect(cycleVariants("2026b")).toEqual(["2026B", "2026-B", "2026-2", "20262"]);
  });
});

describe("buildHistoricalCycleCandidates", () => {
  test("incluye rango extendido y ordenado", () => {
    const plans = [{ cicladmision: "2024-B", ciclefectivo: "2026-A" }];
    const cycles = buildHistoricalCycleCandidates(plans);

    expect(cycles[0]).toBe("2023-B");
    expect(cycles[cycles.length - 1]).toBe("2027-A");
    expect(cycles).toContain("2024-B");
    expect(cycles).toContain("2026-A");
  });
});

describe("buildKardexEndpointCandidates", () => {
  test("genera 11 candidatos con variantes GET/POST", () => {
    const candidates = buildKardexEndpointCandidates("219769682", {
      idcentro: "D",
      idsede: "D00",
      idprograma: "INFO",
      ciclefectivo: "2026-A",
      cicladmision: "2024-B",
    });

    expect(candidates.length).toBe(11);
    expect(candidates[0]?.name).toBe("kardex_get_student");
    expect(candidates[1]?.name).toBe("kardex_get_program");
    expect(candidates[2]?.name).toBe("kardex_get_full");

    const postRootV4 = candidates.find((c) => c.name === "kardex_post_root_v4");
    expect(postRootV4?.method).toBe("POST");
    expect(postRootV4?.url.endsWith("/alumnos-esc/kardex")).toBe(true);

    const body = postRootV4?.body as { idciclo: string; idcicloadmi: string };
    expect(body.idciclo).toBe("2026A");
    expect(body.idcicloadmi).toBe("2024B");
  });
});
