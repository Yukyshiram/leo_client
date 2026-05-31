type LoginSuccess = {
    id_token: string;
    usua_id: string;
    vigencia: string;
};
type LoginEnvelope = {
    codigo: number;
    mensaje: string;
    respuesta?: LoginSuccess | {
        error: string;
    }[];
};
type ApiEnvelope<T> = {
    codigo: number;
    mensaje: string;
    respuesta?: T | {
        error: string;
    }[];
};
type PlanItem = {
    idcentro?: string;
    idsede?: string;
    idprograma?: string;
    nivel?: string;
    cicladmision?: string;
    ciclefectivo?: string;
    idestatus?: string;
    descprograma?: string;
};
type KardexAttempt = {
    name: string;
    method: "GET" | "POST";
    url: string;
    ok: boolean;
    status: number;
    statusText: string;
    message?: string;
};
type KardexResult = {
    data: unknown | null;
    attempts: KardexAttempt[];
};
type BoletasHistoricas = {
    byCycle: Record<string, unknown[]>;
    consolidated: Array<{
        ciclo: string;
        boleta: unknown;
    }>;
};
type StudentCardResult = {
    value: unknown | null;
    ok: boolean;
    reason?: string;
};
type LeoEndpointCXOptions = {
    privateKey: string;
    retries?: number;
};

declare class LeoEndpointCX {
    private readonly privateKey;
    private readonly retries;
    private session;
    constructor(options: LeoEndpointCXOptions);
    login(user: string, password: string): Promise<LoginSuccess>;
    setSession(session: LoginSuccess | null): void;
    getSession(): LoginSuccess | null;
    private requireSession;
    private client;
    getPlans(studentCode?: string): Promise<PlanItem[]>;
    getSchedule(idprograma: string, ciclo: string, studentCode?: string): Promise<unknown[]>;
    getBoletas(idprograma: string, ciclo: string, studentCode?: string): Promise<unknown[]>;
    getHistoricalBoletas(idprograma: string, plans: PlanItem[], studentCode?: string): Promise<BoletasHistoricas>;
    getKardexAdvanced(plan: PlanItem, studentCode?: string): Promise<KardexResult>;
    getStudentCard(session?: LoginSuccess): Promise<StudentCardResult>;
}

type LeoFriendlyClient = {
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
        clear: () => void;
    };
    raw: LeoEndpointCX;
};
declare function createLeoClient(options: LeoEndpointCXOptions): LeoFriendlyClient;

declare function loginWithPem(user: string, password: string, privateKey: string): Promise<LoginSuccess>;

type LegacyMethod = "GET" | "POST";
type CycleTerm = "A" | "B";
type ParsedCycle = {
    year: number;
    term: CycleTerm;
};
type KardexEndpointCandidate = {
    name: string;
    method: LegacyMethod;
    url: string;
    body?: unknown;
};
declare function parseCycle(raw: string): ParsedCycle | null;
declare function cycleVariants(ciclo: string): string[];
declare function buildHistoricalCycleCandidates(plans: PlanItem[]): string[];
declare function buildKardexEndpointCandidates(studentCode: string, plan: PlanItem): KardexEndpointCandidate[];
declare class LegacyClient {
    private readonly userToken;
    private readonly privateKey;
    private readonly retries;
    constructor(userToken: string, privateKey: string, retries?: number);
    private requestLegacy;
    fetchLegacy<T>(url: string): Promise<T>;
    getPlans(studentCode: string): Promise<PlanItem[]>;
    getSchedule(studentCode: string, idprograma: string, ciclo: string): Promise<unknown[]>;
    getBoletas(studentCode: string, idprograma: string, ciclo: string): Promise<unknown[]>;
    getHistoricalBoletas(studentCode: string, idprograma: string, plans: PlanItem[]): Promise<BoletasHistoricas>;
    getKardexAdvanced(studentCode: string, plan: PlanItem): Promise<KardexResult>;
}

declare function getStudentCard(session: LoginSuccess): Promise<StudentCardResult>;

export { type ApiEnvelope, type BoletasHistoricas, type KardexAttempt, type KardexEndpointCandidate, type KardexResult, LegacyClient, LeoEndpointCX, type LeoEndpointCXOptions, type LeoFriendlyClient, type LoginEnvelope, type LoginSuccess, type ParsedCycle, type PlanItem, type StudentCardResult, buildHistoricalCycleCandidates, buildKardexEndpointCandidates, createLeoClient, cycleVariants, getStudentCard, loginWithPem, parseCycle };
