import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { buildProfessionalPgrReportPdf, buildProfessionalPgrWord } from "../client/src/lib/pgrDocumentExport";

const pgrFixture = {
  workspaceName: "Ambiente Técnico",
  companyName: "Indústria Exemplo",
  projectName: "PGR Unidade Industrial",
  projectId: 77,
  generatedAt: new Date("2026-08-19T12:00:00Z"),
  pgrData: {
    empresa: {
      razaoSocial: "Indústria Exemplo Ltda.",
      cnpj: "12.345.678/0001-90",
      ramoAtividade: "Metalurgia",
      grauRisco: "3",
      numFuncionarios: 42,
    },
    ghes: [{ funcao: "Operador de prensa", setor: "Produção", descricao: "Operação de prensas hidráulicas", quantidade: 12 }],
    riscos: [{
      ghe: "Operador de prensa",
      categoria: "Acidente",
      risco: "Esmagamento em partes móveis",
      fonte: "Prensa hidráulica",
      probabilidade: 3,
      severidade: 4,
      classificacao: "Alto",
      medidas: "Proteção fixa e bloqueio de energia",
    }],
    acoes: [{ descricao: "Instalar proteção complementar", responsavel: "Manutenção", prazo: "30 dias", status: "Em andamento" }],
    mapaRisco: { circulos: [{ cor: "vermelho", descricao: "Prensa hidráulica" }] },
    direitos: { deveresEmpregador: "Manter as medidas de prevenção registradas.", deveresEmpregado: "Cumprir os procedimentos de trabalho seguro." },
    medicoes: [{ ghe: "Operador de prensa", agenteNome: "Ruído", valor: 84, unidade: "dB(A)", limite: "85 dB(A)", equipamento: "Dosímetro", tecnica: "Dosimetria", data: "2026-08-18", status: "Conforme" }],
    inspecoes: { historico: [{ data: "2026-08-16", descricao: "Inspeção da proteção fixa", responsavel: "TST", status: "Concluída" }] },
    mudancas: [{ data: "2026-08-17", descricao: "Troca da prensa", impacto: "Reavaliar risco de esmagamento", responsavel: "Engenharia" }],
    treinamentos: [{ titulo: "Capacitação de operação segura", data: "2026-08-10", instrutor: "TST", nr: "NR-12", periodicidade: "Anual" }],
    emergencias: { responsavel_ps: "Brigadista líder", recursos_ps: "Extintores e kit de primeiros socorros", rotas_fuga: "Saídas A e B", periodicidade: "Anual", proximo_simulado: "2026-09-15" },
  },
  attachments: [
    { title: "Laudo de ruído 2026", category: "laudo", fileUrl: "https://files.example.com/laudo-ruido.pdf", createdAt: new Date("2026-08-18T12:00:00Z") },
    { title: "Certificado de calibração do dosímetro", category: "certificate", fileUrl: "https://files.example.com/calibracao-dosimetro.pdf", createdAt: new Date("2026-08-18T12:00:00Z") },
    { title: "Imagem de validação da evidência", category: "photo", fileUrl: "https://files.example.com/evidencia.png", inlineDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+4zKZ9wAAAABJRU5ErkJggg==", createdAt: new Date("2026-08-18T12:00:00Z") },
  ],
};

describe("documentos profissionais do PGR", () => {
  it("monta PDF com dados reais de inventário, matriz e mapa de risco", () => {
    const pdf = buildProfessionalPgrReportPdf(pgrFixture);
    const buffer = pdf.output("arraybuffer");

    expect(buffer.byteLength).toBeGreaterThan(4_000);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(15);
  });

  it("monta DOCX estruturado sem conversão HTML intermediária", async () => {
    const document = buildProfessionalPgrWord(pgrFixture);
    const buffer = await Packer.toBuffer(document);

    expect(buffer.byteLength).toBeGreaterThan(8_500);
    expect(Buffer.from(buffer).subarray(0, 2).toString()).toBe("PK");
  });
});
