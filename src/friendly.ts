import { LeoEndpointCX } from "./sdk.js";
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
