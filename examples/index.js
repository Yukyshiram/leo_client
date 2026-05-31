import { createLeoClient } from "@skl-connect/leo-client";
import { readFileSync } from "node:fs";

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

  const [materias, boletas, historial, kardex, tarjeta] = await Promise.all([
    leo.academic.classes(plan.idprograma, ciclo),
    leo.academic.grades(plan.idprograma, ciclo),
    leo.academic.history.grades(plan.idprograma, plans),
    leo.academic.transcript(plan),
    leo.student.profileCard(),
  ]);

  console.log("Login correcto");
  console.log("Alumno:", codigo);
  console.log("Plan:", plan.descprograma ?? plan.idprograma);
  console.log("Ciclo:", ciclo);
  console.log("Materias:", materias.length);
  console.log("Boletas:", boletas.length);
  console.log("Ciclos historicos:", Object.keys(historial.byCycle).length);
  console.log("Kardex:", kardex.data ? "encontrado" : "no disponible");
  console.log("Tarjeta:", tarjeta.ok ? "encontrada" : `no disponible (${tarjeta.reason ?? "sin detalle"})`);

  const ciclos = await leo.academic.summary.cycles(plan, plans);
  const materiasCursadas = await leo.academic.summary.completedCourses(plan, plans);
  const progreso = await leo.academic.summary.progress(plan);

  console.log("Ciclos cursados:", ciclos);
  console.log("Materias cursadas:", materiasCursadas.length);
  console.log("Progreso:", progreso);
}

main().catch((error) => {
  console.error("No se pudo consultar LEO:");
  console.error(error);
  process.exit(1);
});
