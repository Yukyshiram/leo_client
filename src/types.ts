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
  idsede?: string;
  idprograma?: string;
  nivel?: string;
  cicladmision?: string;
  ciclefectivo?: string;
  idestatus?: string;
  descprograma?: string;
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

export type KardexResult = {
  data: unknown | null;
  attempts: KardexAttempt[];
};

export type BoletasHistoricas = {
  byCycle: Record<string, unknown[]>;
  consolidated: Array<{ ciclo: string; boleta: unknown }>;
};

export type StudentCardResult = {
  value: unknown | null;
  ok: boolean;
  reason?: string;
};

export type LeoEndpointCXOptions = {
  privateKey: string;
  retries?: number;
};
