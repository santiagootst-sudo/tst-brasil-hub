import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const operations = readFileSync(resolve(process.cwd(), "client/src/pages/Operations.tsx"), "utf8");

describe("atalho de confirmação OTP na lista de colaboradores", () => {
  it("mantém o envio de confirmação ao lado da ação de entregar EPI", () => {
    expect(operations).toContain('const deliveryForOtp = [...empDeliveries]');
    expect(operations).toContain('"Enviar confirmação"');
    expect(operations).toContain('"Reenviar OTP"');
    expect(operations).toContain('sendOtpConfirmation(deliveryForOtp)');
    expect(operations).toContain('"Entregar EPI"');
  });

  it("bloqueia a ação quando faltar e-mail ou ficha pendente", () => {
    expect(operations).toContain('!emp.email || !deliveryForOtp');
    expect(operations).toContain('"E-mail necessário"');
    expect(operations).toContain('"Sem ficha de EPI"');
    expect(operations).toContain('"Ficha confirmada"');
  });
});
