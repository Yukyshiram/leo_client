# @skl-connect/leo-client

Cliente Node.js/TypeScript para consultar datos academicos desde endpoints de LEO: login, planes, horarios, boletas, historial, kardex y tarjeta de estudiante.

Esta libreria no es oficial de UDG. Es un cliente de integracion para proyectos propios de SKL Connect.

## Keywords

`leo`, `udg`, `universidad-de-guadalajara`, `academic`, `academico`, `student`, `alumnos`, `grades`, `boletas`, `kardex`, `transcript`, `schedule`, `horarios`, `nodejs`, `typescript`, `sdk`, `api-client`

## Instalacion

```bash
npm install @skl-connect/leo-client
```

Requiere Node.js 20 o superior.

## Uso Rapido

Crea un `index.js` en la raiz de tu proyecto:

```js
const { createLeoClient } = require("@skl-connect/leo-client");
const { readFileSync } = require("node:fs");

const codigo = "";
const password = "";
const ciclo = "2026-A";
const tokenPem = "./token.pem";

async function main() {
  const privateKey = readFileSync(tokenPem, "utf8");
  const leo = createLeoClient({ privateKey });

  await leo.login.signIn(codigo, password);

  const plans = await leo.student.plans();
  const plan = plans.find((item) => item.ciclefectivo === ciclo) ?? plans.find((item) => item.idestatus === "AC") ?? plans[0];

  if (!plan?.idprograma) {
    throw new Error("No se encontro un plan academico con idprograma.");
  }

  const materias = await leo.academic.classes(plan.idprograma, ciclo);
  const boletas = await leo.academic.grades(plan.idprograma, ciclo);

  console.log("Plan:", plan.descprograma ?? plan.idprograma);
  console.log("Materias:", materias.length);
  console.log("Boletas:", boletas.length);
}

main().catch(console.error);
```

Ejecuta:

```bash
node index.js
```

Tambien puedes revisar ejemplos completos en:

```txt
examples/commonjs/index.cjs
examples/esm/index.js
examples/index.js
examples/inspect-full/index.cjs
```

Salida esperada:

```txt
Plan: INGENIERIA INFORMATICA
Materias: 7
Boletas: 7
```

## Configuracion

Necesitas:

- Credenciales del alumno.
- Una llave privada RS256 en `token.pem`.

```txt
tu-proyecto/
├── index.js
├── package.json
└── token.pem
```

No subas `.env`, `token.pem`, contrasenas, tokens ni respuestas reales a repositorios.

## Ejemplo Completo Con Console.log

```js
const { createLeoClient } = require("@skl-connect/leo-client");
const { readFileSync } = require("node:fs");

const codigo = "";
const password = "";
const ciclo = "2026-A";
const tokenPem = "./token.pem";

async function main() {
  const leo = createLeoClient({
    privateKey: readFileSync(tokenPem, "utf8"),
  });

  const session = await leo.login.signIn(codigo, password);
  const plans = await leo.student.plans();
  const plan = plans.find((item) => item.ciclefectivo === ciclo) ?? plans.find((item) => item.idestatus === "AC") ?? plans[0];

  const materias = await leo.academic.classes(plan.idprograma, ciclo);
  const boletas = await leo.academic.grades(plan.idprograma, ciclo);
  const historial = await leo.academic.history.grades(plan.idprograma, plans);
  const kardex = await leo.academic.transcript(plan);
  const tarjeta = await leo.student.profileCard();

  console.log("Sesion:", {
    alumno: session.usua_id,
    vigencia: session.vigencia,
  });

  console.log("Plan:", {
    programa: plan.idprograma,
    nombre: plan.descprograma,
    ciclo: plan.ciclefectivo,
    estatus: plan.idestatus,
  });

  console.log("Resumen:", {
    materias: materias.length,
    boletas: boletas.length,
    ciclosHistoricos: Object.keys(historial.byCycle).length,
    kardex: kardex.data ? "encontrado" : "no disponible",
    tarjeta: tarjeta.ok ? "encontrada" : "no disponible",
  });

  console.log("Primeras materias:", materias.slice(0, 3));
  console.log("Primeras boletas:", boletas.slice(0, 3));
  console.log("Kardex:", kardex);
}

main().catch((error) => {
  console.error("No se pudo consultar LEO:");
  console.error(error);
});
```

Ejemplo de salida:

