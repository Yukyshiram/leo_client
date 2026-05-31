export type LoginSuccess = {
  id_token: string;
  usua_id: string;
  vigencia: string;
  usuario_mov?: string;
  fecha_mov?: string;
  ip_mov?: string;
  vigencia_extra?: string;
  [key: string]: unknown;
};

export type LoginEnvelope = {
  codigo: number;
  mensaje: string;
  respuesta?: LoginSuccess | { error: string }[];
};

export type ApiEnvelope<T> = {
  codigo: number;
  mensaje: string;
  respuesta?: T | { error: string }[];
};

export type PlanItem = {
  idcentro?: string;
  siglacentro?: string;
  siiacampus?: string;
  desccentro?: string;
  idsede?: string;
  descsede?: string;
  idprograma?: string;
  descprograma?: string;
  nivel?: string;
  cicladmision?: string;
  ciclefectivo?: string;
  idestatus?: string;
  descestatus?: string;
  tipoestatus?: string;
  idPlan?: string;
  descnivel?: string;
  certificacion?: string | null;
  emailudg?: string;
  [key: string]: unknown;
};

export type ScheduleHour = {
  dia?: string;
  hora?: string;
  idedificio?: string;
  edificio?: string;
  numesalon?: string;
  [key: string]: unknown;
};

export type ScheduleBlock = {
  fechinicio?: string;
  fechfin?: string;
  horas?: ScheduleHour[];
  [key: string]: unknown;
};

export type ProfessorItem = {
  nombres?: string;
  apellidos?: string;
  idprofesor?: string;
  [key: string]: unknown;
};

export type ScheduleItem = {
  crn?: string;
  idcurso?: string;
  nombcurso?: string;
  clave?: string;
  nombre?: string;
  numeseccion?: string;
  idcampus?: string;
  creditos?: string;
  horarios?: ScheduleBlock[];
  profesores?: ProfessorItem[];
  profesor?: string;
  dias?: string;
  hora?: string;
  aula?: string;
  tiporegistro?: string;
  [key: string]: unknown;
};

export type GradeItem = {
  crn?: string;
  idcurso?: string;
  nombcurso?: string;
  caliordinario?: string | null;
  caliordiletra?: string | null;
  caliordirolad?: string | null;
  caliextraordi?: string | null;
  caliextrletra?: string | null;
  caliextrrolad?: string | null;
  idciclo?: string;
  [key: string]: unknown;
};

export type KardexAttempt = {
  name: string;
  method: "GET" | "POST";
  url: string;
  ok: boolean;
  status: number;
  statusText: string;
  message?: string;
};

export type KardexCredits = {
  credadquirido?: string;
  credporcentaj?: string;
  credfaltantes?: string;
  credtotaprogr?: string;
  [key: string]: unknown;
};

export type KardexAverages = {
  promgeneral?: string;
  [key: string]: unknown;
};

export type KardexCourse = {
  crn?: string;
  idsede?: string | null;
  clavmateria?: string;
  titucurso?: string;
  calinumeletra?: string;
  tipocaptura?: string;
  creditos?: string;
  horacurso?: string;
  fechcaptura?: string;
  clasificacion?: string;
  idtae?: string | null;
  desctae?: string | null;
  idarea?: string;
  descarea?: string;
  [key: string]: unknown;
};

export type KardexData = {
  datosPersonales?: Record<string, unknown>;
  planesEstudios?: PlanItem;
  creditos?: KardexCredits;
  promedios?: KardexAverages;
  historiaAcademicaKardex?: KardexCourse[];
  resumenCreditos?: unknown;
  curriculares?: unknown;
  informacion?: unknown;
  certificado?: unknown;
  aviso?: unknown;
  [key: string]: unknown;
};

export type KardexResult<TData = KardexData> = {
  data: TData | null;
  attempts: KardexAttempt[];
};

export type BoletasHistoricas = {
  byCycle: Record<string, GradeItem[]>;
  consolidated: Array<{ ciclo: string; boleta: GradeItem }>;
};

export type StudentCardValue = {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  curp?: string;
  imss?: string;
  centro?: string;
  centroDesc?: string;
  sede?: string;
  foto?: string;
  firma?: string;
  qr?: string;
  firmaRector?: string;
  nombreRector?: string;
  tarjeta_informador?: unknown[];
  [key: string]: unknown;
};

export type StudentCardResult<TValue = StudentCardValue> = {
  value: TValue | null;
  ok: boolean;
  reason?: string;
};

export type AcademicCycleSummary = {
  ciclo: string;
  materias: number;
  creditos: number;
  promedio: number | null;
};

export type CompletedCourse = {
  ciclo: string;
  crn?: string;
  clave?: string;
  nombre?: string;
  calificacion?: string;
  captura?: string;
  creditos: number;
  horas?: number;
  fechaCaptura?: string;
  area?: string;
  areaDescripcion?: string;
  raw: KardexCourse | GradeItem;
};

export type AcademicProgress = {
  creditosAdquiridos: number | null;
  creditosFaltantes: number | null;
  creditosTotales: number | null;
  porcentajeCreditos: number | null;
  promedioGeneral: number | null;
  raw: {
    creditos?: KardexCredits;
    promedios?: KardexAverages;
  };
};

export type CycleSchedule = {
  ciclo: string;
  materias: ScheduleItem[];
  error?: string;
};

export type AcademicFullProfile = {
  session: LoginSuccess | null;
  plan: PlanItem;
  plans: PlanItem[];
  cycles: AcademicCycleSummary[];
  completedCourses: CompletedCourse[];
  progress: AcademicProgress;
  schedules: CycleSchedule[];
  kardex: KardexResult<KardexData>;
  studentCard: StudentCardResult<StudentCardValue>;
};

export type LeoEndpointCXOptions = {
  privateKey: string;
  retries?: number;
};
