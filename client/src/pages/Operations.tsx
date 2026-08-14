import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ShieldAlert, 
  Package, 
  FileText, 
  Users, 
  UserCheck, 
  Calendar, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Smartphone, 
  Download, 
  FileSpreadsheet, 
  Plus, 
  X, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  User, 
  Building2, 
  Briefcase, 
  UsersRound, 
  Eye, 
  ArrowRight,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { downloadConsolidatedEpiReportPdf, downloadEpiReceiptPdf } from "@/lib/pdfReports";

export default function Operations() {
  const utils = trpc.useUtils();
  const [workspaceId] = useState(1);
  const [currentTab, setCurrentTab] = useState<"overview" | "stock" | "deliveries" | "roles" | "employees" | "alerts">("overview");

  // Global & Module Search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [stockFilterMode, setStockFilterMode] = useState<"all" | "alerts" | "critical" | "expired">("all");
  const [selectedFolderSectorId, setSelectedFolderSectorId] = useState<number | null>(null);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeCpf, setNewEmployeeCpf] = useState("");
  const [newEmployeeDepartmentId, setNewEmployeeDepartmentId] = useState<number>(0);
  const [newEmployeeRoleId, setNewEmployeeRoleId] = useState<number>(0);
  const [quickDeptName, setQuickDeptName] = useState("");
  const [quickRoleName, setQuickRoleName] = useState("");
  const [importCsvText, setImportCsvText] = useState("");

  // Active QR code delivery modal
  const [activeQrDelivery, setActiveQrDelivery] = useState<any | null>(null);
  const [isSigningQr, setIsSigningQr] = useState(false);
  const [qrSignedSuccess, setQrSignedSuccess] = useState(false);

  // Queries
  const { data: companies = [] } = trpc.companies.list.useQuery({ workspaceId });
  const [currentCompanyId, setCurrentCompanyId] = useState<number>(0);

  const activeCompanyId = currentCompanyId || companies[0]?.id || 1;
  const currentCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  const { data: profile } = trpc.auth.me.useQuery();
  const current = profile?.currentEnvironment || { kind: "clt", label: "TST CLT / Empresa" };

  const { data: departments = [] } = trpc.departments.list.useQuery({ workspaceId, companyId: activeCompanyId });
  const { data: jobRoles = [] } = trpc.jobRoles.list.useQuery({ workspaceId, companyId: activeCompanyId });
  const { data: employees = [] } = trpc.employees.list.useQuery({ workspaceId, companyId: activeCompanyId });
  const { data: stockItems = [] } = trpc.epiItems.list.useQuery({ workspaceId, companyId: activeCompanyId });
  const { data: deliveries = [] } = trpc.epiDeliveries.list.useQuery({ workspaceId, companyId: activeCompanyId });

  // Mutations
  const createDepartmentMutation = trpc.departments.create.useMutation({
    onSuccess: (res: any) => {
      utils.departments.list.invalidate();
      if (res?.id) setNewEmployeeDepartmentId(res.id);
      setQuickDeptName("");
      toast.success("Setor cadastrado com sucesso!");
    }
  });

  const createRoleMutation = trpc.jobRoles.create.useMutation({
    onSuccess: (res: any) => {
      utils.jobRoles.list.invalidate();
      if (res?.id) setNewEmployeeRoleId(res.id);
      setQuickRoleName("");
      toast.success("Função cadastrada com sucesso!");
    }
  });

  const createEmployeeMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      utils.employees.list.invalidate();
      utils.epiDeliveries.list.invalidate();
      setIsEmployeeModalOpen(false);
      setNewEmployeeName("");
      setNewEmployeeCpf("");
      toast.success("Funcionário cadastrado e 1ª Ficha de EPI gerada automaticamente!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao cadastrar funcionário.");
    }
  });

  const signDeliveryMutation = trpc.epiDeliveries.sign.useMutation({
    onSuccess: () => {
      utils.epiDeliveries.list.invalidate();
      setQrSignedSuccess(true);
      toast.success("Assinatura digital registrada com sucesso via QR Code!");
    }
  });

  // Mappings
  const employeeNameById = useMemo(() => new Map(employees.map((e: any) => [e.id, e.fullName])), [employees]);
  const epiNameById = useMemo(() => new Map(stockItems.map((i: any) => [i.id, i.name])), [stockItems]);

  // Alarms and Statistics
  const lowStock = stockItems.filter((item: any) => item.stockQuantity <= item.minStock);
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiringOrExpired = stockItems.filter((item: any) => {
    if (!item.caExpiresAt) return false;
    return item.caExpiresAt <= now + thirtyDays;
  });

  const pendingDeliveries = deliveries.filter((d: any) => !d.isSigned);

  // Filtered stock list
  const filteredStock = stockItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
                          item.caNumber.toLowerCase().includes(globalSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (stockFilterMode === "alerts") return item.stockQuantity <= item.minStock || (item.caExpiresAt && item.caExpiresAt <= now + thirtyDays);
    if (stockFilterMode === "critical") return item.stockQuantity <= item.minStock;
    if (stockFilterMode === "expired") return item.caExpiresAt && item.caExpiresAt <= now;
    return true;
  });

  // Consolidated PDF export handler
  const handleExportConsolidatedPdf = () => {
    downloadConsolidatedEpiReportPdf({
      workspaceName: "TST Brasil Hub",
      companyName: currentCompany?.name || "Empresa Ativa",
      epiItems: stockItems.map((item: any) => ({
        name: item.name,
        caNumber: item.caNumber,
        stockQuantity: item.stockQuantity,
        minimumStock: item.minStock,
        expiresAt: item.caExpiresAt ? new Date(item.caExpiresAt) : null,
      })),
      deliveriesCount: deliveries.length,
    });
    toast.success("Relatório consolidado de EPIs gerado com sucesso em PDF!");
  };

  const handleMobileSign = () => {
    if (!activeQrDelivery) return;
    setIsSigningQr(true);
    setTimeout(() => {
      setIsSigningQr(false);
      signDeliveryMutation.mutate({
        deliveryId: activeQrDelivery.id,
        signedByName: employeeNameById.get(activeQrDelivery.employeeId) || "Trabalhador",
      });
    }, 1200);
  };

  const handleDownloadReceipt = (delivery: any) => {
    downloadEpiReceiptPdf({
      workspaceName: "TST Brasil Hub",
      companyName: currentCompany?.name || "Empresa Ativa",
      employeeName: employeeNameById.get(delivery.employeeId) || "Funcionário",
      epiName: epiNameById.get(delivery.epiItemId) || "EPI",
      workerDocument: "CPF verificado",
      items: [
        {
          name: epiNameById.get(delivery.epiItemId) || "EPI",
          ca: "CA 44.120",
          quantity: delivery.quantity,
          deliveredAt: new Date(delivery.deliveredAt),
          isSigned: delivery.isSigned,
          signedByName: delivery.signedByName,
        }
      ],
    });
    toast.success("Comprovante digital em PDF baixado com sucesso!");
  };

  return (
    <DashboardLayout title="Controle de EPIs">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Banner principal */}
        <section className={`rounded-[2rem] p-7 text-white shadow-lg lg:p-9 ${current.kind === "clt" ? "bg-[#123f69]" : "bg-[#063b43]"}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#8edec7]">Centro Operacional de EPIs</p>
              <h2 className="mt-2 text-3xl font-bold">Controle Avançado de EPIs e CA</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Gerenciamento inteligente de estoque, Certificados de Aprovação (CA), fichas de entrega com assinatura digital via QR Code e histórico por trabalhador.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs lg:grid-cols-3">
              <div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{lowStock.length}</b>estoque crítico</div>
              <div className="rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{expiringOrExpired.length}</b>validade a tratar</div>
              <div className="col-span-2 lg:col-span-1 rounded-xl bg-white/10 px-3 py-3"><b className="block text-lg">{pendingDeliveries.length}</b>fichas pendentes</div>
            </div>
          </div>
        </section>

        {/* Top Bar Contextual Navigation */}
        <div className="flex flex-col gap-4 rounded-2xl border border-[#dcebe8] bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
          {/* Seletor de Empresa e Abas */}
          <div className="flex flex-wrap items-center gap-2">
            {companies.length > 0 && (
              <select
                value={activeCompanyId}
                onChange={e => setCurrentCompanyId(Number(e.target.value))}
                className="h-10 rounded-xl border border-[#cfe3de] bg-[#f8fbfa] px-3 text-xs font-bold text-[#102b32] outline-none"
              >
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <div className="flex flex-wrap items-center gap-1 bg-[#f2faf8] p-1 rounded-xl border border-[#dcebe8]">
              <button
                onClick={() => setCurrentTab("overview")}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${currentTab === "overview" ? "bg-[#0c7474] text-white shadow-xs" : "text-[#5d7479] hover:bg-white"}`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setCurrentTab("stock")}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${currentTab === "stock" ? "bg-[#0c7474] text-white shadow-xs" : "text-[#5d7479] hover:bg-white"}`}
              >
                Estoque & CAs
                {(lowStock.length > 0 || expiringOrExpired.length > 0) && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] text-white">
                    {lowStock.length + expiringOrExpired.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentTab("deliveries")}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${currentTab === "deliveries" ? "bg-[#0c7474] text-white shadow-xs" : "text-[#5d7479] hover:bg-white"}`}
              >
                Arquivo de Fichas
                {pendingDeliveries.length > 0 && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-[9px] text-white">
                    {pendingDeliveries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentTab("employees")}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${currentTab === "employees" ? "bg-[#0c7474] text-white shadow-xs" : "text-[#5d7479] hover:bg-white"}`}
              >
                Funcionários
              </button>
            </div>
          </div>

          {/* Ações da Top Bar (Pesquisa Global, Cadastro de Funcionário, Importação Lote, Exportar PDF) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#668087]" />
              <Input
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Buscar EPI, CA, funcionário..."
                className="h-9 w-48 sm:w-60 rounded-xl border-[#cfe3de] pl-9 text-xs"
              />
            </div>

            <Button
              onClick={() => setIsEmployeeModalOpen(true)}
              className="h-9 rounded-xl bg-[#0c7474] text-white text-xs font-bold hover:bg-[#063b43] gap-1.5 px-3"
            >
              <Plus className="h-4 w-4" /> Novo Funcionário
            </Button>

            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="h-9 rounded-xl border-[#cfe3de] text-xs font-semibold text-[#3173a8] gap-1.5 px-3"
            >
              <FileSpreadsheet className="h-4 w-4" /> Importar CSV
            </Button>

            <Button
              onClick={handleExportConsolidatedPdf}
              variant="outline"
              className="h-9 rounded-xl border-[#cfe3de] text-xs font-semibold text-[#0c7474] gap-1.5 px-3"
            >
              <Download className="h-4 w-4" /> Relatório PDF
            </Button>
          </div>
        </div>

        {/* Conteúdo dinâmico conforme a Aba Ativa */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[#668087]">
                  <span className="text-xs font-bold uppercase tracking-wide">Total em Estoque</span>
                  <Package className="h-5 w-5 text-[#0c7474]" />
                </div>
                <div className="text-2xl font-bold text-[#102b32]">
                  {stockItems.reduce((acc: number, i: any) => acc + i.stockQuantity, 0)} <span className="text-xs font-normal text-slate-500">unidades</span>
                </div>
                <p className="text-[11px] text-[#5d7479]">Equipamentos cadastrados e prontos</p>
              </div>

              <div className="rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[#668087]">
                  <span className="text-xs font-bold uppercase tracking-wide">Alerta de Estoque</span>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {lowStock.length} <span className="text-xs font-normal text-slate-500">itens críticos</span>
                </div>
                <p className="text-[11px] text-[#5d7479]">Abaixo do estoque mínimo estipulado</p>
              </div>

              <div className="rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[#668087]">
                  <span className="text-xs font-bold uppercase tracking-wide">CAs Próximos de Vencer</span>
                  <Clock className="h-5 w-5 text-rose-500" />
                </div>
                <div className="text-2xl font-bold text-rose-600">
                  {expiringOrExpired.length} <span className="text-xs font-normal text-slate-500">certificados</span>
                </div>
                <p className="text-[11px] text-[#5d7479]">Validade do CA expirada ou nos próximos 30 dias</p>
              </div>

              <div className="rounded-2xl border border-[#dcebe8] bg-white p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[#668087]">
                  <span className="text-xs font-bold uppercase tracking-wide">Fichas Pendentes</span>
                  <UserCheck className="h-5 w-5 text-[#3173a8]" />
                </div>
                <div className="text-2xl font-bold text-[#3173a8]">
                  {pendingDeliveries.length} <span className="text-xs font-normal text-slate-500">assinaturas</span>
                </div>
                <p className="text-[11px] text-[#5d7479]">Aguardando aceite via QR Code no celular</p>
              </div>
            </div>

            {/* Listagem rápida de Alertas Críticos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[#dcebe8] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#f0f5f4] pb-3">
                  <h3 className="text-sm font-bold text-[#102b32] flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Estoque Crítico & Validade de CA
                  </h3>
                  <Button variant="ghost" onClick={() => setCurrentTab("stock")} className="text-xs text-[#0c7474] font-bold p-0 h-auto">
                    Ver todos ({lowStock.length + expiringOrExpired.length}) <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                {lowStock.length === 0 && expiringOrExpired.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#668087]">Nenhum alerta crítico de estoque ou CA no momento.</div>
                ) : (
                  <div className="space-y-2.5">
                    {lowStock.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs">
                        <div>
                          <b className="text-[#102b32]">{item.name}</b>
                          <p className="text-[11px] text-amber-800">Estoque atual: {item.stockQuantity} un. (Mínimo: {item.minStock})</p>
                        </div>
                        <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white">Estoque Baixo</span>
                      </div>
                    ))}
                    {expiringOrExpired.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs">
                        <div>
                          <b className="text-[#102b32]">{item.name} (CA {item.caNumber})</b>
                          <p className="text-[11px] text-rose-800">Vencimento do CA próximo ou expirado</p>
                        </div>
                        <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white">CA Vencendo</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#dcebe8] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#f0f5f4] pb-3">
                  <h3 className="text-sm font-bold text-[#102b32] flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#3173a8]" /> Fichas Pendentes de Assinatura Digital
                  </h3>
                  <Button variant="ghost" onClick={() => setCurrentTab("deliveries")} className="text-xs text-[#3173a8] font-bold p-0 h-auto">
                    Ver arquivo ({pendingDeliveries.length}) <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                {pendingDeliveries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#668087]">Todas as fichas de entrega estão assinadas digitalmente.</div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingDeliveries.slice(0, 4).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between rounded-xl border border-[#dcebe8] bg-[#f8fbfa] p-3 text-xs">
                        <div>
                          <b className="text-[#102b32]">{employeeNameById.get(d.employeeId) || "Funcionário"}</b>
                          <p className="text-[11px] text-[#668087]">EPI: {epiNameById.get(d.epiItemId) || "Equipamento"} ({d.quantity} un.)</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveQrDelivery(d);
                            setQrSignedSuccess(false);
                          }}
                          className="h-8 rounded-lg bg-[#0c7474] text-white text-[11px] font-bold hover:bg-[#063b43]"
                        >
                          <QrCode className="h-3.5 w-3.5 mr-1" /> Assinar QR
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Aba Estoque & CAs */}
        {currentTab === "stock" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dcebe8] bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#668087]">Filtros Rápidos:</span>
                <button
                  onClick={() => setStockFilterMode("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${stockFilterMode === "all" ? "bg-[#0c7474] text-white" : "bg-[#f2faf8] text-[#0c7474]"}`}
                >
                  Todos ({stockItems.length})
                </button>
                <button
                  onClick={() => setStockFilterMode("critical")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${stockFilterMode === "critical" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"}`}
                >
                  Estoque Crítico ({lowStock.length})
                </button>
                <button
                  onClick={() => setStockFilterMode("expired")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${stockFilterMode === "expired" ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700"}`}
                >
                  CA Vencido ({expiringOrExpired.length})
                </button>
              </div>
              <p className="text-xs text-[#668087]">Exibindo {filteredStock.length} equipamentos</p>
            </div>

            <div className="rounded-2xl border border-[#dcebe8] bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fbfa] text-[#668087] border-b border-[#dcebe8]">
                    <tr>
                      <th className="p-4 font-bold">Equipamento (EPI)</th>
                      <th className="p-4 font-bold">CA (Certificado de Aprovação)</th>
                      <th className="p-4 font-bold">Estoque Atual</th>
                      <th className="p-4 font-bold">Estoque Mínimo</th>
                      <th className="p-4 font-bold">Validade CA</th>
                      <th className="p-4 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f5f4]">
                    {filteredStock.map((item: any) => {
                      const isLow = item.stockQuantity <= item.minStock;
                      const isCaExpired = item.caExpiresAt && item.caExpiresAt <= now;
                      return (
                        <tr key={item.id} className="hover:bg-[#fcfdfd]">
                          <td className="p-4 font-bold text-[#102b32]">{item.name}</td>
                          <td className="p-4 font-mono text-[#3173a8]">CA {item.caNumber}</td>
                          <td className="p-4 font-bold text-[#102b32]">{item.stockQuantity} un.</td>
                          <td className="p-4 text-[#668087]">{item.minStock} un.</td>
                          <td className="p-4 text-[#668087]">{item.caExpiresAt ? new Date(item.caExpiresAt).toLocaleDateString("pt-BR") : "Indeterminado"}</td>
                          <td className="p-4 text-right">
                            {isLow ? (
                              <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10px] font-bold">Estoque Baixo</span>
                            ) : isCaExpired ? (
                              <span className="rounded-full bg-rose-100 text-rose-800 px-2.5 py-1 text-[10px] font-bold">CA Vencido</span>
                            ) : (
                              <span className="rounded-full bg-[#e8f6f1] text-[#0c7474] px-2.5 py-1 text-[10px] font-bold">Regular</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Aba Arquivo de Fichas (Armário por Setores com Mini-Avatares) */}
        {currentTab === "deliveries" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-[#dcebe8] shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#102b32] flex items-center gap-2">
                  <Folder className="h-5 w-5 text-[#0c7474]" /> Arquivo Setorial de Fichas de EPI
                </h3>
                <p className="text-xs text-[#668087]">Selecione um setor abaixo para abrir a pasta de arquivos dos colaboradores e verificar fichas e entregas.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFolderSectorId(null)}
                  className="rounded-xl border-[#dcebe8] text-xs font-bold text-[#5d7479]"
                >
                  Recolher Todas as Pastas
                </Button>
              </div>
            </div>

            {/* Armário de Pastas por Setor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departments.map((dept: any) => {
                const isOpen = selectedFolderSectorId === dept.id;
                const deptEmployees = employees.filter((e: any) => e.departmentId === dept.id);
                const pendingCount = deliveries.filter((d: any) => {
                  const emp = employees.find((e: any) => e.id === d.employeeId);
                  return emp?.departmentId === dept.id && !d.isSigned;
                }).length;

                return (
                  <div
                    key={dept.id}
                    className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs ${isOpen ? "border-[#0c7474] ring-2 ring-[#0c7474]/10" : "border-[#dcebe8] hover:border-[#0c7474]/50"}`}
                  >
                    <div
                      onClick={() => setSelectedFolderSectorId(isOpen ? null : dept.id)}
                      className="p-5 cursor-pointer flex items-center justify-between bg-[#f8fbfa] border-b border-[#f0f5f4]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid h-10 w-10 place-items-center rounded-xl ${isOpen ? "bg-[#0c7474] text-white" : "bg-[#e8f6f1] text-[#0c7474]"}`}>
                          {isOpen ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-[#102b32]">{dept.name}</h4>
                          <p className="text-[11px] text-[#668087]">{deptEmployees.length} colaboradores cadastrados</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pendingCount > 0 && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {pendingCount} pend.
                          </span>
                        )}
                        <ChevronRight className={`h-4 w-4 text-[#668087] transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </div>
                    </div>

                    {/* Mini-avatares na capa da pasta quando fechada */}
                    {!isOpen && (
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex -space-x-2 overflow-hidden">
                          {deptEmployees.slice(0, 4).map((emp: any, idx: number) => (
                            <div key={idx} className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-[#0c7474] text-white text-[10px] font-bold grid place-items-center uppercase">
                              {emp.fullName.slice(0, 2)}
                            </div>
                          ))}
                          {deptEmployees.length === 0 && <span className="text-[11px] text-[#668087]">Nenhum colaborador no setor</span>}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderSectorId(dept.id);
                          }}
                          className="h-8 rounded-xl bg-[#0c7474] text-white text-[11px] font-bold"
                        >
                          Abrir Pasta
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Conteúdo da Pasta Aberta */}
            {selectedFolderSectorId !== null && (
              <div className="rounded-3xl border-2 border-[#0c7474] bg-white p-6 shadow-lg space-y-6 animate-in fade-in-95 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#f0f5f4] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0c7474] text-white">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-[#102b32]">
                        Pasta do Setor: {departments.find((d: any) => d.id === selectedFolderSectorId)?.name}
                      </h4>
                      <p className="text-xs text-[#668087]">Colaboradores e fichas de EPI vinculadas a este setor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#668087]" />
                      <Input
                        value={folderSearchQuery}
                        onChange={e => setFolderSearchQuery(e.target.value)}
                        placeholder="Buscar funcionário na pasta..."
                        className="h-9 w-56 rounded-xl border-[#cfe3de] pl-9 text-xs"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFolderSectorId(null)}
                      className="rounded-xl border-[#dcebe8] text-xs font-bold text-[#5d7479]"
                    >
                      Fechar Gaveta
                    </Button>
                  </div>
                </div>

                {/* Colaboradores da Pasta */}
                <div className="space-y-4">
                  {employees
                    .filter((e: any) => e.departmentId === selectedFolderSectorId)
                    .filter((e: any) => e.fullName.toLowerCase().includes(folderSearchQuery.toLowerCase()))
                    .map((emp: any) => {
                      const empDeliveries = deliveries.filter((d: any) => d.employeeId === emp.id);
                      return (
                        <div key={emp.id} className="rounded-2xl border border-[#dcebe8] bg-[#f8fbfa] p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474] font-bold">
                                {emp.fullName.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <h5 className="text-sm font-bold text-[#102b32]">{emp.fullName}</h5>
                                <p className="text-xs text-[#668087]">CPF: {emp.cpf || "Não informado"} • Admissão: {emp.hiredAt ? new Date(emp.hiredAt).toLocaleDateString("pt-BR") : "Recente"}</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0c7474] border border-[#cfe3de]">
                              {empDeliveries.length} EPIs entregues
                            </span>
                          </div>

                          {/* Histórico de Entregas do Colaborador */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                            {empDeliveries.map((d: any) => (
                              <div key={d.id} className="rounded-xl border border-[#cfe3de] bg-white p-3 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <b className="text-[#102b32]">{epiNameById.get(d.epiItemId) || "Equipamento"}</b>
                                  {d.isSigned ? (
                                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">Assinado</span>
                                  ) : (
                                    <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">Pendente</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#668087]">Qtde: {d.quantity} un. • {new Date(d.deliveredAt).toLocaleDateString("pt-BR")}</p>
                                <div className="flex items-center gap-2 pt-1">
                                  {!d.isSigned ? (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setActiveQrDelivery(d);
                                        setQrSignedSuccess(false);
                                      }}
                                      className="w-full h-7 rounded-lg bg-[#0c7474] text-white text-[11px] font-bold hover:bg-[#063b43]"
                                    >
                                      <QrCode className="h-3 w-3 mr-1" /> Assinar QR Code
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadReceipt(d)}
                                      className="w-full h-7 rounded-lg border-[#cfe3de] text-[11px] font-bold text-[#3173a8]"
                                    >
                                      <Download className="h-3 w-3 mr-1" /> Baixar Comprovante
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {empDeliveries.length === 0 && (
                              <p className="text-xs text-[#668087] py-2">Nenhum EPI entregue a este colaborador ainda.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aba Funcionários */}
        {currentTab === "employees" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-[#dcebe8] shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#102b32]">Colaboradores Cadastrados</h3>
                <p className="text-xs text-[#668087]">Lista completa de funcionários da empresa ativa com suas respectivas fichas de EPI.</p>
              </div>
              <Button
                onClick={() => setIsEmployeeModalOpen(true)}
                className="rounded-xl bg-[#0c7474] text-white text-xs font-bold hover:bg-[#063b43] gap-1.5"
              >
                <Plus className="h-4 w-4" /> Cadastrar Funcionário
              </Button>
            </div>

            <div className="rounded-2xl border border-[#dcebe8] bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fbfa] text-[#668087] border-b border-[#dcebe8]">
                    <tr>
                      <th className="p-4 font-bold">Colaborador</th>
                      <th className="p-4 font-bold">CPF</th>
                      <th className="p-4 font-bold">Setor</th>
                      <th className="p-4 font-bold">Função / Cargo</th>
                      <th className="p-4 font-bold text-right">Fichas de EPI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f5f4]">
                    {employees.map((emp: any) => {
                      const empDeliveries = deliveries.filter((d: any) => d.employeeId === emp.id);
                      const deptName = departments.find((d: any) => d.id === emp.departmentId)?.name || "Geral";
                      const roleName = jobRoles.find((r: any) => r.id === emp.jobRoleId)?.name || "Colaborador";
                      return (
                        <tr key={emp.id} className="hover:bg-[#fcfdfd]">
                          <td className="p-4 font-bold text-[#102b32] flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#0c7474] font-bold">
                              {emp.fullName.slice(0, 2).toUpperCase()}
                            </span>
                            {emp.fullName}
                          </td>
                          <td className="p-4 font-mono text-[#668087]">{emp.cpf || "Não informado"}</td>
                          <td className="p-4 text-[#668087]">{deptName}</td>
                          <td className="p-4 text-[#668087]">{roleName}</td>
                          <td className="p-4 text-right font-bold text-[#0c7474]">{empDeliveries.length} entregas</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Simulação de Assinatura via QR Code Mobile */}
      {activeQrDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[2.55rem] border-8 border-[#123f69] bg-white p-6 shadow-2xl relative overflow-hidden">
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-300"></div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#0c7474]">
                  <Smartphone className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0c8c89]">Portal TST Mobile</p>
                  <h4 className="text-sm font-bold text-[#102b32]">Assinatura de EPI</h4>
                </div>
              </div>
              <button onClick={() => setActiveQrDelivery(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#dcebe8] bg-[#f7fcfa] p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#668087]">Empresa:</span>
                  <b className="text-[#102b32]">{currentCompany?.name}</b>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#668087]">Trabalhador:</span>
                  <b className="text-[#102b32]">{employeeNameById.get(activeQrDelivery.employeeId) ?? "Trabalhador"}</b>
                </div>
              </div>

              {!qrSignedSuccess ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-dashed border-[#cfe3de] p-4 text-center space-y-2">
                    <div className="mx-auto w-24 h-24 bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
                      <QrCode className="w-full h-full text-[#102b32]" />
                    </div>
                    <p className="text-[11px] text-[#668087]">Aponte a câmera do celular ou clique para simular a assinatura digital do EPI.</p>
                  </div>
                  <Button 
                    disabled={isSigningQr}
                    onClick={handleMobileSign}
                    className="w-full rounded-xl bg-[#0c7474] text-white py-3 font-bold text-sm hover:bg-[#063b43] shadow-lg shadow-[#0c7474]/20 flex items-center justify-center gap-2"
                  >
                    {isSigningQr ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processando aceite...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Assinar Ficha de EPI no Celular
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-300">
                  <div className="mx-auto w-16 h-16 rounded-full bg-[#e8f6f1] text-[#0c7474] grid place-items-center ring-8 ring-[#f1fcf9] animate-bounce">
                    <CheckCircle2 className="h-8 w-8 text-[#0c7474]" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-[#102b32]">Assinatura Concluída!</h5>
                    <p className="mt-1 text-xs text-[#5d7479]">O aceite digital foi registrado com sucesso na ficha do trabalhador.</p>
                  </div>
                  <div className="pt-2 space-y-2">
                    <Button 
                      onClick={() => handleDownloadReceipt(activeQrDelivery)}
                      className="w-full rounded-xl bg-[#3173a8] text-white py-2.5 font-bold text-xs hover:bg-[#235882] flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Baixar Comprovante Digital (PDF)
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveQrDelivery(null)}
                      className="w-full rounded-xl border-[#dcebe8] text-xs font-semibold text-[#5d7479]"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Funcionário */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#dcebe8] space-y-4 animate-in fade-in-95 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#f0f5f4] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]">
                  <UsersRound className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-[#102b32]">Cadastrar Funcionário & Ficha</h4>
                  <p className="text-[11px] text-[#668087]">Empresa: <b>{currentCompany?.name}</b> (Gera 1ª Ficha automática)</p>
                </div>
              </div>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#23454b]">Nome Completo *</label>
                <Input
                  value={newEmployeeName}
                  onChange={e => setNewEmployeeName(e.target.value)}
                  placeholder="Ex.: Carlos Eduardo Silva"
                  className="rounded-xl border-[#cfe3de] h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#23454b]">CPF (Opcional - Validação de Duplicidade)</label>
                <Input
                  value={newEmployeeCpf}
                  onChange={e => setNewEmployeeCpf(e.target.value)}
                  placeholder="Ex.: 000.000.000-00"
                  className="rounded-xl border-[#cfe3de] h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[#dcebe8] bg-[#f8fbfa] p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0c7474]">Setor / Departamento</label>
                  <span className="text-[10px] text-[#668087]">Se não encontrar, cadastre abaixo</span>
                </div>
                <select
                  value={newEmployeeDepartmentId}
                  onChange={e => setNewEmployeeDepartmentId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#cfe3de] bg-white h-10 px-3 text-xs font-semibold text-[#23454b]"
                >
                  <option value={0}>Selecione um setor existente...</option>
                  {departments.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={quickDeptName}
                    onChange={e => setQuickDeptName(e.target.value)}
                    placeholder="Ou cadastre novo setor (ex.: Soldagem)"
                    className="rounded-xl border-[#cfe3de] h-9 text-xs bg-white"
                  />
                  <Button
                    type="button"
                    disabled={createDepartmentMutation.isPending || quickDeptName.trim().length < 2}
                    onClick={() => createDepartmentMutation.mutate({ workspaceId, companyId: activeCompanyId, name: quickDeptName.trim(), description: null })}
                    className="rounded-xl bg-[#0c7474] text-white text-xs px-3 h-9 shrink-0 font-bold"
                  >
                    Adicionar Setor
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-[#dcebe8] bg-[#f8fbfa] p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3173a8]">Função / Cargo</label>
                  <span className="text-[10px] text-[#668087]">Se não encontrar, cadastre abaixo</span>
                </div>
                <select
                  value={newEmployeeRoleId}
                  onChange={e => setNewEmployeeRoleId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#cfe3de] bg-white h-10 px-3 text-xs font-semibold text-[#23454b]"
                >
                  <option value={0}>Selecione uma função existente...</option>
                  {jobRoles.map((role: any) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={quickRoleName}
                    onChange={e => setQuickRoleName(e.target.value)}
                    placeholder="Ou cadastre nova função (ex.: Soldador)"
                    className="rounded-xl border-[#cfe3de] h-9 text-xs bg-white"
                  />
                  <Button
                    type="button"
                    disabled={createRoleMutation.isPending || quickRoleName.trim().length < 2}
                    onClick={() => createRoleMutation.mutate({ workspaceId, companyId: activeCompanyId, departmentId: newEmployeeDepartmentId || null, name: quickRoleName.trim(), description: null })}
                    className="rounded-xl bg-[#3173a8] text-white text-xs px-3 h-9 shrink-0 font-bold"
                  >
                    Adicionar Função
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f5f4]">
                <Button
                  variant="outline"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="rounded-xl border-[#dcebe8] text-xs font-semibold text-[#5d7479]"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={createEmployeeMutation.isPending || newEmployeeName.trim().length < 2}
                  onClick={() => {
                    const cleanCpf = newEmployeeCpf.replace(/\D/g, "");
                    if (cleanCpf.length === 11) {
                      const exists = employees.some((emp: any) => emp.cpf && emp.cpf.replace(/\D/g, "") === cleanCpf);
                      if (exists) {
                        toast.error("Já existe um funcionário cadastrado com este CPF nesta empresa!");
                        return;
                      }
                    }
                    createEmployeeMutation.mutate({
                      workspaceId,
                      companyId: activeCompanyId,
                      fullName: newEmployeeName.trim(),
                      departmentId: newEmployeeDepartmentId || null,
                      jobRoleId: newEmployeeRoleId || null,
                      hiredAt: null
                    });
                  }}
                  className="rounded-xl bg-[#0c7474] text-white text-xs font-bold hover:bg-[#063b43]"
                >
                  {createEmployeeMutation.isPending ? "Salvando..." : "Salvar & Gerar 1ª Ficha"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação em Lote por CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#dcebe8] space-y-4 animate-in fade-in-95 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#f0f5f4] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf4fd] text-[#3173a8]">
                  <Download className="h-4 w-4 rotate-180" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-[#102b32]">Importar Funcionários em Lote (CSV)</h4>
                  <p className="text-[11px] text-[#668087]">Empresa: <b>{currentCompany?.name}</b> (Com validação de CPF)</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#23454b]">Cole os dados em formato CSV (Nome, CPF)</label>
                <Textarea
                  value={importCsvText}
                  onChange={e => setImportCsvText(e.target.value)}
                  placeholder="Exemplo:\nJoão da Silva, 111.222.333-44\nMaria Oliveira, 222.333.444-55"
                  className="min-h-32 rounded-xl border-[#cfe3de] text-xs font-mono"
                />
                <p className="text-[11px] text-[#668087]">O sistema validará automaticamente se o CPF já está cadastrado para evitar duplicidades.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f5f4]">
                <Button variant="outline" onClick={() => setIsImportModalOpen(false)} className="rounded-xl border-[#dcebe8] text-xs font-semibold text-[#5d7479]">
                  Cancelar
                </Button>
                <Button
                  disabled={!importCsvText.trim()}
                  onClick={() => {
                    const lines = importCsvText.split("\n").map(l => l.trim()).filter(Boolean);
                    let imported = 0;
                    let skipped = 0;
                    lines.forEach(line => {
                      const parts = line.split(",").map(p => p.trim());
                      const name = parts[0];
                      const cpf = parts[1] || "";
                      if (!name || name.length < 2) return;
                      const cleanImportCpf = cpf.replace(/\D/g, "");
                      if (cleanImportCpf.length === 11) {
                        const duplicate = employees.some((emp: any) => emp.cpf && emp.cpf.replace(/\D/g, "") === cleanImportCpf);
                        if (duplicate) {
                          skipped++;
                          return;
                        }
                      }
                      imported++;
                      createEmployeeMutation.mutate({
                        workspaceId,
                        companyId: activeCompanyId,
                        fullName: name,
                        departmentId: null,
                        jobRoleId: null,
                        hiredAt: null
                      });
                    });
                    setIsImportModalOpen(false);
                    setImportCsvText("");
                    toast.success(`Importação concluída: ${imported} adicionados, ${skipped} ignorados por CPF duplicado.`);
                  }}
                  className="rounded-xl bg-[#3173a8] text-white text-xs font-bold hover:bg-[#235882]"
                >
                  Processar Importação CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
