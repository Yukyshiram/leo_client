import { LeoEndpointCX } from "./sdk.js";
import { LeoClientError } from "./errors.js";
import {
  completedCoursesFromHistory,
  completedCoursesFromKardex,
  cycleSummariesFromCourses,
  progressFromKardex,
  schedulesByCycle,
  uniqueCyclesFromCourses,
} from "./summary.js";
import type {
  AcademicCycleSummary,
  AcademicCompactProfile,
  AcademicFullProfile,
  AcademicProgress,
  BoletasHistoricas,
  CompletedCourse,
  CycleSchedule,
  GradeItem,
  KardexData,
  KardexResult,
  LeoEndpointCXOptions,
  LoginSuccess,
  PlanItem,
  ScheduleItem,
  StudentCardResult,
  StudentCardValue,
} from "./types.js";

export type LeoFriendlyClient = {
  login: {
    entrance: (studentCode: string | number, password: string) => Promise<LoginSuccess>;
    signIn: (studentCode: string | number, password: string) => Promise<LoginSuccess>;
  };
  student: {
    plans: (studentCode?: string | number) => Promise<PlanItem[]>;
    card: () => Promise<StudentCardResult<StudentCardValue>>;
    profileCard: () => Promise<StudentCardResult<StudentCardValue>>;
  };
  academic: {
    schedule: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<ScheduleItem[]>;
    classes: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<ScheduleItem[]>;
    boletas: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<GradeItem[]>;
    grades: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<GradeItem[]>;
    boletasHistoricas: (idprograma: string, plans: PlanItem[], studentCode?: string | number) => Promise<BoletasHistoricas>;
    history: {
      boletas: (idprograma: string, plans: PlanItem[], studentCode?: string | number) => Promise<BoletasHistoricas>;
      grades: (idprograma: string, plans: PlanItem[], studentCode?: string | number) => Promise<BoletasHistoricas>;
    };
    kardex: (plan: PlanItem, studentCode?: string | number) => Promise<KardexResult<KardexData>>;
    transcript: (plan: PlanItem, studentCode?: string | number) => Promise<KardexResult<KardexData>>;
    summary: {
      completedCourses: (plan: PlanItem, plans?: PlanItem[], studentCode?: string | number) => Promise<CompletedCourse[]>;
      cycles: (plan: PlanItem, plans?: PlanItem[], studentCode?: string | number) => Promise<AcademicCycleSummary[]>;
      progress: (plan: PlanItem, studentCode?: string | number) => Promise<AcademicProgress>;
      schedulesByCycle: (plan: PlanItem, cycles?: string[], studentCode?: string | number) => Promise<CycleSchedule[]>;
      fullProfile: (plan?: PlanItem, plans?: PlanItem[], studentCode?: string | number) => Promise<AcademicFullProfile>;
      fullProfileCompact: (plan?: PlanItem, plans?: PlanItem[], studentCode?: string | number) => Promise<AcademicCompactProfile>;
    };
  };
  session: {
    current: () => LoginSuccess | null;
    use: (session: LoginSuccess) => void;
    useStudentCode: (studentCode: string | number) => void;
    studentCode: () => string | null;
    clear: () => void;
  };
  raw: LeoEndpointCX;
};

function normalizeStudentCode(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return String(value).trim();
}

function uniqueCycles(...cycles: Array<string | undefined>): string[] {
  return [...new Set(cycles.filter((cycle): cycle is string => Boolean(cycle)))].sort((a, b) => a.localeCompare(b));
}

