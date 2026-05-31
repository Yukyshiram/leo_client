import { loginWithPem } from "./auth.js";
import { LegacyClient } from "./legacy-client.js";
import { getStudentCard } from "./student-card.js";
import type { BoletasHistoricas, KardexResult, LeoEndpointCXOptions, LoginSuccess, PlanItem, StudentCardResult } from "./types.js";

export class LeoEndpointCX {
  private readonly privateKey: string;
  private readonly retries: number;
  private session: LoginSuccess | null = null;

  constructor(options: LeoEndpointCXOptions) {
    this.privateKey = options.privateKey;
    this.retries = options.retries ?? 3;
  }

  async login(user: string, password: string): Promise<LoginSuccess> {
    this.session = await loginWithPem(user, password, this.privateKey);
    return this.session;
  }

  setSession(session: LoginSuccess | null): void {
    this.session = session;
  }

  getSession(): LoginSuccess | null {
    return this.session;
  }

  private requireSession(): LoginSuccess {
    if (!this.session) {
      throw new Error("No hay sesion activa. Ejecuta login() primero o usa setSession().");
    }
    return this.session;
  }

  private client(): LegacyClient {
    const s = this.requireSession();
    return new LegacyClient(s.id_token, this.privateKey, this.retries);
  }

  async getPlans(studentCode?: string): Promise<PlanItem[]> {
    const s = this.requireSession();
    return this.client().getPlans(studentCode ?? s.usua_id);
  }

  async getSchedule(idprograma: string, ciclo: string, studentCode?: string): Promise<unknown[]> {
    const s = this.requireSession();
    return this.client().getSchedule(studentCode ?? s.usua_id, idprograma, ciclo);
  }

  async getBoletas(idprograma: string, ciclo: string, studentCode?: string): Promise<unknown[]> {
    const s = this.requireSession();
    return this.client().getBoletas(studentCode ?? s.usua_id, idprograma, ciclo);
  }

  async getHistoricalBoletas(idprograma: string, plans: PlanItem[], studentCode?: string): Promise<BoletasHistoricas> {
    const s = this.requireSession();
    return this.client().getHistoricalBoletas(studentCode ?? s.usua_id, idprograma, plans);
  }

  async getKardexAdvanced(plan: PlanItem, studentCode?: string): Promise<KardexResult> {
    const s = this.requireSession();
    return this.client().getKardexAdvanced(studentCode ?? s.usua_id, plan);
  }

  async getStudentCard(session?: LoginSuccess): Promise<StudentCardResult> {
    return getStudentCard(session ?? this.requireSession());
  }
}
