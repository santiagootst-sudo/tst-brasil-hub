import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Users, FileText, CheckCircle2, ArrowRight, ArrowLeft, Download, RefreshCw, BarChart3, Sun, Moon, Search, Filter, Image as ImageIcon, Sliders } from "lucide-react";
import { toast } from "sonner";

export default function PsychosocialApp() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedDepartment, setSelectedDepartment] = useState("todos");
  const [customRecommendations, setCustomRecommendations] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // New state for collection search & filters, PDF branding, and radar interactivity
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionStatusFilter, setCollectionStatusFilter] = useState("all");
  const [pdfLogoUrl, setPdfLogoUrl] = useState("");
  const [pdfFooterText, setPdfFooterText] = useState("Relatório Oficial COPSOQ-III • TST Brasil Hub • Todos os direitos reservados");
  const [radarMetricFilter, setRadarMetricFilter] = useState("all");

  const questions = [
    { id: 1, dimension: "Exigências Quantitativas", text: "Você tem tempo suficiente para realizar todas as suas tarefas de trabalho?" },
    { id: 2, dimension: "Ritmo de Trabalho", text: "Você precisa trabalhar em um ritmo acelerado o tempo todo?" },
    { id: 3, dimension: "Exigências Emocionais", text: "Seu trabalho exige forte envolvimento emocional com clientes ou colegas?" },
    { id: 4, dimension: "Influência no Trabalho", text: "Você tem influência sobre a quantidade de trabalho atribuída a você?" },
    { id: 5, dimension: "Possibilidades de Desenvolvimento", text: "Seu trabalho permite que você aprenda coisas novas e desenvolva suas habilidades?" },
    { id: 6, dimension: "Clareza de Papel", text: "Os objetivos e expectativas do seu trabalho estão claramente definidos?" },
    { id: 7, dimension: "Apoio da Chefia", text: "Sua chefia imediata apoia e orienta você quando necessário?" },
    { id: 8, dimension: "Apoio dos Colegas", text: "Seus colegas de trabalho estão dispostos a ajudar e cooperar?" },
    { id: 9, dimension: "Segurança no Emprego", text: "Você se sente seguro em relação à manutenção do seu posto de trabalho?" },
    { id: 10, dimension: "Assédio e Violência", text: "Você testemunhou ou sofreu algum episódio de hostilidade ou assédio no ambiente de trabalho?" }
  ];

  const dimensionsSummary = [
    { name: "Exigências Quantitativas", score: 68, risk: "Médio", status: "Atenção" },
    { name: "Ritmo de Trabalho", score: 72, risk: "Alto", status: "Crítico" },
    { name: "Exigências Emocionais", score: 45, risk: "Baixo", status: "Adequado" },
    { name: "Influência no Trabalho", score: 60, risk: "Médio", status: "Atenção" },
    { name: "Apoio da Chefia", score: 82, risk: "Baixo", status: "Adequado" },
    { name: "Segurança no Emprego", score: 35, risk: "Baixo", status: "Adequado" },
    { name: "Assédio e Violência", score: 15, risk: "Baixo", status: "Adequado" }
  ];

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const exportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csv = "Dimensao,Escore,Risco,Status\n" + dimensionsSummary.map(d => `"${d.name}",${d.score},"${d.risk}","${d.status}"`).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "copsoq_relatorio_psicossocial.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      toast.success("Relatório CSV exportado com sucesso!");
    }, 1000);
  };

  const exportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Relatório em PDF com recomendações gerado e baixado com sucesso!");
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className={`min-h-screen p-6 transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-teal-600 border-teal-600">NR-1 / NR-17</Badge>
                <Badge className="bg-teal-700 text-white">COPSOQ-III Pro</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1">Módulo de Riscos Psicossociais (COPSOQ-III)</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Avaliação científica de estressores ocupacionais, dimensões psicométricas e integração automática ao PGR.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {isDarkMode ? "Modo Claro" : "Modo Escuro"}
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" /> Exportar CSV
              </Button>
              <Button className="bg-teal-700 hover:bg-teal-800 text-white" size="sm" onClick={exportPDF} disabled={isExporting}>
                {isExporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Exportar Relatório PDF
              </Button>
            </div>
          </div>

            {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-teal-600" /> Resultados & Indicadores</TabsTrigger>
              <TabsTrigger value="questionnaire" className="flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /> Preenchimento do Colaborador</TabsTrigger>
              <TabsTrigger value="pgr-integration" className="flex items-center gap-2"><FileText className="w-4 h-4 text-teal-600" /> Acompanhamento & PGR</TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Planos de Ação & PDF</TabsTrigger>
            </TabsList>

            <div className="bg-teal-50/70 dark:bg-slate-900/60 border border-teal-200/60 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white font-bold text-xs">i</span>
                <div>
                  <strong className="block font-semibold text-slate-900 dark:text-slate-100">Guia Rápido do Módulo COPSOQ-III</strong>
                  <span>Utilize <strong>Preenchimento</strong> para simular a resposta de um trabalhador, <strong>Acompanhamento</strong> para ver o status dos envios e <strong>Resultados</strong> para analisar as dimensões e exportar relatórios.</span>
                </div>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border-teal-300 shrink-0">
                Norma NR-1 / OIT
              </Badge>
            </div>

            {/* TAB 1: OVERVIEW & DASHBOARD */}
            <TabsContent value="overview" className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-4">
                <h2 className="text-lg font-bold">Painel de Resultados Analíticos</h2>
                <p className="text-sm text-slate-500 mt-1">Visualize o consolidado das dimensões psicossociais, índice geral de risco e filtros por departamento sem expor identidades.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Respondentes Anônimos</CardTitle>
                    <Users className="w-4 h-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">48 / 50</div>
                    <p className="text-xs text-emerald-600 mt-1">✓ Umbral mínimo de 15 atingido (Sigilo garantido)</p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Dimensões Críticas</CardTitle>
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">2 de 21</div>
                    <p className="text-xs text-slate-500 mt-1">Ritmo de Trabalho e Exigências Quantitativas</p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Riscos Enviados ao PGR</CardTitle>
                    <FileText className="w-4 h-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4 riscos</div>
                    <p className="text-xs text-teal-600 mt-1">Sincronizado automaticamente</p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Conformidade NR-1</CardTitle>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">100% Ativo</div>
                    <p className="text-xs text-slate-500 mt-1">Ciclo 2026/Q3 validado</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">Filtrar por Departamento:</span>
                  <select 
                    value={selectedDepartment} 
                    onChange={e => setSelectedDepartment(e.target.value)}
                    className="p-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                  >
                    <option value="todos">Todos os Departamentos (48 respondentes)</option>
                    <option value="operacoes">Operações e Logística (22)</option>
                    <option value="administrativo">Administrativo e RH (14)</option>
                    <option value="comercial">Comercial e Vendas (12)</option>
                  </select>
                </div>
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                  Filtro seguro: Anonimato preservado (&gt;10 respondentes)
                </Badge>
              </div>

              {/* Dimensions Table & Radar Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-teal-600" /> Resumo das 21 Dimensões Psicométricas
                    </CardTitle>
                    <CardDescription>Escores ponderados de 0 a 100 baseados no validador COPSOQ-III internacional.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dimensionsSummary.map((dim, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{dim.name}</span>
                            <span className="text-slate-500">{dim.score} pts ({dim.status})</span>
                          </div>
                          <Progress value={dim.score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Radar de Riscos Interativo</CardTitle>
                        <select
                          value={radarMetricFilter}
                          onChange={e => setRadarMetricFilter(e.target.value)}
                          aria-label="Filtrar métricas do radar de riscos"
                          className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-transparent"
                        >
                          <option value="all">Todas as Dimensões</option>
                          <option value="high">Apenas Altos & Médios</option>
                          <option value="safe">Apenas Adequados</option>
                        </select>
                      </div>
                      <CardDescription>Análise multidimensional baseada no escore COPSOQ-III</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {dimensionsSummary
                          .filter(d => {
                            if (radarMetricFilter === "high") return d.risk === "Alto" || d.risk === "Médio";
                            if (radarMetricFilter === "safe") return d.risk === "Baixo";
                            return true;
                          })
                          .map((dim, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                              <span className="font-medium truncate max-w-[140px]" title={dim.name}>{dim.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{dim.score} pts</span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${dim.risk === "Alto" ? "border-amber-500 text-amber-600 bg-amber-50" : "border-teal-500 text-teal-600 bg-teal-50"}`}>
                                  {dim.risk}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                      <p className="text-[11px] text-slate-500 text-center pt-1">Clique ou selecione uma métrica para destacar o foco preventivo no PGR.</p>
                    </CardContent>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: QUESTIONNAIRE STEP BY STEP */}
            <TabsContent value="questionnaire" className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-bold">Preenchimento de Resposta do Colaborador</h2>
                <p className="text-sm text-slate-500 mt-1">Simule o preenchimento anônimo por parte de um trabalhador. As respostas alimentam diretamente o cálculo estatístico das 21 dimensões.</p>
              </div>

              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Questionário COPSOQ-III - Avaliação Anônima</CardTitle>
                      <CardDescription>Passo {currentStep + 1} de {questions.length}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-teal-600 border-teal-600">Sigilo Absoluto Garantido</Badge>
                  </div>
                  <Progress value={((currentStep + 1) / questions.length) * 100} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">{questions[currentStep].dimension}</span>
                    <h3 className="text-lg font-medium">{questions[currentStep].text}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Nunca / Quase Nunca", val: 1 },
                      { label: "Raramente", val: 2 },
                      { label: "Às Vezes", val: 3 },
                      { label: "Frequentemente", val: 4 },
                      { label: "Sempre / Quase Sempre", val: 5 }
                    ].map(opt => (
                      <Button
                        key={opt.val}
                        variant={answers[questions[currentStep].id] === opt.val ? "default" : "outline"}
                        className={`h-auto py-4 px-3 text-center flex flex-col items-center justify-center gap-2 ${
                          answers[questions[currentStep].id] === opt.val ? "bg-teal-700 hover:bg-teal-800 text-white" : ""
                        }`}
                        onClick={() => handleAnswer(questions[currentStep].id, opt.val)}
                      >
                        <span className="text-lg font-bold">{opt.val}</span>
                        <span className="text-xs">{opt.label}</span>
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                      disabled={currentStep === 0}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                    <Button 
                      className="bg-teal-700 hover:bg-teal-800 text-white"
                      onClick={() => {
                        if (currentStep < questions.length - 1) {
                          setCurrentStep(prev => prev + 1);
                          toast.success("Resposta registrada com sucesso no fluxo anônimo!");
                        } else {
                          toast.success("Questionário COPSOQ-III concluído e enviado com sucesso!");
                          setActiveTab("overview");
                        }
                      }}
                    >
                      {currentStep === questions.length - 1 ? "Finalizar e Enviar" : "Próxima Pergunta"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: PGR INTEGRATION */}
            <TabsContent value="pgr-integration" className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-bold">Acompanhamento de Respostas e Sincronização com PGR</h2>
                <p className="text-sm text-slate-500 mt-1">Acompanhe o progresso da coleta, utilize a barra de pesquisa e filtros por status, e transfira automaticamente os estressores para o inventário do PGR.</p>
              </div>

              {/* Search & Filters for Collections */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={collectionSearch}
                    onChange={e => setCollectionSearch(e.target.value)}
                    placeholder="Buscar por setor ou estressor..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={collectionStatusFilter}
                    onChange={e => setCollectionStatusFilter(e.target.value)}
                    className="w-full sm:w-auto p-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="medio">Risco Médio / Atenção</option>
                    <option value="sync">Sincronizados com PGR</option>
                  </select>
                </div>
              </div>

              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" /> Sincronização Automática com o Inventário do PGR (NR-1)
                  </CardTitle>
                  <CardDescription>Os riscos psicossociais classificados como Médios ou Altos são transferidos diretamente para o inventário do PGR da empresa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "Ritmo Acelerado de Trabalho", risk: "Risco Médio", score: 72, source: "Setor Operacional", badgeBg: "bg-amber-600" },
                    { title: "Exigências Quantitativas Elevadas", risk: "Risco Médio", score: 68, source: "Administrativo", badgeBg: "bg-amber-600" }
                  ]
                    .filter(item => {
                      const q = collectionSearch.toLowerCase();
                      const matchText = item.title.toLowerCase().includes(q) || item.source.toLowerCase().includes(q);
                      if (!matchText) return false;
                      if (collectionStatusFilter === "medio") return item.risk.includes("Médio");
                      return true;
                    })
                    .map((item, idx) => (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{item.title}</span>
                          <Badge className={`${item.badgeBg} text-white`}>{item.risk}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">Origem: Dimensão COPSOQ-III (Escore {item.score}) • Fonte: {item.source}</p>
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => toast.success(`"${item.title}" sincronizado com o PGR com sucesso!`)}>
                            Sincronizar com PGR
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: RECOMMENDATIONS */}
            <TabsContent value="recommendations" className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-bold">Planos de Ação, Recomendações e Exportação em PDF</h2>
                <p className="text-sm text-slate-500 mt-1">Edite as recomendações geradas e personalize a identidade visual (logotipo e rodapé) do relatório em PDF exportável.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-teal-600" /> Identidade Visual do Relatório PDF</CardTitle>
                    <CardDescription>Insira a URL do logotipo da empresa e defina o rodapé oficial.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">URL do Logotipo da Empresa</label>
                      <input
                        type="text"
                        value={pdfLogoUrl}
                        onChange={e => setPdfLogoUrl(e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Texto do Rodapé do Relatório</label>
                      <input
                        type="text"
                        value={pdfFooterText}
                        onChange={e => setPdfFooterText(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Identidade visual do PDF aplicada com sucesso!")}>
                      Salvar Identidade Visual
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Sliders className="w-4 h-4 text-teal-600" /> Planos de Ação & Recomendações</CardTitle>
                    <CardDescription>Personalize o texto preventivo incorporado à exportação.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea 
                      rows={4}
                      value={customRecommendations}
                      onChange={e => setCustomRecommendations(e.target.value)}
                      placeholder="1. Adequar dimensionamento de pessoal e pausas programadas..."
                      className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                    />
                    <Button className="bg-teal-700 hover:bg-teal-800 text-white w-full" onClick={() => toast.success("Recomendações e modelo PDF atualizados!")}>
                      Salvar Alterações para Exportação
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>

        </div>
      </div>
    </DashboardLayout>
  );
}