function toCompactProfile(profile: AcademicFullProfile): AcademicCompactProfile {
  const studentCard = profile.studentCard.value;
  const kardexData = profile.kardex.data;
  const planData = kardexData?.planesEstudios ?? profile.plan;
  const completedCourses = profile.completedCourses.map(({ raw: _raw, ...course }) => course);
  const schedules = profile.schedules.map((cycle) => ({
    ciclo: cycle.ciclo,
    error: cycle.error,
    materias: cycle.materias.map((course) => ({
      crn: course.crn,
      clave: course.clave ?? course.idcurso,
      nombre: course.nombre ?? course.nombcurso,
      profesor: course.profesor,
      dias: course.dias,
      hora: course.hora,
      aula: course.aula,
      seccion: course.numeseccion,
      creditos: course.creditos,
    })),
  }));

  const kardexCourses = kardexData?.historiaAcademicaKardex?.length ?? 0;

  return {
    student: {
      code: profile.session?.usua_id ?? null,
      name: typeof kardexData?.datosPersonales?.nombre === "string" ? kardexData.datosPersonales.nombre : studentCard?.nombre,
      email: planData.emailudg,
      center: planData.siglacentro ?? studentCard?.centro,
      campus: planData.descsede ?? studentCard?.sede,
    },
    plan: {
      id: planData.idprograma,
      name: planData.descprograma,
      status: planData.descestatus ?? planData.idestatus,
      activeCycle: planData.ciclefectivo,
      admissionCycle: planData.cicladmision,
      level: planData.descnivel ?? planData.nivel,
    },
    stats: {
      plans: profile.plans.length,
      cycles: profile.cycles.length,
      completedCourses: completedCourses.length,
      scheduleCycles: schedules.length,
      scheduleCourses: schedules.reduce((sum, cycle) => sum + cycle.materias.length, 0),
      kardexCourses,
      creditosAdquiridos: profile.progress.creditosAdquiridos,
      creditosFaltantes: profile.progress.creditosFaltantes,
      creditosTotales: profile.progress.creditosTotales,
      porcentajeCreditos: profile.progress.porcentajeCreditos,
      promedioGeneral: profile.progress.promedioGeneral,
    },
    cycles: profile.cycles,
    completedCourses,
    progress: profile.progress,
    schedules,
    kardex: {
      found: Boolean(kardexData),
      attempts: profile.kardex.attempts,
      courses: kardexCourses,
      creditos: kardexData?.creditos,
      promedios: kardexData?.promedios,
    },
    studentCard: {
      ok: profile.studentCard.ok,
      reason: profile.studentCard.reason,
      nombre: studentCard?.nombre,
      centro: studentCard?.centro,
      centroDesc: studentCard?.centroDesc,
      sede: studentCard?.sede,
      tieneFoto: Boolean(studentCard?.foto),
      tieneFirma: Boolean(studentCard?.firma),
      tieneQr: Boolean(studentCard?.qr),
    },
  };
}

