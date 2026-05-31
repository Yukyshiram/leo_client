import { describe, expect, test } from "vitest";
import { completedCoursesFromKardex, cycleSummariesFromCourses, progressFromKardex } from "../src/summary.js";
import type { KardexData } from "../src/types.js";

describe("academic summary helpers", () => {
  const kardex: KardexData = {
    creditos: {
      credadquirido: "192",
      credfaltantes: "183",
      credtotaprogr: "375",
      credporcentaj: "51.2",
    },
    promedios: {
      promgeneral: "94.4",
    },
    historiaAcademicaKardex: [
      {
        crn: "201957",
        clavmateria: "V0709",
        titucurso: "INDUCCION A LA INGENIERIA",
        calinumeletra: "100 (CIEN)",
        tipocaptura: "ORDINARIO (OE)",
        creditos: "5",
        horacurso: "80",
        fechcaptura: "02/DIC/2024",
        clasificacion: "2024-B",
        idarea: "BC",
        descarea: "BASICO COMUN",
      },
      {
        crn: "189644",
        clavmateria: "I5247",
        titucurso: "LOGICA MATEMATICA",
        calinumeletra: "69 (SESENTA Y NUEVE)",
        tipocaptura: "ORDINARIO (OE)",
        creditos: "8",
        horacurso: "80",
        fechcaptura: "02/DIC/2024",
        clasificacion: "2024-B",
        idarea: "BC",
        descarea: "BASICO COMUN",
      },
      {
        crn: "213480",
        clavmateria: "V2455",
        titucurso: "ANALISIS DE PROBLEMAS GLOBALES DEL SIGLO XXI",
        calinumeletra: "AC (ACREDITADO)",
        tipocaptura: "ACREDITADO (AC)",
        creditos: "0",
        horacurso: "80",
        fechcaptura: "02/DIC/2024",
        clasificacion: "2025-A",
        idarea: "BPO",
        descarea: "BASICO PARTICULAR OBLIGATORIA",
      },
    ],
  };

  test("normaliza materias cursadas desde kardex", () => {
    const courses = completedCoursesFromKardex(kardex);

    expect(courses).toHaveLength(3);
    expect(courses[0]).toMatchObject({
      ciclo: "2024-B",
      clave: "V0709",
      nombre: "INDUCCION A LA INGENIERIA",
      creditos: 5,
      area: "BC",
    });
  });

  test("calcula resumen por ciclo", () => {
    const cycles = cycleSummariesFromCourses(completedCoursesFromKardex(kardex));

    expect(cycles).toEqual([
      { ciclo: "2024-B", materias: 2, creditos: 13, promedio: 84.5 },
      { ciclo: "2025-A", materias: 1, creditos: 0, promedio: null },
    ]);
  });

  test("normaliza progreso de creditos", () => {
    expect(progressFromKardex(kardex)).toMatchObject({
      creditosAdquiridos: 192,
      creditosFaltantes: 183,
      creditosTotales: 375,
      porcentajeCreditos: 51.2,
      promedioGeneral: 94.4,
    });
  });
});
