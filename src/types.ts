export type LoginSuccess = {
  id_token: string;
  usua_id: string;
  vigencia: string;
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
  numeseccion?: string;
  idcampus?: string;
  creditos?: string;
  horarios?: ScheduleBlock[];
  profesores?: ProfessorItem[];
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

export type LeoEndpointCXOptions = {
  privateKey: string;
  retries?: number;
};
