import { loginWithPem } from "./auth.js";
import { LeoClientError } from "./errors.js";
import { LegacyClient } from "./legacy-client.js";
import { getStudentCard } from "./student-card.js";
import type {
  BoletasHistoricas,
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

export class LeoEndpointCX {
  private readonly privateKey: string;
  private readonly retries: number;
  private session: LoginSuccess | null = null;
  private studentCode: string | null = null;

  constructor(options: LeoEndpointCXOptions) {
    if (!options.privateKey?.trim()) {
      throw new LeoClientError("MISSING_PRIVATE_KEY", "Debes proporcionar privateKey. Lee token.pem y pasalo a createLeoClient({ privateKey }).");
    }
    this.privateKey = options.privateKey;
    this.retries = options.retries ?? 3;
  }

  async login(user: string, password: string): Promise<LoginSuccess> {
    const studentCode = String(user ?? "").trim();
    if (!studentCode) {
      throw new LeoClientError("MISSING_STUDENT_CODE", "Debes proporcionar el codigo de alumno.");
    }
    if (!String(password ?? "")) {
      throw new LeoClientError("MISSING_PASSWORD", "Debes proporcionar la contrasena de LEO.");
    }

    this.studentCode = studentCode;
    this.session = await loginWithPem(studentCode, password, this.privateKey);
    return this.session;
  }

  setSession(session: LoginSuccess | null): void {
    this.session = session;
  }

  getSession(): LoginSuccess | null {
    return this.session;
  }

  getStudentCode(): string | null {
    return this.studentCode;
  }

  setStudentCode(studentCode: string | null): void {
    this.studentCode = studentCode;
  }

  private requireSession(): LoginSuccess {
    if (!this.session) {
      throw new LeoClientError("MISSING_SESSION", "No hay sesion activa. Ejecuta login.signIn() primero o usa session.use().");
    }
    return this.session;
  }

  private client(): LegacyClient {
    const s = this.requireSession();
    return new LegacyClient(s.id_token, this.privateKey, this.retries);
  }

  async getPlans(studentCode?: string): Promise<PlanItem[]> {
    const s = this.requireSession();
    return this.client().getPlans(studentCode ?? this.studentCode ?? s.usua_id);
  }

  async getSchedule(idprograma: string, ciclo: string, studentCode?: string): Promise<ScheduleItem[]> {
    const s = this.requireSession();
    return this.client().getSchedule(studentCode ?? this.studentCode ?? s.usua_id, idprograma, ciclo);
  }

  async getBoletas(idprograma: string, ciclo: string, studentCode?: string): Promise<GradeItem[]> {
    const s = this.requireSession();
    return this.client().getBoletas(studentCode ?? this.studentCode ?? s.usua_id, idprograma, ciclo);
  }

  async getHistoricalBoletas(idprograma: string, plans: PlanItem[], studentCode?: string): Promise<BoletasHistoricas> {
    const s = this.requireSession();
    return this.client().getHistoricalBoletas(studentCode ?? this.studentCode ?? s.usua_id, idprograma, plans);
  }

  async getKardexAdvanced(plan: PlanItem, studentCode?: string): Promise<KardexResult<KardexData>> {
    const s = this.requireSession();
    return this.client().getKardexAdvanced(studentCode ?? this.studentCode ?? s.usua_id, plan);
  }

  async getStudentCard(session?: LoginSuccess): Promise<StudentCardResult<StudentCardValue>> {
    return getStudentCard(session ?? this.requireSession());
  }
}