export function createLeoClient(options: LeoEndpointCXOptions): LeoFriendlyClient {
  const sdk = new LeoEndpointCX(options);

  const signIn = (studentCode: string | number, password: string) => sdk.login(String(studentCode), password);
  const getPlans = (studentCode?: string | number) => sdk.getPlans(normalizeStudentCode(studentCode));
  const getCard = () => sdk.getStudentCard();
  const getSchedule = (idprograma: string, ciclo: string, studentCode?: string | number) =>
    sdk.getSchedule(idprograma, ciclo, normalizeStudentCode(studentCode));
  const getBoletas = (idprograma: string, ciclo: string, studentCode?: string | number) =>
    sdk.getBoletas(idprograma, ciclo, normalizeStudentCode(studentCode));
  const getHistoricalBoletas = (idprograma: string, plans: PlanItem[], studentCode?: string | number) =>
    sdk.getHistoricalBoletas(idprograma, plans, normalizeStudentCode(studentCode));
  const getKardex = (plan: PlanItem, studentCode?: string | number) =>
    sdk.getKardexAdvanced(plan, normalizeStudentCode(studentCode));
  const completedCourses = async (plan: PlanItem, plans?: PlanItem[], studentCode?: string | number) => {
    const kardex = await getKardex(plan, studentCode);
    if (kardex.data?.historiaAcademicaKardex?.length) {
      return completedCoursesFromKardex(kardex.data);
    }

    if (plans && plan.idprograma) {
      const history = await getHistoricalBoletas(plan.idprograma, plans, studentCode);
      return completedCoursesFromHistory(history);
    }

    return [];
  };
  const cycleSummaries = async (plan: PlanItem, plans?: PlanItem[], studentCode?: string | number) =>
    cycleSummariesFromCourses(await completedCourses(plan, plans, studentCode));
  const progress = async (plan: PlanItem, studentCode?: string | number) => {
    const kardex = await getKardex(plan, studentCode);
    return progressFromKardex(kardex.data);
  };
  const getSchedulesByCycle = async (plan: PlanItem, cycles?: string[], studentCode?: string | number) => {
    if (!plan.idprograma) return [];
    let targetCycles = cycles;

    if (!targetCycles) {
      const courses = await completedCourses(plan, undefined, studentCode);
      targetCycles = uniqueCyclesFromCourses(courses);
    }

    const entries = await Promise.all(
      targetCycles.map(async (cycle) => {
        try {
          return [cycle, await getSchedule(plan.idprograma!, cycle, studentCode)] as const;
        } catch (error) {
          return [cycle, error instanceof Error ? error : new Error(String(error))] as const;
        }
      }),
    );

    return schedulesByCycle(Object.fromEntries(entries));
  };
  const fullProfile = async (planArg?: PlanItem, plansArg?: PlanItem[], studentCode?: string | number) => {
    const plans = plansArg ?? (await getPlans(studentCode));
    const plan = planArg ?? plans.find((item) => item.idestatus === "AC") ?? plans[0];

    if (!plan) {
      throw new LeoClientError("MISSING_PROGRAM_ID", "No se encontro ningun plan academico para construir el perfil.");
    }
    if (!plan.idprograma) {
      throw new LeoClientError("MISSING_PROGRAM_ID", "El plan academico no tiene idprograma.");
    }

    const [kardex, studentCard] = await Promise.all([getKardex(plan, studentCode), getCard()]);
    let completedCourses = completedCoursesFromKardex(kardex.data);

    if (completedCourses.length === 0) {
      const history = await getHistoricalBoletas(plan.idprograma, plans, studentCode);
      completedCourses = completedCoursesFromHistory(history);
    }

    const cycles = cycleSummariesFromCourses(completedCourses);
    const progress = progressFromKardex(kardex.data);
    const scheduleCycles = uniqueCycles(...cycles.map((item) => item.ciclo), plan.ciclefectivo);
    const schedules = await getSchedulesByCycle(plan, scheduleCycles, studentCode);

    return {
      session: sdk.getSession(),
      plan,
      plans,
      cycles,
      completedCourses,
      progress,
      schedules,
      kardex,
      studentCard,
    };
  };
  const fullProfileCompact = async (planArg?: PlanItem, plansArg?: PlanItem[], studentCode?: string | number) =>
    toCompactProfile(await fullProfile(planArg, plansArg, studentCode));

  return {
    login: {
      entrance: signIn,
      signIn,
    },
    student: {
      plans: getPlans,
      card: getCard,
      profileCard: getCard,
    },
    academic: {
      schedule: getSchedule,
      classes: getSchedule,
      boletas: getBoletas,
      grades: getBoletas,
      boletasHistoricas: getHistoricalBoletas,
      history: {
        boletas: getHistoricalBoletas,
        grades: getHistoricalBoletas,
      },
      kardex: getKardex,
      transcript: getKardex,
      summary: {
        completedCourses,
        cycles: cycleSummaries,
        progress,
        schedulesByCycle: getSchedulesByCycle,
        fullProfile,
        fullProfileCompact,
      },
    },
    session: {
      current() {
        return sdk.getSession();
      },
      use(session) {
        sdk.setSession(session);
      },
      useStudentCode(studentCode) {
        sdk.setStudentCode(String(studentCode).trim());
      },
      studentCode() {
        return sdk.getStudentCode();
      },
      clear() {
        sdk.setSession(null);
        sdk.setStudentCode(null);
      },
    },
    raw: sdk,
  };
}
