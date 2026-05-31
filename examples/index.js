import { createLeoClientFromPemFile, isLeoClientError } from "@skl-connect/leo-client";

const codigo = "";
const password = "";
const ciclo = "2026-A";
const tokenPem = "./token.pem";

async function main() {
  const leo = createLeoClientFromPemFile(tokenPem);

  await leo.login.signIn(codigo, password);

  const plans = await leo.student.plans();
  const plan = plans.find((item) => item.ciclefectivo === ciclo) ?? plans.find((item) => item.idestatus === "AC") ?? plans[0];

  if (!plan?.idprograma) {
    throw new Error("No se encontro un plan academico con idprograma.");
  }

  const profile = await leo.academic.summary.fullProfileCompact(plan, plans);

  console.log("Login correcto");
  console.log("Alumno:", codigo);
  console.log("Plan:", profile.plan.name ?? profile.plan.id);
  console.log("Ciclo activo:", profile.plan.activeCycle ?? ciclo);
  console.log("Resumen:", profile.stats);

  console.log("\nCiclos:");
  console.table(profile.cycles);

  console.log("\nMaterias cursadas:");
  console.table(profile.completedCourses);

  console.log("\nHorarios:");
  for (const schedule of profile.schedules) {
    console.log(`\n${schedule.ciclo}`);
    console.table(schedule.materias);
  }

  console.log("\nKardex:", profile.kardex);
  console.log("Credencial:", profile.studentCard);
}

main().catch((error) => {
  if (isLeoClientError(error)) {
    console.error("No se pudo consultar LEO:", error.code);
    console.error(error.message);
    process.exit(1);
  }

  console.error("No se pudo consultar LEO:");
  console.error(error);
  process.exit(1);
});
