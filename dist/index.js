// src/crypto.ts
import jsonwebtoken from "jsonwebtoken";

// src/constants.ts
var MAGIC_KEY = "b8d0343efc18fb979821e53db80b8496";
var SEPARATOR = "~";
var TOKEN_KEY = "yvICnGtE@IENOuAv$tIFLyABLAALnMBI~$4";
var LEGACY_ORIGIN = "https://leoalumnos.udg.mx";
var LEGACY_REFERER = "https://leoalumnos.udg.mx/";
var LEGACY_BASE = "https://leoalumnos-svc.udg.mx/alum/api";
var SOYUDG_BASE = "https://soyudg.udg.mx/alumnos/show";

// src/crypto.ts
function createIss(privateKey) {
  return jsonwebtoken.sign({}, privateKey, {
    algorithm: "RS256",
    expiresIn: 60,
    issuer: "I0wzMC00THVNbjBzKg=="
  });
}
function cleanToken(token) {
  const separatorIndex = token.indexOf(SEPARATOR);
  const separated = token.slice(0, separatorIndex);
  const toMove = token.charAt(separatorIndex + 1);
  const numb = Number.parseInt(token.charAt(separatorIndex + 2), 10);
  const reduce = separated.slice(numb);
  const reduced = separated.slice(0, numb);
  return reduce + reduced + SEPARATOR + toMove;
}
function retriveToMove(transformed) {
  const pos = transformed.indexOf(SEPARATOR);
  return transformed.slice(pos + 1, pos + 2).charCodeAt(0);
}
function decodeToken(transformedSessionID, key = MAGIC_KEY) {
  const toMoved = retriveToMove(transformedSessionID);
  const length = transformedSessionID.slice(0, transformedSessionID.indexOf(SEPARATOR)).length;
  const transformToMoved = 122 - toMoved + 1;
  let token = "";
  for (let i = 0; i < length; i++) {
    let acc = transformedSessionID.charCodeAt(i) - key.charCodeAt(i);
    if (acc < 0) acc = transformToMoved + acc;
    token += String.fromCharCode(acc + toMoved);
  }
  return token;
}
function encodeToken(sessionID, key = MAGIC_KEY) {
  const sessionIDLenght = sessionID.length;
  const toMove = Math.floor(15 * Math.random() + 33);
  const magic = 122 - toMove + 1;
  let text = "";
  for (let i = 0; i < sessionIDLenght; i++) {
    const acc = sessionID.charCodeAt(i) - toMove + key.charCodeAt(i) - toMove;
    text += String.fromCharCode(acc % magic + toMove);
  }
  text += SEPARATOR + String.fromCharCode(toMove) + text;
  return cleanToken(text);
}
function getSessionToken(sessionID) {
  const key = decodeToken(cleanToken(TOKEN_KEY));
  return encodeToken(sessionID, key);
}

