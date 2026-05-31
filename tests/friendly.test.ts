import { describe, expect, test } from "vitest";
import { createLeoClient } from "../src/index.js";
import type { LoginSuccess } from "../src/types.js";

describe("createLeoClient", () => {
  test("expone la API publica esperada y permite hidratar sesion", () => {
    const leo = createLeoClient({ privateKey: "test-key" });
    const session: LoginSuccess = {
      id_token: "session-token",
      usua_id: "219000000",
      vigencia: "2026-01-01T00:00:00.000Z",
    };

    leo.session.use(session);

    expect(leo.login.signIn).toBeTypeOf("function");
    expect(leo.student.plans).toBeTypeOf("function");
    expect(leo.academic.classes).toBeTypeOf("function");
    expect(leo.academic.history.grades).toBeTypeOf("function");
    expect(leo.academic.transcript).toBeTypeOf("function");
    expect(leo.session.current()).toEqual(session);

    leo.session.clear();

    expect(leo.session.current()).toBeNull();
  });
});