```txt
Sesion: { alumno: 'A00000000', vigencia: '2026-05-30T23:59:59.000Z' }
Plan: {
  programa: 'INFO',
  nombre: 'INGENIERIA INFORMATICA',
  ciclo: '2026-A',
  estatus: 'AC'
}
Resumen: {
  materias: 7,
  boletas: 7,
  ciclosHistoricos: 12,
  kardex: 'encontrado',
  tarjeta: 'encontrada'
}
```

## ESM

Si tu proyecto usa `"type": "module"`, puedes importar con `import`.

```js
import { createLeoClient } from "@skl-connect/leo-client";
import { readFileSync } from "node:fs";

const leo = createLeoClient({
  privateKey: readFileSync("./token.pem", "utf8"),
});
```

## Inspeccionar Todas Las Salidas

Si quieres ver todo lo que responde LEO, incluyendo datos personales y base64 de tarjeta, usa el ejemplo completo:

```bash
node examples/inspect-full/index.cjs
```

Ese ejemplo imprime:

```txt
SESSION
PLANS
SELECTED PLAN
MATERIAS
BOLETAS
HISTORIAL
KARDEX
STUDENT CARD
```

Nota: `STUDENT CARD` puede imprimir strings base64 largos en `foto`, `firma` y `qr`.

## API Principal

La entrada recomendada es `createLeoClient`.

```js
const { createLeoClient } = require("@skl-connect/leo-client");

const leo = createLeoClient({
  privateKey,
  retries: 3,
});
```

Metodos principales:

```js
await leo.login.signIn(codigo, password);

await leo.student.plans();
await leo.student.profileCard();

await leo.academic.classes(idprograma, ciclo);
await leo.academic.grades(idprograma, ciclo);
await leo.academic.history.grades(idprograma, plans);
await leo.academic.transcript(plan);

await leo.academic.summary.cycles(plan, plans);
await leo.academic.summary.completedCourses(plan, plans);
await leo.academic.summary.progress(plan);
await leo.academic.summary.schedulesByCycle(plan);
```

Aliases disponibles:

```js
leo.login.entrance(codigo, password);

leo.student.card();

leo.academic.schedule(idprograma, ciclo);
leo.academic.boletas(idprograma, ciclo);
leo.academic.boletasHistoricas(idprograma, plans);
leo.academic.history.boletas(idprograma, plans);
leo.academic.kardex(plan);
```

## Resumen Academico Para Webs

Para construir una web o dashboard, la libreria incluye una capa de resumen sobre kardex/historial.

```js
const plans = await leo.student.plans();
const plan = plans.find((item) => item.idestatus === "AC") ?? plans[0];

const ciclos = await leo.academic.summary.cycles(plan, plans);
const materiasCursadas = await leo.academic.summary.completedCourses(plan, plans);
const progreso = await leo.academic.summary.progress(plan);

console.log(ciclos);
console.log(materiasCursadas);
console.log(progreso);
```

Salida ejemplo:

```js
[
  { ciclo: "2024-B", materias: 7, creditos: 42, promedio: 91.14 },
  { ciclo: "2025-A", materias: 6, creditos: 48, promedio: 92.5 },
  { ciclo: "2025-B", materias: 6, creditos: 48, promedio: 93.67 },
  { ciclo: "2026-A", materias: 9, creditos: 70, promedio: 87.44 }
]
```

`completedCourses()` usa kardex como fuente principal porque trae `clasificacion`, `creditos`, `idarea` y `descarea`. Si no hay kardex y pasas `plans`, usa boletas historicas como fallback.

```js
{
  ciclo: "2024-B",
  crn: "201957",
  clave: "V0709",
  nombre: "INDUCCION A LA INGENIERIA",
  calificacion: "100 (CIEN)",
  captura: "ORDINARIO (OE)",
  creditos: 5,
  horas: 80,
  fechaCaptura: "02/DIC/2024",
  area: "BC",
  areaDescripcion: "BASICO COMUN",
  raw: {}
}
```

`progress()` resume creditos y promedio general:

```js
{
  creditosAdquiridos: 192,
  creditosFaltantes: 183,
  creditosTotales: 375,
  porcentajeCreditos: 51.2,
  promedioGeneral: 94.4,
  raw: {}
}
```

## Horarios De Ciclos Pasados

Tambien puedes intentar consultar horarios de ciclos anteriores. LEO los devuelve cuando aun los conserva para el plan/ciclo solicitado.

```js
const horarios = await leo.academic.summary.schedulesByCycle(plan);
console.log(horarios);
```

O limitarlo a ciclos especificos:

```js
const horarios = await leo.academic.summary.schedulesByCycle(plan, ["2024-B", "2025-A", "2026-A"]);
```

Salida:

```js
[
  {
    ciclo: "2024-B",
    materias: [
      {
        crn: "201957",
        idcurso: "V0709",
        nombcurso: "INDUCCION A LA INGENIERIA",
        horarios: []
      }
    ]
  },
  {
    ciclo: "2023-A",
    materias: [],
    error: "No se pudo obtener horario en ninguna variante de ciclo"
  }
]
```

Nota: para materias cursadas, kardex suele ser mas confiable. Para horarios historicos, el endpoint legacy puede regresar datos para algunos ciclos y vacio/error para otros.

## Respuestas

Las respuestas vienen de endpoints legacy y algunos campos pueden variar. Por eso la libreria conserva datos crudos cuando no hay un contrato estable.

### Login

```js
const session = await leo.login.signIn(codigo, password);
console.log(session);
```

```json
{
  "id_token": "eyJhbGciOi...",
  "usua_id": "A00000000",
  "vigencia": "2026-05-30T23:59:59.000Z",
  "usuario_mov": "A00000000",
  "fecha_mov": "2026-05-30T23:29:59.000Z",
  "ip_mov": "10.0.0.1",
  "vigencia_extra": "2026-05-31T00:14:59.000Z"
}
```

### Planes

```js
const plans = await leo.student.plans();
console.log(plans[0]);
```

```json
{
  "idcentro": "D",
  "idsede": "D00",
  "idprograma": "INFO",
  "nivel": "LIC",
  "cicladmision": "2024-B",
  "ciclefectivo": "2026-A",
  "idestatus": "AC",
  "descprograma": "INGENIERIA INFORMATICA"
}
```

### Horarios

```js
const materias = await leo.academic.classes(plan.idprograma, ciclo);
console.log(materias.slice(0, 2));
```

```json
[
  {
    "nrc": "123456",
    "materia": "PROGRAMACION",
    "profesor": "NOMBRE PROFESOR",
    "horario": "LUNES 07:00-09:00",
    "aula": "D-101"
  }
]
```

Los nombres exactos de campos pueden variar segun la respuesta de LEO.

### Boletas

```js
const boletas = await leo.academic.grades(plan.idprograma, ciclo);
console.log(boletas.slice(0, 2));
```

```json
[
  {
    "materia": "PROGRAMACION",
    "calificacion": "95",
    "estatus": "APROBADA"
  }
]
```

### Historial

```js
const historial = await leo.academic.history.grades(plan.idprograma, plans);

console.log(Object.keys(historial.byCycle));
console.log(historial.consolidated.slice(0, 2));
```

```json
{
  "byCycle": {
    "2024-B": [],
    "2025-A": [
      {
        "materia": "PROGRAMACION",
        "calificacion": "95"
      }
    ]
  },
  "consolidated": [
    {
      "ciclo": "2025-A",
      "boleta": {
        "materia": "PROGRAMACION",
        "calificacion": "95"
      }
    }
  ]
}
```

### Kardex

El kardex tiene una forma distinta a boletas/horarios porque el cliente prueba varios endpoints legacy. Siempre regresa:

```ts
type KardexResult = {
  data: unknown | null;
  attempts: KardexAttempt[];
};
```

Caso encontrado:

```js
const kardex = await leo.academic.transcript(plan);

if (kardex.data) {
  console.log("Kardex encontrado");
  console.log(kardex.data);
} else {
  console.log("Kardex no disponible");
  console.table(kardex.attempts.map(({ name, method, status, ok }) => ({ name, method, status, ok })));
}
```

```json
{
  "data": {
    "promedio": "92.4",
    "creditos": "180",
    "materias": [
      {
        "materia": "PROGRAMACION",
        "calificacion": "95",
        "ciclo": "2025-A"
      }
    ]
  },
  "attempts": [
    {
      "name": "kardex_get_student",
      "method": "GET",
      "url": "https://leoalumnos-svc.udg.mx/alumnos-esc/A00000000/kardex",
      "ok": true,
      "status": 200,
      "statusText": "OK"
    }
  ]
}
```

Caso no disponible:

```json
{
  "data": null,
  "attempts": [
    {
      "name": "kardex_get_student",
      "method": "GET",
      "url": "https://leoalumnos-svc.udg.mx/alumnos-esc/A00000000/kardex",
      "ok": false,
      "status": 404,
      "statusText": "Not Found",
      "message": "Respuesta legacy sin datos"
    },
    {
      "name": "kardex_post_root_v1",
      "method": "POST",
      "url": "https://leoalumnos-svc.udg.mx/alumnos-esc/kardex",
      "ok": false,
      "status": 400,
      "statusText": "Bad Request",
      "message": "Error desconocido"
    }
  ]
}
```