// src/auth.ts
async function hashPassword(password) {
  const bunRef = globalThis.Bun;
  if (bunRef) return bunRef.password.hashSync(password, "bcrypt");
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 10);
}
async function loginWithPem(user, password, privateKey) {
  const pwd = await hashPassword(password);
  const response = await fetch(`${LEGACY_BASE}/login/validar`, {
    method: "POST",
    headers: {
      Referer: LEGACY_REFERER,
      Origin: LEGACY_ORIGIN,
      authorization: `Bearer ${createIss(privateKey)}`,
      "authorization-key": "Bearer ",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usr: user, pwd })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${payload.mensaje || "Error desconocido"}`);
  }
  if (!payload.respuesta || Array.isArray(payload.respuesta)) {
    const apiError = Array.isArray(payload.respuesta) ? payload.respuesta[0]?.error : payload.mensaje;
    throw new Error(apiError || "No se obtuvo respuesta de login");
  }
  return payload.respuesta;
}

// src/legacy-client.ts
function parseCycle(raw) {
  const clean = raw.trim().toUpperCase();
  const match = clean.match(/^(\d{4})[- ]?([AB12])$/);
  if (!match) return null;
  const year = Number(match[1]);
  const termRaw = match[2];
  const term = termRaw === "B" || termRaw === "2" ? "B" : "A";
  if (Number.isNaN(year)) return null;
  return { year, term };
}
function cycleToIndex(cycle) {
  return cycle.year * 2 + (cycle.term === "A" ? 0 : 1);
}
function indexToCycle(index) {
  const year = Math.floor(index / 2);
  const term = index % 2 === 0 ? "A" : "B";
  return { year, term };
}
function cycleVariants(ciclo) {
  const base = ciclo.trim().toUpperCase();
  const parsed = parseCycle(base);
  const variants = [base];
  if (parsed) {
    const termNum = parsed.term === "A" ? "1" : "2";
    variants.push(`${parsed.year}-${parsed.term}`);
    variants.push(`${parsed.year}${parsed.term}`);
    variants.push(`${parsed.year}-${termNum}`);
    variants.push(`${parsed.year}${termNum}`);
  }
  return [...new Set(variants.filter(Boolean))];
}
function buildHistoricalCycleCandidates(plans) {
  const fromPlans = plans.flatMap((p) => [String(p.cicladmision ?? ""), String(p.ciclefectivo ?? "")]).filter(Boolean);
  const parsed = fromPlans.map(parseCycle).filter((v) => v !== null);
  const ranged = [];
  if (parsed.length > 0) {
    const indexes = parsed.map(cycleToIndex);
    const min = Math.min(...indexes) - 2;
    const max = Math.max(...indexes) + 2;
    for (let i = min; i <= max; i++) {
      const c = indexToCycle(i);
      ranged.push(`${c.year}-${c.term}`);
    }
  }
  const all = [.../* @__PURE__ */ new Set([...fromPlans, ...ranged])];
  return all.sort((a, b) => {
    const pa = parseCycle(a);
    const pb = parseCycle(b);
    if (!pa && !pb) return a.localeCompare(b);
    if (!pa) return 1;
    if (!pb) return -1;
    return cycleToIndex(pa) - cycleToIndex(pb);
  });
}
function buildKardexEndpointCandidates(studentCode, plan) {
  const base = `${LEGACY_BASE}/alumnos-esc`;
  const idcentro = String(plan.idcentro ?? "");
  const idsede = String(plan.idsede ?? "");
  const idprograma = String(plan.idprograma ?? "");
  const idciclo = String(plan.ciclefectivo ?? "");
  const idcicloadmi = String(plan.cicladmision ?? "");
  const bodyVariants = [
    { idalumno: studentCode, idcentro, idciclo, idcicloadmi, idprograma, idsede },
    { idalumno: studentCode, idcentro, idciclo: idciclo.replace("-", ""), idcicloadmi, idprograma, idsede },
    { idalumno: studentCode, idcentro, idciclo, idcicloadmi: idcicloadmi.replace("-", ""), idprograma, idsede },
    { idalumno: studentCode, idcentro, idciclo: idciclo.replace("-", ""), idcicloadmi: idcicloadmi.replace("-", ""), idprograma, idsede }
  ];
  return [
    { name: "kardex_get_student", method: "GET", url: `${base}/${studentCode}/kardex` },
    { name: "kardex_get_program", method: "GET", url: `${base}/${studentCode}/${idprograma}/${idciclo}/kardex` },
    { name: "kardex_get_full", method: "GET", url: `${base}/${studentCode}/${idprograma}/${idciclo}/${idcicloadmi}/kardex` },
    ...bodyVariants.map((b, i) => ({
      name: `kardex_post_root_v${i + 1}`,
      method: "POST",
      url: `${base}/kardex`,
      body: b
    })),
    ...bodyVariants.map((b, i) => ({
      name: `kardex_post_student_v${i + 1}`,
      method: "POST",
      url: `${base}/${studentCode}/kardex`,
      body: b
    }))
  ];
}
var LegacyClient = class {
  constructor(userToken, privateKey, retries = 3) {
    this.userToken = userToken;
    this.privateKey = privateKey;
    this.retries = retries;
  }
  userToken;
  privateKey;
  retries;
  async requestLegacy(url, method, body) {
    const sessionToken = getSessionToken(this.userToken);
    const response = await fetch(url, {
      method,
      headers: {
        Referer: LEGACY_REFERER,
        Origin: LEGACY_ORIGIN,
        authorization: `Bearer ${createIss(this.privateKey)}`,
        "authorization-key": `Bearer ${sessionToken}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : void 0
    });
    const raw = await response.text();
    let json = null;
    try {
      json = JSON.parse(raw);
    } catch {
      json = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      raw,
      json
    };
  }
  async fetchLegacy(url) {
    let lastError = null;
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      const res = await this.requestLegacy(url, "GET");
      if (!res.json) {
        if (res.status >= 500 && attempt < this.retries) {
          await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
          continue;
        }
        throw new Error(`HTTP ${res.status}: respuesta no JSON (${res.raw.slice(0, 200)})`);
      }
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}: ${res.json.mensaje || "Error desconocido"}`);
        if (res.status >= 500 && attempt < this.retries) {
          lastError = err;
          await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
          continue;
        }
        throw err;
      }
      if (res.json.respuesta === void 0) {
        throw new Error(`Respuesta legacy sin datos: ${JSON.stringify(res.json).slice(0, 250)}`);
      }
      if (Array.isArray(res.json.respuesta)) {
        const first = res.json.respuesta[0];
        if (first?.error) throw new Error(first.error);
      }
      return res.json.respuesta;
    }
    throw lastError ?? new Error("No se pudo consultar endpoint legacy");
  }
  async getPlans(studentCode) {
    return this.fetchLegacy(`${LEGACY_BASE}/alumnos-esc/${studentCode}/planes-estudios`);
  }
  async getSchedule(studentCode, idprograma, ciclo) {
    const base = `${LEGACY_BASE}/alumnos-esc`;
    const variants = cycleVariants(ciclo);
    let lastError = null;
    for (const variant of variants) {
      try {
        return await this.fetchLegacy(`${base}/${studentCode}/${idprograma}/${variant}/horarios`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("No se pudo obtener horario en ninguna variante de ciclo");
  }
  async getBoletas(studentCode, idprograma, ciclo) {
    const base = `${LEGACY_BASE}/alumnos-esc`;
    const variants = cycleVariants(ciclo);
    let lastError = null;
    for (const variant of variants) {
      try {
        return await this.fetchLegacy(`${base}/${studentCode}/${idprograma}/${variant}/boletas`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("No se pudieron obtener boletas en ninguna variante de ciclo");
  }
  async getHistoricalBoletas(studentCode, idprograma, plans) {
    const cycles = buildHistoricalCycleCandidates(plans);
    const byCycle = {};
    for (const cycle of cycles) {
      try {
        byCycle[cycle] = await this.getBoletas(studentCode, idprograma, cycle);
      } catch {
        byCycle[cycle] = [];
      }
    }
    const consolidated = Object.entries(byCycle).flatMap(
      ([ciclo, boletas]) => boletas.map((boleta) => ({ ciclo, boleta }))
    );
    return { byCycle, consolidated };
  }
  async getKardexAdvanced(studentCode, plan) {
    const attempts = [];
    const endpoints = buildKardexEndpointCandidates(studentCode, plan);
    for (const endpoint of endpoints) {
      try {
        const res = await this.requestLegacy(endpoint.url, endpoint.method, endpoint.body);
        const message = res.json?.mensaje || (!res.json ? "respuesta no JSON" : void 0);
        attempts.push({
          name: endpoint.name,
          method: endpoint.method,
          url: endpoint.url,
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          message
        });
        if (res.ok && res.json?.respuesta !== void 0) {
          const r = res.json.respuesta;
          const hasContent = Array.isArray(r) ? r.length > 0 : r !== null && r !== "";
          if (hasContent) {
            return { data: r, attempts };
          }
        }
      } catch (error) {
        attempts.push({
          name: endpoint.name,
          method: endpoint.method,
          url: endpoint.url,
          ok: false,
          status: 0,
          statusText: "NETWORK_ERROR",
          message: String(error?.message ?? error)
        });
      }
    }
    return { data: null, attempts };
  }
};

// src/student-card.ts
function encodeStudentCode(studentCode) {
  const value = `${studentCode}-${Math.floor(Date.now() / 1e3)}`;
  const once = Buffer.from(value, "utf8").toString("base64");
  return Buffer.from(once, "utf8").toString("base64");
}
async function getStudentCard(session) {
  const encryptedId = encodeStudentCode(session.usua_id);
  const url = `${SOYUDG_BASE}?encryptedId=${encodeURIComponent(encryptedId)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok || data?.data?.error) {
      throw new Error(`HTTP ${response.status} al consultar studentCard`);
    }
    return { value: data.data ?? null, ok: true };
  } catch (error) {
    return {
      value: null,
      ok: false,
      reason: String(error?.message ?? error)
    };
  }
}

