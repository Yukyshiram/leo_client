import { describe, expect, test } from "vitest";
import { createLeoClient, isLeoClientError } from "../src/index.js";
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
    leo.session.useStudentCode("219000000");

    expect(leo.login.signIn).toBeTypeOf("function");
    expect(leo.student.plans).toBeTypeOf("function");
    expect(leo.academic.classes).toBeTypeOf("function");
    expect(leo.academic.history.grades).toBeTypeOf("function");
    expect(leo.academic.transcript).toBeTypeOf("function");
    expect(leo.session.current()).toEqual(session);
    expect(leo.session.studentCode()).toBe("219000000");

    leo.session.clear();

    expect(leo.session.current()).toBeNull();
    expect(leo.session.studentCode()).toBeNull();
  });
});

describe("input validation", () => {
  test("rechaza privateKey vacia", () => {
    try {
      createLeoClient({ privateKey: "" });
      throw new Error("Expected createLeoClient to throw");
    } catch (error) {
      expect(isLeoClientError(error)).toBe(true);
      if (isLeoClientError(error)) {
        expect(error.code).toBe("MISSING_PRIVATE_KEY");
      }
    }
  });

  test("rechaza codigo vacio antes de llamar LEO", async () => {
    const leo = createLeoClient({ privateKey: "test-key" });

    await expect(leo.login.signIn("", "password")).rejects.toMatchObject({
      code: "MISSING_STUDENT_CODE",
    });
  });

  test("rechaza password vacio antes de llamar LEO", async () => {
    const leo = createLeoClient({ privateKey: "test-key" });

    await expect(leo.login.signIn("219000000", "")).rejects.toMatchObject({
      code: "MISSING_PASSWORD",
    });
  });
});
