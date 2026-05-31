const { createLeoClientFromPemFile, isLeoClientError } = require("@skl-connect/leo-client");

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

  console.log("Plan:", profile.plan.name ?? profile.plan.id);
  console.log("Ciclo activo:", profile.plan.activeCycle ?? ciclo);
  console.log("Resumen:", profile.stats);
  console.table(profile.cycles);
}

main().catch((error) => {
  if (isLeoClientError(error)) {
    console.error("Error LEO:", error.code);
    console.error(error.message);
    return;
  }

  console.error(error);
});