// src/sdk.ts
var LeoEndpointCX = class {
  privateKey;
  retries;
  session = null;
  constructor(options) {
    this.privateKey = options.privateKey;
    this.retries = options.retries ?? 3;
  }
  async login(user, password) {
    this.session = await loginWithPem(user, password, this.privateKey);
    return this.session;
  }
  setSession(session) {
    this.session = session;
  }
  getSession() {
    return this.session;
  }
  requireSession() {
    if (!this.session) {
      throw new Error("No hay sesion activa. Ejecuta login() primero o usa setSession().");
    }
    return this.session;
  }
  client() {
    const s = this.requireSession();
    return new LegacyClient(s.id_token, this.privateKey, this.retries);
  }
  async getPlans(studentCode) {
    const s = this.requireSession();
    return this.client().getPlans(studentCode ?? s.usua_id);
  }
  async getSchedule(idprograma, ciclo, studentCode) {
    const s = this.requireSession();
    return this.client().getSchedule(studentCode ?? s.usua_id, idprograma, ciclo);
  }
  async getBoletas(idprograma, ciclo, studentCode) {
    const s = this.requireSession();
    return this.client().getBoletas(studentCode ?? s.usua_id, idprograma, ciclo);
  }
  async getHistoricalBoletas(idprograma, plans, studentCode) {
    const s = this.requireSession();
    return this.client().getHistoricalBoletas(studentCode ?? s.usua_id, idprograma, plans);
  }
  async getKardexAdvanced(plan, studentCode) {
    const s = this.requireSession();
    return this.client().getKardexAdvanced(studentCode ?? s.usua_id, plan);
  }
  async getStudentCard(session) {
    return getStudentCard(session ?? this.requireSession());
  }
};

