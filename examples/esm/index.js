import { createLeoClient } from "@skl-connect/leo-client";
import { readFileSync } from "node:fs";

const codigo = "";
const password = "";
const ciclo = "2026-A";
const tokenPem = "./token.pem";

const leo = createLeoClient({
  privateKey: readFileSync(tokenPem, "utf8"),
});

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
