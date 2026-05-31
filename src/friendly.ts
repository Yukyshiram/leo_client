import { LeoEndpointCX } from "./sdk.js";
import type {
  BoletasHistoricas,
  KardexResult,
  LeoEndpointCXOptions,
  LoginSuccess,
  PlanItem,
  StudentCardResult,
} from "./types.js";

export type LeoFriendlyClient = {
  login: {
    entrance: (studentCode: string | number, password: string) => Promise<LoginSuccess>;
    signIn: (studentCode: string | number, password: string) => Promise<LoginSuccess>;
  };
  student: {
    plans: (studentCode?: string | number) => Promise<PlanItem[]>;
    card: () => Promise<StudentCardResult>;
    profileCard: () => Promise<StudentCardResult>;
  };
  academic: {
    schedule: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<unknown[]>;
    classes: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<unknown[]>;
    boletas: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<unknown[]>;
    grades: (idprograma: string, ciclo: string, studentCode?: string | number) => Promise<unknown[]>;
    boletasHistoricas: (idprograma: string, plans: PlanItem[], studentCode?: string | number) => Promise<BoletasHistoricas>;
    history: {
      boletas: (idprograma: string, plans: PlanItem[], studentCode?: string | number) => Promise<BoletasHistoricas>;
      grades: (idprograma: string, plans: PlanItem[], studentCode?: string | number) => Promise<BoletasHistoricas>;
    };
    kardex: (plan: PlanItem, studentCode?: string | number) => Promise<KardexResult>;
    transcript: (plan: PlanItem, studentCode?: string | number) => Promise<KardexResult>;
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