// src/friendly.ts
function normalizeStudentCode(value) {
  if (value === void 0) return void 0;
  return String(value).trim();
}
function createLeoClient(options) {
  const sdk = new LeoEndpointCX(options);
  const signIn = (studentCode, password) => sdk.login(String(studentCode), password);
  const getPlans = (studentCode) => sdk.getPlans(normalizeStudentCode(studentCode));
  const getCard = () => sdk.getStudentCard();
  const getSchedule = (idprograma, ciclo, studentCode) => sdk.getSchedule(idprograma, ciclo, normalizeStudentCode(studentCode));
  const getBoletas = (idprograma, ciclo, studentCode) => sdk.getBoletas(idprograma, ciclo, normalizeStudentCode(studentCode));
  const getHistoricalBoletas = (idprograma, plans, studentCode) => sdk.getHistoricalBoletas(idprograma, plans, normalizeStudentCode(studentCode));
  const getKardex = (plan, studentCode) => sdk.getKardexAdvanced(plan, normalizeStudentCode(studentCode));
  return {
    login: {
      entrance: signIn,
      signIn
    },
    student: {
      plans: getPlans,
      card: getCard,
      profileCard: getCard
    },
    academic: {
      schedule: getSchedule,
      classes: getSchedule,
      boletas: getBoletas,
      grades: getBoletas,
      boletasHistoricas: getHistoricalBoletas,
      history: {
        boletas: getHistoricalBoletas,
        grades: getHistoricalBoletas
      },
      kardex: getKardex,
      transcript: getKardex
    },
    session: {
      current() {
        return sdk.getSession();
      },
      use(session) {
        sdk.setSession(session);
      },
      clear() {
        sdk.setSession(null);
      }
    },
    raw: sdk
  };
}
export {
  LegacyClient,
  LeoEndpointCX,
  buildHistoricalCycleCandidates,
  buildKardexEndpointCandidates,
  createLeoClient,
  cycleVariants,
  getStudentCard,
  loginWithPem,
  parseCycle
};
//# sourceMappingURL=index.js.map