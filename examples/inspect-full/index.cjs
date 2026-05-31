const { createLeoClient } = require("@skl-connect/leo-client");
const { readFileSync } = require("node:fs");

const codigo = "";
const password = "";
const ciclo = "2026-A";
const tokenPem = "./token.pem";

function print(title, value) {
  console.log("\n" + "=".repeat(80));
  console.log(title);
  console.log("=".repeat(80));
  console.dir(value, { depth: null, colors: true });
}

async function main() {
  const leo = createLeoClient({
    privateKey: readFileSync(tokenPem, "utf8"),
  });

  const session = await leo.login.signIn(codigo, password);
  print("SESSION", session);

  const plans = await leo.student.plans();
  print("PLANS", plans);

  const plan = plans.find((item) => item.ciclefectivo === ciclo) ?? plans.find((item) => item.idestatus === "AC") ?? plans[0];
  print("SELECTED PLAN", plan);

  if (!plan?.idprograma) {
    throw new Error("No se encontro un plan academico con idprograma.");
  }

  const materias = await leo.academic.classes(plan.idprograma, ciclo);
  print("MATERIAS", materias);

  const boletas = await leo.academic.grades(plan.idprograma, ciclo);
  print("BOLETAS", boletas);

  const historial = await leo.academic.history.grades(plan.idprograma, plans);
  print("HISTORIAL", historial);

  const kardex = await leo.academic.transcript(plan);
  print("KARDEX", kardex);

  const tarjeta = await leo.student.profileCard();
  print("STUDENT CARD", tarjeta);
}

main().catch((error) => {
  console.error("No se pudo inspeccionar LEO:");
  console.error(error);
  process.exit(1);
});