### Tarjeta De Estudiante

```js
const tarjeta = await leo.student.profileCard();
console.log(tarjeta);
```

```json
{
  "ok": true,
  "value": {
    "nombre": "NOMBRE",
    "apellido_paterno": "APELLIDO",
    "apellido_materno": "APELLIDO",
    "emailudg": "alumno@alumnos.udg.mx",
    "foto": "data:image/jpeg;base64,..."
  }
}
```

Si no esta disponible:

```json
{
  "ok": false,
  "value": null,
  "reason": "HTTP 404"
}
```

## Sesion

Puedes reutilizar una sesion si tu aplicacion la guarda temporalmente.

```js
const session = await leo.login.signIn(codigo, password);

leo.session.current();
leo.session.clear();
leo.session.use(session);
```

## TypeScript

```ts
import {
  createLeoClient,
  type AcademicCycleSummary,
  type AcademicProgress,
  type CompletedCourse,
  type CycleSchedule,
  type GradeItem,
  type KardexData,
  type KardexResult,
  type PlanItem,
  type ScheduleItem,
  type StudentCardValue,
} from "@skl-connect/leo-client";

const leo = createLeoClient({ privateKey });
const plans: PlanItem[] = await leo.student.plans();
const materias: ScheduleItem[] = await leo.academic.classes(plans[0].idprograma!, plans[0].ciclefectivo!);
const boletas: GradeItem[] = await leo.academic.grades(plans[0].idprograma!, plans[0].ciclefectivo!);
const kardex: KardexResult<KardexData> = await leo.academic.transcript(plans[0]);
const tarjeta = await leo.student.profileCard();
const studentCard: StudentCardValue | null = tarjeta.value;
const ciclos: AcademicCycleSummary[] = await leo.academic.summary.cycles(plans[0], plans);
const materiasCursadas: CompletedCourse[] = await leo.academic.summary.completedCourses(plans[0], plans);
const progreso: AcademicProgress = await leo.academic.summary.progress(plans[0]);
const horarios: CycleSchedule[] = await leo.academic.summary.schedulesByCycle(plans[0]);
```

Tipos principales:

```ts
type LoginSuccess = {
  id_token: string;
  usua_id: string;
  vigencia: string;
  usuario_mov?: string;
  fecha_mov?: string;
  ip_mov?: string;
  vigencia_extra?: string;
};

type PlanItem = {
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
};

type ScheduleItem = {
  crn?: string;
  idcurso?: string;
  nombcurso?: string;
  numeseccion?: string;
  idcampus?: string;
  creditos?: string;
  horarios?: ScheduleBlock[];
  profesores?: ProfessorItem[];
  tiporegistro?: string;
};

type GradeItem = {
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
};

type BoletasHistoricas = {
  byCycle: Record<string, GradeItem[]>;
  consolidated: Array<{ ciclo: string; boleta: GradeItem }>;
};

type KardexResult = {
  data: KardexData | null;
  attempts: KardexAttempt[];
};

type StudentCardResult = {
  value: StudentCardValue | null;
  ok: boolean;
  reason?: string;
};
```

## API Avanzada

Tambien puedes usar la clase `LeoEndpointCX` directamente.

```js
const { LeoEndpointCX } = require("@skl-connect/leo-client");

const sdk = new LeoEndpointCX({ privateKey });

await sdk.login(codigo, password);
const plans = await sdk.getPlans();
```

## Helpers

```js
const {
  buildHistoricalCycleCandidates,
  buildKardexEndpointCandidates,
  cycleVariants,
  parseCycle,
} = require("@skl-connect/leo-client");
```

Sirven para debugging, pruebas y normalizacion de ciclos.

## Desarrollo

```bash
npm run typecheck
npm run test
npm run build
```

El build genera:

```txt
dist/index.js
dist/index.cjs
dist/index.d.ts
dist/index.d.cts
```

## Seguridad

- No persistas contrasenas de LEO.
- No registres `id_token`, `authorization-key`, `.env`, `token.pem` ni respuestas reales en logs publicos.
- Trata horarios, boletas, kardex y tarjeta como datos personales.
- Si usas esta libreria detras de una API publica, agrega rate limiting, expiracion de sesiones, sanitizacion de logs y auditoria.
