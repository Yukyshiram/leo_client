import type {
  AcademicCycleSummary,
  AcademicProgress,
  BoletasHistoricas,
  CompletedCourse,
  CycleSchedule,
  GradeItem,
  KardexCourse,
  KardexData,
  ScheduleItem,
} from "./types.js";

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const clean = value.trim().replace("%", "");
  if (!clean) return null;
  const match = clean.match(/^-?\d+(?:\.\d+)?/);
  const parsed = Number(match ? match[0] : clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function gradeNumber(value: unknown): number | null {
  const parsed = numberFrom(value);
  if (parsed === null) return null;
  if (parsed < 0 || parsed > 100) return null;
  return parsed;
}

function cycleSort(a: string, b: string): number {
  return a.localeCompare(b);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 100) / 100;
}

function uniqueText(values: Array<string | undefined>): string | undefined {
  const items = [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
  return items.length > 0 ? items.join(", ") : undefined;
}

function professorName(professor: NonNullable<ScheduleItem["profesores"]>[number]): string | undefined {
  const name = [professor.nombres, professor.apellidos].map((value) => value?.trim()).filter(Boolean).join(" ");
  return name || undefined;
}

function classroom(hour: NonNullable<NonNullable<ScheduleItem["horarios"]>[number]["horas"]>[number]): string | undefined {
  const building = hour.edificio ?? hour.idedificio;
  return uniqueText([building, hour.numesalon])?.replace(", ", " ");
}

export function normalizeScheduleItem(item: ScheduleItem): ScheduleItem {
  const hours = item.horarios?.flatMap((block) => block.horas ?? []) ?? [];

  return {
    ...item,
    clave: item.clave ?? item.idcurso,
    nombre: item.nombre ?? item.nombcurso,
    profesor: item.profesor ?? uniqueText(item.profesores?.map(professorName) ?? []),
    dias: item.dias ?? uniqueText(hours.map((hour) => hour.dia)),
    hora: item.hora ?? uniqueText(hours.map((hour) => hour.hora)),
    aula: item.aula ?? uniqueText(hours.map(classroom)),
  };
}

export function completedCoursesFromKardex(data: KardexData | null | undefined): CompletedCourse[] {
  const courses = data?.historiaAcademicaKardex ?? [];

  return courses.map((course) => ({
    ciclo: course.clasificacion ?? "",
    crn: course.crn,
    clave: course.clavmateria,
    nombre: course.titucurso,
    calificacion: course.calinumeletra,
    captura: course.tipocaptura,
    creditos: numberFrom(course.creditos) ?? 0,
    horas: numberFrom(course.horacurso) ?? undefined,
    fechaCaptura: course.fechcaptura,
    area: course.idarea,
    areaDescripcion: course.descarea,
    raw: course,
  }));
}

export function completedCoursesFromHistory(history: BoletasHistoricas): CompletedCourse[] {
  return history.consolidated.map(({ ciclo, boleta }) => ({
    ciclo,
    crn: boleta.crn,
    clave: boleta.idcurso,
    nombre: boleta.nombcurso,
    calificacion: boleta.caliordinario ?? boleta.caliextraordi ?? undefined,
    captura: boleta.caliordirolad ? `ORDINARIO_ROLAD:${boleta.caliordirolad}` : undefined,
    creditos: 0,
    raw: boleta,
  }));
}

export function cycleSummariesFromCourses(courses: CompletedCourse[]): AcademicCycleSummary[] {
  const grouped = new Map<string, CompletedCourse[]>();

  for (const course of courses) {
    if (!course.ciclo) continue;
    const current = grouped.get(course.ciclo) ?? [];
    current.push(course);
    grouped.set(course.ciclo, current);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => cycleSort(a, b))
    .map(([ciclo, items]) => {
      const grades = items
        .map((item) => gradeNumber(item.calificacion))
        .filter((value): value is number => value !== null);

      return {
        ciclo,
        materias: items.length,
        creditos: items.reduce((sum, item) => sum + item.creditos, 0),
        promedio: average(grades),
      };
    });
}

export function progressFromKardex(data: KardexData | null | undefined): AcademicProgress {
  const creditos = data?.creditos;
  const promedios = data?.promedios;

  return {
    creditosAdquiridos: numberFrom(creditos?.credadquirido),
    creditosFaltantes: numberFrom(creditos?.credfaltantes),
    creditosTotales: numberFrom(creditos?.credtotaprogr),
    porcentajeCreditos: numberFrom(creditos?.credporcentaj),
    promedioGeneral: numberFrom(promedios?.promgeneral),
    raw: {
      creditos,
      promedios,
    },
  };
}

export function schedulesByCycle(byCycle: Record<string, ScheduleItem[] | Error>): CycleSchedule[] {
  return Object.entries(byCycle)
    .sort(([a], [b]) => cycleSort(a, b))
    .map(([ciclo, value]) => {
      if (value instanceof Error) {
        return { ciclo, materias: [], error: value.message };
      }
      return { ciclo, materias: value.map(normalizeScheduleItem) };
    });
}

export function uniqueCyclesFromCourses(courses: Array<CompletedCourse | KardexCourse | GradeItem>): string[] {
  const cycles = new Set<string>();

  for (const course of courses) {
    const ciclo =
      "ciclo" in course && typeof course.ciclo === "string"
        ? course.ciclo
        : "clasificacion" in course && typeof course.clasificacion === "string"
          ? course.clasificacion
          : "idciclo" in course && typeof course.idciclo === "string"
            ? course.idciclo
            : "";
    if (ciclo) cycles.add(ciclo);
  }

  return [...cycles].sort(cycleSort);
}
