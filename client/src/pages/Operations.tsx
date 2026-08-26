import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ModuleHeader, ModulePage } from "@/components/ModulePageLayout";
import { useLocation, useSearch } from "wouter";
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
  RefreshCw,
  Loader2,
  ClipboardList,
  MailCheck,
  ShieldCheck
} from "lucide-react";
import { workspaceIdFromSearch } from "@shared/workspaceContext";
import { downloadConsolidatedEpiReportPdf, downloadEpiReceiptPdf } from "@/lib/pdfReports";
import { readFileAsDataUrl } from "@/lib/fileUpload";

function maskRecipientEmail(email: string | null | undefined) {
  const [local, domain] = (email ?? "").split("@");
  if (!local || !domain) return "destinatário cadastrado";
  return `${local.slice(0, 2)}${"•".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export default function Operations() {
  const utils = trpc.useUtils();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const requestedTab = new URLSearchParams(search).get("tab");
  const requestedStockView = new URLSearchParams(search).get("view");
  const requestedArchiveView = new URLSearchParams(search).get("archive");
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, { enabled: workspaceId > 0, retry: false });
  const organization = trpc.portal.organization.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const operations = trpc.portal.operations.useQuery({ workspaceId }, { enabled: workspaceId > 0 });

  const [currentTab, setCurrentTab] = useState<"overview" | "stock" | "deliveries" | "evidence" | "roles" | "employees" | "alerts">("overview");

  // Global & Module Search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [stockFilterMode, setStockFilterMode] = useState<"all" | "alerts" | "critical" | "expired">("all");
  const [stockView, setStockView] = useState<"table" | "kanban">(requestedStockView === "kanban" ? "kanban" : "table");
  const [archiveView, setArchiveView] = useState<"sectors" | "employees">(requestedArchiveView === "employees" ? "employees" : "sectors");
  const [selectedFolderSectorId, setSelectedFolderSectorId] = useState<number | null>(null);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [expandedArchiveEmployeeId, setExpandedArchiveEmployeeId] = useState(0);
  const [openingArchiveEmployeeId, setOpeningArchiveEmployeeId] = useState(0);

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeCpf, setNewEmployeeCpf] = useState("");
  const [newEmployeeDepartmentId, setNewEmployeeDepartmentId] = useState<number>(0);
  const [newEmployeeRoleId, setNewEmployeeRoleId] = useState<number>(0);
  const [quickDeptName, setQuickDeptName] = useState("");
  const [quickRoleName, setQuickRoleName] = useState("");
  const [importCsvText, setImportCsvText] = useState("");
  const [isEpiModalOpen, setIsEpiModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [newEpiName, setNewEpiName] = useState("");
  const [newEpiCaNumber, setNewEpiCaNumber] = useState("");
  const [newEpiManufacturer, setNewEpiManufacturer] = useState("");
  const [newEpiStockQuantity, setNewEpiStockQuantity] = useState("0");
  const [newEpiMinimumStock, setNewEpiMinimumStock] = useState("0");
  const [newEpiExpiresAt, setNewEpiExpiresAt] = useState("");
  const [newEpiEquipmentExpiresAt, setNewEpiEquipmentExpiresAt] = useState("");
  const [newEpiLotNumber, setNewEpiLotNumber] = useState("");
  const [newEpiProtectionDescription, setNewEpiProtectionDescription] = useState("");
  const [newEpiLimitations, setNewEpiLimitations] = useState("");
  const [newEpiCareInstructions, setNewEpiCareInstructions] = useState("");
  const [newEpiManualUrl, setNewEpiManualUrl] = useState("");
  const [newEpiRequiresTraining, setNewEpiRequiresTraining] = useState(false);
  const [newEpiImageUrl, setNewEpiImageUrl] = useState("");
  const [newEpiResponsibleName, setNewEpiResponsibleName] = useState("");
  const [newEpiRenewalRequested, setNewEpiRenewalRequested] = useState(false);
  const [editingEpiId, setEditingEpiId] = useState(0);
  const [isUploadingEpiImage, setIsUploadingEpiImage] = useState(false);
  const [deliveryEmployeeId, setDeliveryEmployeeId] = useState(0);
  const [deliveryEpiItemId, setDeliveryEpiItemId] = useState(0);
  const [deliveryQuantity, setDeliveryQuantity] = useState("1");
  const [deliveryKind, setDeliveryKind] = useState<"initial" | "replacement">("initial");
  const [deliveryReason, setDeliveryReason] = useState<"initial" | "scheduled_replacement" | "damage" | "loss" | "expiry" | "hygiene" | "other">("initial");
  const [deliverySourceId, setDeliverySourceId] = useState(0);
  const [deliveryCondition, setDeliveryCondition] = useState<"new" | "sanitized" | "inspected">("new");
  const [deliveryOrientationConfirmed, setDeliveryOrientationConfirmed] = useState(false);
  const [deliveryTrainingCompletedAt, setDeliveryTrainingCompletedAt] = useState("");
  const [deliveryDeliveredByName, setDeliveryDeliveredByName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Active QR code delivery modal
  const [activeQrDelivery, setActiveQrDelivery] = useState<any | null>(null);
  const [selectedEvidenceDeliveryId, setSelectedEvidenceDeliveryId] = useState(0);
  const [isSigningQr, setIsSigningQr] = useState(false);
  const [qrSignedSuccess, setQrSignedSuccess] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  const [currentCompanyId, setCurrentCompanyId] = useState<number>(0);

  const currentWs = workspace.data;
  const companies = currentWs?.companies ?? [];
  const activeCompanyId = currentCompanyId || companies[0]?.id || 0;
  const currentCompany = companies.find(c => c.id === activeCompanyId) || companies[0];
  const evidenceList = trpc.portal.listEpiEvidence.useQuery({ workspaceId, companyId: activeCompanyId || null, limit: 300 }, { enabled: workspaceId > 0 && activeCompanyId > 0 });
  const selectedEvidence = trpc.portal.getEpiEvidence.useQuery({ workspaceId, deliveryId: selectedEvidenceDeliveryId }, { enabled: workspaceId > 0 && selectedEvidenceDeliveryId > 0, retry: false });

  const current = { kind: "clt", label: "TST CLT / Empresa" };

  const departments = (organization.data?.departments ?? []).filter(item => item.companyId === activeCompanyId);
  const jobRoles = (organization.data?.jobRoles ?? []).filter(item => item.companyId === activeCompanyId);
  const employees = (organization.data?.employees ?? []).filter(item => item.companyId === activeCompanyId && item.status === "active");
  const stockItems = (operations.data?.epiItems ?? []).filter(item => item.companyId === activeCompanyId);
  const deliveries = (operations.data?.epiDeliveries ?? []).filter(item => item.companyId === activeCompanyId);

  // Mutations
  const createDepartmentMutation = trpc.portal.createDepartment.useMutation({
    onSuccess: async (res: any) => {
      await utils.portal.organization.invalidate({ workspaceId });
      if (res?.id) setNewEmployeeDepartmentId(res.id);
      setQuickDeptName("");
      toast.success("Setor cadastrado com sucesso!");
    }
  });

  const createRoleMutation = trpc.portal.createJobRole.useMutation({
    onSuccess: async (res: any) => {
      await utils.portal.organization.invalidate({ workspaceId });
      if (res?.id) setNewEmployeeRoleId(res.id);
      setQuickRoleName("");
      toast.success("Função cadastrada com sucesso!");
    }
  });

  const createEmployeeMutation = trpc.portal.createEmployee.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.portal.organization.invalidate({ workspaceId }),
        utils.portal.operations.invalidate({ workspaceId }),
      ]);
      setIsEmployeeModalOpen(false);
      setNewEmployeeName("");
      setNewEmployeeEmail("");
      setNewEmployeeCpf("");
      toast.success("Funcionário cadastrado. Registre uma entrega de EPI para gerar a primeira ficha.");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao cadastrar funcionário.");
    }
  });

  const createEpiItemMutation = trpc.portal.createEpiItem.useMutation({
    onSuccess: async () => {
      await utils.portal.operations.invalidate({ workspaceId });
      setIsEpiModalOpen(false);
      setNewEpiName(""); setNewEpiCaNumber(""); setNewEpiManufacturer(""); setNewEpiLotNumber(""); setNewEpiProtectionDescription(""); setNewEpiLimitations(""); setNewEpiCareInstructions(""); setNewEpiManualUrl(""); setNewEpiRequiresTraining(false); setNewEpiStockQuantity("0"); setNewEpiMinimumStock("0"); setNewEpiExpiresAt(""); setNewEpiEquipmentExpiresAt(""); setNewEpiImageUrl(""); setNewEpiResponsibleName(""); setNewEpiRenewalRequested(false); setEditingEpiId(0);
      toast.success("EPI cadastrado no estoque da empresa.");
    },
    onError: error => toast.error(error.message || "Não foi possível cadastrar o EPI."),
  });

  const updateEpiItemMutation = trpc.portal.updateEpiItem.useMutation({
    onSuccess: async () => {
      await utils.portal.operations.invalidate({ workspaceId });
      setIsEpiModalOpen(false);
      setNewEpiName(""); setNewEpiCaNumber(""); setNewEpiManufacturer(""); setNewEpiLotNumber(""); setNewEpiProtectionDescription(""); setNewEpiLimitations(""); setNewEpiCareInstructions(""); setNewEpiManualUrl(""); setNewEpiRequiresTraining(false); setNewEpiStockQuantity("0"); setNewEpiMinimumStock("0"); setNewEpiExpiresAt(""); setNewEpiEquipmentExpiresAt(""); setNewEpiImageUrl(""); setNewEpiResponsibleName(""); setNewEpiRenewalRequested(false); setEditingEpiId(0);
      toast.success("EPI atualizado com sucesso.");
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o EPI."),
  });

  const uploadEpiImageMutation = trpc.portal.uploadEpiImage.useMutation({
    onError: error => toast.error(error.message || "Não foi possível enviar a foto do EPI."),
  });

  const createEpiDeliveryMutation = trpc.portal.createEpiDelivery.useMutation({
    onSuccess: async () => {
      await utils.portal.operations.invalidate({ workspaceId });
      setIsDeliveryModalOpen(false);
      setDeliveryEmployeeId(0); setDeliveryEpiItemId(0); setDeliveryQuantity("1"); setDeliveryKind("initial"); setDeliveryReason("initial"); setDeliverySourceId(0); setDeliveryCondition("new"); setDeliveryOrientationConfirmed(false); setDeliveryTrainingCompletedAt(""); setDeliveryDeliveredByName(""); setDeliveryNotes(""); setDeliveryDate(new Date().toISOString().slice(0, 10));
      toast.success("Entrega registrada. A ficha de EPI está disponível no arquivo do funcionário.");
    },
    onError: error => toast.error(error.message || "Não foi possível registrar a entrega de EPI."),
  });

  const signEpiDeliveryMutation = trpc.portal.signEpiDelivery.useMutation({
    onSuccess: async () => {
      await utils.portal.operations.invalidate({ workspaceId });
      setIsSigningQr(false);
      setQrSignedSuccess(true);
      toast.success("Aceite do trabalhador registrado na ficha de EPI.");
    },
    onError: error => {
      setIsSigningQr(false);
      toast.error(error.message || "Não foi possível registrar a assinatura da ficha.");
    },
  });
  const sendEpiEvidenceMutation = trpc.portal.sendEpiEvidence.useMutation({
    onSuccess: async result => {
      await Promise.all([utils.portal.listEpiEvidence.invalidate({ workspaceId, companyId: activeCompanyId || null, limit: 300 }), utils.portal.operations.invalidate({ workspaceId })]);
      toast.success(`E-mail de confirmação enviado para ${maskRecipientEmail(result.evidence.recipientEmail)}. A ficha e o OTP foram registrados na trilha auditável.`);
    },
    onError: error => toast.error(error.message || "Não foi possível enviar a confirmação por e-mail."),
  });
  const updateEmployeeEmailMutation = trpc.portal.updateEmployeeEmail.useMutation({
    onSuccess: async () => {
      await utils.portal.organization.invalidate({ workspaceId });
      toast.success("E-mail de confirmação atualizado para o trabalhador.");
    },
    onError: error => toast.error(error.message || "Não foi possível atualizar o e-mail."),
  });

  // Mappings
  const employeeNameById = useMemo(() => new Map<number, string>(employees.map((e: any) => [e.id, e.fullName])), [employees]);
  const epiNameById = useMemo(() => new Map<number, string>(stockItems.map((i: any) => [i.id, i.name])), [stockItems]);
  const epiById = useMemo(() => new Map<number, any>(stockItems.map((item: any) => [item.id, item])), [stockItems]);

  // Alarms and Statistics
  const lowStock = stockItems.filter((item: any) => item.stockQuantity <= item.minimumStock);
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiringOrExpired = stockItems.filter((item: any) => {
    if (!item.expiresAt) return false;
    return new Date(item.expiresAt).getTime() <= now + thirtyDays;
  });

  const evidenceByDeliveryId = useMemo(() => new Map<number, any>((evidenceList.data?.items ?? []).map((item: any) => [item.evidence.deliveryId, item.evidence])), [evidenceList.data?.items]);
  const isDeliverySigned = (delivery: any) => evidenceByDeliveryId.get(delivery.id)?.status === "confirmed" || Boolean(delivery.signedByName || delivery.digitalSignature);
  const pendingDeliveries = deliveries.filter((delivery: any) => !isDeliverySigned(delivery));

  const [profileDepartmentFilter, setProfileDepartmentFilter] = useState(0);
  const [profileRoleFilter, setProfileRoleFilter] = useState(0);
  const companyId = activeCompanyId;
  const archiveFiltersKey = `tst-hub:epi-profile-filters:${workspaceId}:${companyId}`;
  const filters = { profileDepartmentFilter, profileRoleFilter };
  const profileEmployees = employees.filter((employee: any) => {
    if (profileDepartmentFilter > 0 && employee.departmentId !== profileDepartmentFilter) return false;
    if (profileRoleFilter > 0 && employee.jobRoleId !== profileRoleFilter) return false;
    return true;
  });
  const expandedArchiveEmployee = expandedArchiveEmployeeId > 0 && profileEmployees.filter(emp => emp.id === expandedArchiveEmployeeId)[0];
  const collaboratorCards = profileEmployees
    .filter((employee: any) => employee.fullName.toLowerCase().includes(folderSearchQuery.toLowerCase()))
    .map((employee: any) => {
      const employeeDeliveries = deliveries.filter((delivery: any) => delivery.employeeId === employee.id);
      const signedCount = employeeDeliveries.filter(isDeliverySigned).length;
      const pendingCount = employeeDeliveries.length - signedCount;
      const progress = employeeDeliveries.length ? Math.round((signedCount / employeeDeliveries.length) * 100) : 0;
      const action = employeeDeliveries.length === 0 ? "deliver" : pendingCount > 0 ? "sign" : "view";
      const tone = action === "view" ? "emerald" : action === "sign" && signedCount === 0 ? "rose" : "amber";
      return { employee, employeeDeliveries, signedCount, pendingCount, progress, action, tone, department: departments.find((department: any) => department.id === employee.departmentId) };
    });

  useEffect(() => {
    if (requestedTab === "employee_profile") setCurrentTab("deliveries");
    if (requestedTab === "overview" || requestedTab === "stock" || requestedTab === "deliveries" || requestedTab === "evidence" || requestedTab === "employees") setCurrentTab(requestedTab);
    if (requestedStockView === "table" || requestedStockView === "kanban") setStockView(requestedStockView);
    if (requestedArchiveView === "sectors" || requestedArchiveView === "employees") setArchiveView(requestedArchiveView);
  }, [requestedTab, requestedStockView, requestedArchiveView]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(archiveFiltersKey);
      if (!stored) return;
      const saved = JSON.parse(stored) as Partial<typeof filters>;
      setProfileDepartmentFilter(Number(saved.profileDepartmentFilter) || 0);
      setProfileRoleFilter(Number(saved.profileRoleFilter) || 0);
    } catch {
      // Prefer the empty filter state if local storage is unavailable or malformed.
    }
  }, [archiveFiltersKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(archiveFiltersKey, JSON.stringify(filters));
    } catch {
      // Local persistence is an enhancement; it must not block the archive.
    }
  }, [archiveFiltersKey, profileDepartmentFilter, profileRoleFilter]);

  // Filtered stock list
  const filteredStock = stockItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
                          (item.caNumber ?? "").toLowerCase().includes(globalSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (stockFilterMode === "alerts") return item.stockQuantity <= item.minimumStock || (item.expiresAt && new Date(item.expiresAt).getTime() <= now + thirtyDays);
    if (stockFilterMode === "critical") return item.stockQuantity <= item.minimumStock;
    if (stockFilterMode === "expired") return item.expiresAt && new Date(item.expiresAt).getTime() <= now;
    return true;
  });

  type ComplianceColumnId = "ready" | "expiring" | "expired" | "renewal";
  const complianceColumns: Array<{ id: ComplianceColumnId; title: string; empty: string; accent: string; badge: string }> = [
    { id: "ready", title: "Prontas", empty: "Nenhum EPI regular", accent: "border-t-4 border-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
    { id: "expiring", title: "Vencendo em 30 dias", empty: "Nenhum CA vencendo", accent: "border-t-4 border-amber-400", badge: "bg-amber-100 text-amber-800" },
    { id: "expired", title: "Vencidas", empty: "Nenhum CA vencido", accent: "border-t-4 border-rose-500", badge: "bg-rose-100 text-rose-700" },
    { id: "renewal", title: "A renovar", empty: "Nenhuma renovação encaminhada", accent: "border-t-4 border-[#123f69]", badge: "bg-[#e8eef8] text-[#123f69]" },
  ];
  const classifyEpiCompliance = (item: any): ComplianceColumnId => {
    if (item.renewalRequested) return "renewal";
    if (!item.expiresAt) return "ready";
    const expiration = new Date(item.expiresAt).getTime();
    if (expiration < now) return "expired";
    if (expiration <= now + thirtyDays) return "expiring";
    return "ready";
  };
  const kanbanItemsByColumn = complianceColumns.reduce((acc, column) => {
    acc[column.id] = filteredStock.filter((item: any) => classifyEpiCompliance(item) === column.id);
    return acc;
  }, {} as Record<ComplianceColumnId, any[]>);
  const setEpiRenewalRequested = (item: any, renewalRequested: boolean) => {
    updateEpiItemMutation.mutate({ workspaceId, companyId: activeCompanyId, epiItemId: item.id, name: item.name, imageUrl: item.imageUrl || null, responsibleName: item.responsibleName || null, renewalRequested, caNumber: item.caNumber || null, manufacturer: item.manufacturer || null, stockQuantity: item.stockQuantity, minimumStock: item.minimumStock, expiresAt: item.expiresAt ? new Date(item.expiresAt) : null });
  };

  // Consolidated PDF export handler
  const handleExportConsolidatedPdf = () => {
    downloadConsolidatedEpiReportPdf({
      workspaceName: "TST Brasil Hub",
      companyName: currentCompany?.name || "Empresa Ativa",
      epiItems: stockItems.map((item: any) => ({
        name: item.name,
        caNumber: item.caNumber,
        stockQuantity: item.stockQuantity,
        minimumStock: item.minimumStock,
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
      })),
      deliveriesCount: deliveries.length,
    });
    toast.success("Relatório consolidado de EPIs gerado com sucesso em PDF!");
  };

  const handleMobileSign = () => {
    if (!activeQrDelivery || signatureName.trim().length < 2) return;
    setIsSigningQr(true);
    signEpiDeliveryMutation.mutate({ workspaceId, deliveryId: activeQrDelivery.id, signedByName: signatureName.trim(), digitalSignature: `TST-ACEITE-${activeQrDelivery.id}-${Date.now().toString(36).toUpperCase()}`, orientationConfirmed: true });
  };

  const openSignatureDialog = (delivery: any) => {
    setActiveQrDelivery(delivery);
    setSignatureName(employeeNameById.get(delivery.employeeId) || "");
    setQrSignedSuccess(false);
  };

  const sendOtpConfirmation = (delivery: any) => {
    const employee = employees.find((item: any) => item.id === delivery.employeeId);
    if (!employee?.email) {
      toast.error("Cadastre o e-mail do trabalhador na aba Funcionários antes de enviar a confirmação OTP.");
      return;
    }
    sendEpiEvidenceMutation.mutate({ workspaceId, deliveryId: delivery.id });
  };

  const updateEmployeeOtpEmail = (employee: any) => {
    const email = window.prompt(`E-mail para a confirmação de EPI de ${employee.fullName}:`, employee.email || "");
    if (email === null) return;
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      toast.error("Informe um e-mail válido para a confirmação OTP.");
      return;
    }
    updateEmployeeEmailMutation.mutate({ workspaceId, employeeId: employee.id, email: normalized });
  };

  const collapseAllArchiveFolders = () => {
    setSelectedFolderSectorId(null);
    setExpandedArchiveEmployeeId(0);
    setOpeningArchiveEmployeeId(0);
    setFolderSearchQuery("");
    setProfileDepartmentFilter(0);
    setProfileRoleFilter(0);
  };

  const handleCollaboratorCardAction = (card: (typeof collaboratorCards)[number]) => {
    if (card.action === "deliver") {
      setDeliveryEmployeeId(card.employee.id);
      setIsDeliveryModalOpen(true);
      return;
    }
    if (card.action === "sign") {
      const pendingDelivery = card.employeeDeliveries.find((delivery: any) => !isDeliverySigned(delivery));
      if (pendingDelivery) openSignatureDialog(pendingDelivery);
      return;
    }
    setArchiveView("sectors");
    setSelectedFolderSectorId(card.employee.departmentId || null);
    setExpandedArchiveEmployeeId(card.employee.id);
    setOpeningArchiveEmployeeId(card.employee.id);
  };

  const openNewEpiForm = () => {
    setEditingEpiId(0);
    setNewEpiName(""); setNewEpiCaNumber(""); setNewEpiManufacturer(""); setNewEpiLotNumber(""); setNewEpiProtectionDescription(""); setNewEpiLimitations(""); setNewEpiCareInstructions(""); setNewEpiManualUrl(""); setNewEpiRequiresTraining(false); setNewEpiStockQuantity("0"); setNewEpiMinimumStock("0"); setNewEpiExpiresAt(""); setNewEpiEquipmentExpiresAt(""); setNewEpiImageUrl(""); setNewEpiResponsibleName(""); setNewEpiRenewalRequested(false);
    setIsEpiModalOpen(true);
  };

  const openEditEpiForm = (item: any) => {
    setEditingEpiId(item.id);
    setNewEpiName(item.name || "");
    setNewEpiCaNumber(item.caNumber || "");
    setNewEpiManufacturer(item.manufacturer || "");
    setNewEpiLotNumber(item.lotNumber || "");
    setNewEpiProtectionDescription(item.protectionDescription || "");
    setNewEpiLimitations(item.limitations || "");
    setNewEpiCareInstructions(item.careInstructions || "");
    setNewEpiManualUrl(item.manualUrl || "");
    setNewEpiRequiresTraining(Boolean(item.requiresTraining));
    setNewEpiStockQuantity(String(item.stockQuantity ?? 0));
    setNewEpiMinimumStock(String(item.minimumStock ?? 0));
    setNewEpiExpiresAt((item.caExpiresAt ?? item.expiresAt) ? new Date(item.caExpiresAt ?? item.expiresAt).toISOString().slice(0, 10) : "");
    setNewEpiEquipmentExpiresAt(item.equipmentExpiresAt ? new Date(item.equipmentExpiresAt).toISOString().slice(0, 10) : "");
    setNewEpiImageUrl(item.imageUrl || "");
    setNewEpiResponsibleName(item.responsibleName || "");
    setNewEpiRenewalRequested(Boolean(item.renewalRequested));
    setIsEpiModalOpen(true);
  };

  const handleEpiImageUpload = async (file?: File) => {
    if (!file) return;
    if (!activeCompanyId) {
      toast.error("Selecione uma empresa antes de enviar a foto do EPI.");
      return;
    }
    setIsUploadingEpiImage(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await uploadEpiImageMutation.mutateAsync({ workspaceId, companyId: activeCompanyId, dataUrl });
      setNewEpiImageUrl(uploaded.url);
      toast.success("Foto enviada ao armazenamento privado. Salve o formulário para vinculá-la ao EPI.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a foto do EPI.");
    } finally {
      setIsUploadingEpiImage(false);
    }
  };

  const handleDownloadReceipt = (delivery: any) => {
    downloadEpiReceiptPdf({
      workspaceName: "TST Brasil Hub",
      companyName: currentCompany?.name || "Empresa Ativa",
      employeeName: employeeNameById.get(delivery.employeeId) || "Funcionário",
      workerDocument: "CPF verificado",
      deliveryId: delivery.id,
      deliveryKind: delivery.deliveryKind,
      deliveryReason: delivery.deliveryReason,
      signedByName: delivery.signedByName,
      quantity: delivery.quantity,
      deliveredAt: new Date(delivery.deliveredAt),
      conditionAtDelivery: delivery.conditionAtDelivery,
      orientationTopics: delivery.orientationTopics,
      orientationConfirmedAt: delivery.orientationConfirmedAt ? new Date(delivery.orientationConfirmedAt) : undefined,
      deliveredByName: delivery.deliveredByName,
      receiptAcceptedAt: delivery.receiptAcceptedAt ? new Date(delivery.receiptAcceptedAt) : undefined,
      receiptAcceptanceMethod: delivery.receiptAcceptanceMethod,
      lotNumber: delivery.lotNumber || epiById.get(delivery.epiItemId)?.lotNumber || null,
      items: [
        {
          epiName: epiNameById.get(delivery.epiItemId) || "EPI",
          caNumber: delivery.caNumber || epiById.get(delivery.epiItemId)?.caNumber || "Não informado",
          lotNumber: delivery.lotNumber || epiById.get(delivery.epiItemId)?.lotNumber || null,
          quantity: delivery.quantity,
          deliveryDate: new Date(delivery.deliveredAt),
          condition: delivery.conditionAtDelivery || (delivery.deliveryKind === "replacement" ? "Reposição" : "Entrega inicial"),
        }
      ],
    });
    toast.success("Comprovante interno de entrega de EPI baixado com sucesso!");
  };

  if (!workspaceId) {
    return <DashboardLayout title="Controle de EPIs"><section className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><ClipboardList className="mx-auto h-10 w-10 text-[#0c7474]" /><h2 className="mt-4 text-xl font-bold">Selecione um ambiente para gerenciar EPIs.</h2><a href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Escolher ambiente</a></section></DashboardLayout>;
  }

  if (workspace.isLoading || organization.isLoading || operations.isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  }

  if (workspace.error || !workspace.data) {
    return <DashboardLayout title="Controle de EPIs"><section className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-[#b85c36]" /><h2 className="mt-4 text-xl font-bold text-[#102b32]">Este ambiente não está disponível para a sua conta.</h2><p className="mt-2 text-sm text-[#668087]">O link pode estar desatualizado ou a sua sessão precisa ser renovada. Escolha um ambiente disponível para continuar.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button type="button" variant="outline" onClick={() => void workspace.refetch()} className="rounded-xl border-[#b9e3d7] text-[#0c7474]">Tentar novamente</Button><Button type="button" onClick={() => setLocation("/app")} className="rounded-xl bg-[#0c7474] text-white">Escolher ambiente</Button></div></section></DashboardLayout>;
  }

  if (organization.error || operations.error) {
    return <DashboardLayout title="Controle de EPIs"><section className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-[#b85c36]" /><h2 className="mt-4 text-xl font-bold text-[#102b32]">Não foi possível carregar os dados de EPIs agora.</h2><p className="mt-2 text-sm text-[#668087]">O ambiente continua selecionado. Tente carregar novamente; se a falha persistir, volte à seleção e abra o ambiente de novo.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button type="button" onClick={() => void Promise.all([workspace.refetch(), organization.refetch(), operations.refetch()])} className="rounded-xl bg-[#0c7474] text-white">Tentar novamente</Button><Button type="button" variant="outline" onClick={() => setLocation("/app")} className="rounded-xl border-[#b9e3d7] text-[#0c7474]">Escolher ambiente</Button></div></section></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Controle de EPIs">
      <ModulePage className="space-y-5">
        <ModuleHeader eyebrow="Segurança do Trabalho / EPIs" title="Controle de EPIs" description="Estoque, certificados de aprovação e fichas de entrega em um só lugar." icon={Package} actions={<div className="grid min-w-full grid-cols-3 divide-x divide-[#e5e7eb] rounded-lg border border-[#e5e7eb] bg-white sm:min-w-[420px]"><div className="px-4 py-2.5"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#6b7280]">Estoque</p><p className="mt-0.5 text-xl font-semibold text-[#111827]">{stockItems.reduce((acc: number, item: any) => acc + item.stockQuantity, 0)}</p></div><div className="px-4 py-2.5"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#6b7280]">Críticos</p><p className="mt-0.5 text-xl font-semibold text-[#b91c1c]">{lowStock.length}</p></div><div className="px-4 py-2.5"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#6b7280]">Fichas pendentes</p><p className="mt-0.5 text-xl font-semibold text-[#b45309]">{pendingDeliveries.length}</p></div></div>} />

        {/* Top Bar Contextual Navigation */}
        <div className="flex flex-col gap-3 border-b border-[#e5e7eb] bg-white py-3 md:flex-row md:items-center md:justify-between">
          {/* Seletor de Empresa e Abas */}
          <div className="flex flex-wrap items-center gap-2">
            {companies.length > 0 && (
              <select
                value={activeCompanyId}
                onChange={e => setCurrentCompanyId(Number(e.target.value))}
                className="h-9 rounded-md border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#111827] outline-none"
              >
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setCurrentTab("overview")}
                className={`border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${currentTab === "overview" ? "border-[#15803d] text-[#15803d]" : "border-transparent text-[#6b7280] hover:text-[#111827]"}`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setCurrentTab("stock")}
                className={`border-b-2 px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${currentTab === "stock" ? "border-[#15803d] text-[#15803d]" : "border-transparent text-[#6b7280] hover:text-[#111827]"}`}
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
                className={`border-b-2 px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${currentTab === "deliveries" ? "border-[#15803d] text-[#15803d]" : "border-transparent text-[#6b7280] hover:text-[#111827]"}`}
              >
                Arquivo de Fichas
                {pendingDeliveries.length > 0 && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-[9px] text-white">
                    {pendingDeliveries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentTab("evidence")}
                className={`border-b-2 px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${currentTab === "evidence" ? "border-[#15803d] text-[#15803d]" : "border-transparent text-[#6b7280] hover:text-[#111827]"}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Evidências
                {(evidenceList.data?.items?.length ?? 0) > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-[#0c7474] text-[9px] text-white">{evidenceList.data?.items?.length}</span>}
              </button>
              <button
                onClick={() => setCurrentTab("employees")}
                className={`border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${currentTab === "employees" ? "border-[#15803d] text-[#15803d]" : "border-transparent text-[#6b7280] hover:text-[#111827]"}`}
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
                  <div className="py-8 text-center text-xs text-[#668087]">Tudo regular por aqui — nenhum alerta crítico de estoque ou CA no momento.</div>
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
                            openSignatureDialog(d);
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
              <div className="flex flex-wrap items-center gap-3"><div className="inline-flex rounded-xl border border-[#cfe3de] bg-[#f8fbfa] p-1" aria-label="Alternar a visualização de estoque"><Button type="button" size="sm" variant={stockView === "table" ? "default" : "ghost"} onClick={() => setStockView("table")} className={`h-8 rounded-lg px-3 text-xs font-bold ${stockView === "table" ? "bg-[#0c7474] text-white hover:bg-[#063b43]" : "text-[#5d7479]"}`}>Tabela</Button><Button type="button" size="sm" variant={stockView === "kanban" ? "default" : "ghost"} onClick={() => setStockView("kanban")} className={`h-8 rounded-lg px-3 text-xs font-bold ${stockView === "kanban" ? "bg-[#0c7474] text-white hover:bg-[#063b43]" : "text-[#5d7479]"}`}>Kanban</Button></div><p className="text-xs text-[#668087]">Exibindo {filteredStock.length} equipamentos</p><Button type="button" onClick={openNewEpiForm} disabled={!activeCompanyId} className="h-9 rounded-xl bg-[#0c7474] px-3 text-xs font-bold text-white hover:bg-[#063b43]"><Plus className="mr-1.5 h-4 w-4" />Cadastrar EPI</Button></div>
            </div>

            <div className="rounded-2xl border border-[#dcebe8] bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                {stockView === "kanban" && (
                  <div className="grid gap-4 p-4 xl:grid-cols-4">
                    {complianceColumns.map(column => {
                      const items = kanbanItemsByColumn[column.id];
                      return (
                        <section key={column.id} className={`min-h-[310px] rounded-2xl border border-[#dcebe8] bg-[#f8fbfa] p-3 shadow-xs ${column.accent}`}>
                          <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold text-[#102b32]">{column.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${column.badge}`}>{items.length}</span></div>
                          <div className="space-y-3">{items.map((item: any) => <article key={item.id} className="overflow-hidden rounded-xl border border-[#dcebe8] bg-white shadow-sm"><div className="flex gap-3 p-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#e8f6f1] text-[10px] text-[#0c7474]">{item.imageUrl ? <img src={item.imageUrl} alt={`Foto do EPI ${item.name}`} className="h-full w-full object-cover" /> : "EPI"}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#102b32]">{item.name}</p><p className="mt-0.5 text-xs text-[#3173a8]">CA {item.caNumber || "não informado"}</p></div></div><div className="grid grid-cols-2 gap-2 border-y border-[#edf4f1] px-3 py-2 text-[11px] text-[#5d7479]"><span>Estoque <b className="text-[#102b32]">{item.stockQuantity} un.</b></span><span>Validade <b className="text-[#102b32]">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("pt-BR") : "sem data"}</b></span></div><div className="flex items-center justify-between gap-2 p-3"><span className="truncate text-[11px] text-[#668087]">Resp.: <b className="text-[#315158]">{item.responsibleName || "não definido"}</b></span><Button type="button" size="sm" variant="outline" onClick={() => openEditEpiForm(item)} className="h-7 rounded-lg px-2 text-[10px] font-bold text-[#0c7474]">Editar</Button></div><div className="border-t border-[#edf4f1] px-3 py-2">{column.id === "renewal" ? <Button type="button" disabled={updateEpiItemMutation.isPending} onClick={() => setEpiRenewalRequested(item, false)} variant="ghost" className="h-7 w-full text-[10px] font-bold text-[#123f69]">Retomar monitoramento</Button> : <Button type="button" disabled={updateEpiItemMutation.isPending} onClick={() => setEpiRenewalRequested(item, true)} className="h-7 w-full rounded-lg bg-[#123f69] text-[10px] font-bold text-white hover:bg-[#0b2d4d]">Encaminhar para renovar</Button>}</div></article>)}</div>
                  {items.length === 0 && <p className="grid min-h-40 place-items-center rounded-xl border border-dashed border-[#cfe3de] px-4 text-center text-xs text-[#668087]">{column.id === "ready" ? "Tudo regular por aqui — nenhum EPI requer ação imediata." : column.empty}</p>}
                        </section>
                      );
                    })}
                  </div>
                )}
                <table hidden={stockView !== "table"} className="w-full text-left text-xs">
                  <thead className="bg-[#f8fbfa] text-[#668087] border-b border-[#dcebe8]">
                    <tr>
                      <th className="p-4 font-bold">Equipamento (EPI)</th>
                      <th className="p-4 font-bold">CA (Certificado de Aprovação)</th>
                      <th className="p-4 font-bold">Estoque Atual</th>
                      <th className="p-4 font-bold">Estoque Mínimo</th>
                      <th className="p-4 font-bold">Validade CA</th>
                      <th className="p-4 font-bold text-right">Status</th>
                      <th className="p-4 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f5f4]">
                    {filteredStock.map((item: any) => {
                      const isLow = item.stockQuantity <= item.minimumStock;
                      const isCaExpired = item.expiresAt && new Date(item.expiresAt).getTime() <= now;
                      return (
                        <tr key={item.id} className="hover:bg-[#fcfdfd]">
                          <td className="p-4 font-bold text-[#102b32]"><div className="flex items-center gap-3">{item.imageUrl ? <img src={item.imageUrl} alt={`Foto do EPI ${item.name}`} className="h-10 w-10 rounded-lg border border-[#dcebe8] object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e8f6f1] text-[10px] text-[#0c7474]">Sem foto</span>}<span>{item.name}</span></div></td>
                          <td className="p-4 font-mono text-[#3173a8]">CA {item.caNumber}</td>
                          <td className="p-4 font-bold text-[#102b32]">{item.stockQuantity} un.</td>
                          <td className="p-4 text-[#668087]">{item.minimumStock} un.</td>
                          <td className="p-4 text-[#668087]">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("pt-BR") : "Indeterminado"}</td>
                          <td className="p-4 text-right">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#b45309]"><span className="h-2 w-2 rounded-full bg-amber-500" />Atenção</span>
                            ) : isCaExpired ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#b91c1c]"><span className="h-2 w-2 rounded-full bg-rose-600" />Crítico</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#15803d]"><span className="h-2 w-2 rounded-full bg-[#15803d]" />Regular</span>
                            )}
                          </td>
                          <td className="p-4 text-right"><Button type="button" size="sm" variant="outline" onClick={() => openEditEpiForm(item)} className="h-8 rounded-lg border-[#cfe3de] text-[11px] font-bold text-[#0c7474]">Editar</Button></td>
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
                  <Folder className="h-5 w-5 text-[#0c7474]" /> {archiveView === "sectors" ? "Arquivo Setorial de Fichas de EPI" : "Acompanhamento de Fichas por Colaborador"}
                </h3>
                <p className="text-xs text-[#668087]">{archiveView === "sectors" ? "Selecione um setor abaixo para abrir a pasta de arquivos dos colaboradores e verificar fichas e entregas." : "Acompanhe o progresso individual e trate cada pendência diretamente pelo card."}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2"><div className="inline-flex rounded-xl border border-[#cfe3de] bg-[#f8fbfa] p-1"><Button type="button" size="sm" variant={archiveView === "sectors" ? "default" : "ghost"} onClick={() => setArchiveView("sectors")} className={`h-8 rounded-lg px-3 text-xs font-bold ${archiveView === "sectors" ? "bg-[#0c7474] text-white hover:bg-[#063b43]" : "text-[#5d7479]"}`}>Setores</Button><Button type="button" size="sm" variant={archiveView === "employees" ? "default" : "ghost"} onClick={() => setArchiveView("employees")} className={`h-8 rounded-lg px-3 text-xs font-bold ${archiveView === "employees" ? "bg-[#0c7474] text-white hover:bg-[#063b43]" : "text-[#5d7479]"}`}>Colaboradores</Button></div>{archiveView === "sectors" && <Button variant="outline" size="sm" onClick={collapseAllArchiveFolders} className="rounded-xl border-[#dcebe8] text-xs font-bold text-[#5d7479]">Recolher Todas as Pastas</Button>}</div>
            </div>

            {archiveView === "employees" && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-[#dcebe8] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#668087]" /><Input value={folderSearchQuery} onChange={event => setFolderSearchQuery(event.target.value)} placeholder="Buscar por nome do colaborador..." className="h-9 rounded-xl border-[#cfe3de] pl-9 text-xs" /></div><div className="text-xs text-[#668087]">{collaboratorCards.length} colaboradores exibidos</div></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{collaboratorCards.map(card => {
                  const color = card.tone === "emerald" ? "#059669" : card.tone === "rose" ? "#e24a5c" : "#d98716";
                  const actionLabel = card.action === "deliver" ? "Entregar EPI" : card.action === "sign" ? "Assinar ficha" : "Ver fichas";
                  const actionClass = card.tone === "emerald" ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : card.tone === "rose" ? "border-rose-300 text-rose-700 hover:bg-rose-50" : "border-amber-300 text-amber-700 hover:bg-amber-50";
                  const initial = card.employee.fullName.split(" ").filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
                  return <article key={card.employee.id} className={`rounded-2xl border bg-white p-5 text-center shadow-xs ${card.tone === "emerald" ? "border-emerald-100" : card.tone === "rose" ? "border-rose-100" : "border-amber-100"}`}><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8f6f1] text-lg font-bold text-[#0c7474]">{initial}</div><h4 className="mt-3 truncate text-sm font-extrabold text-[#102b32]">{card.employee.fullName}</h4><p className="mt-1 inline-flex rounded-full bg-[#f2f6f5] px-2.5 py-1 text-[11px] font-semibold text-[#5d7479]">{card.department?.name || "Sem setor"}</p><div className="mx-auto mt-4 grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${card.progress * 3.6}deg, #e7efed 0deg)` }}><div className="grid h-20 w-20 place-items-center rounded-full bg-white"><strong className="text-2xl" style={{ color }}>{card.progress}%</strong><span className="-mt-1 text-[10px] text-[#668087]">assinadas</span></div></div><p className={`mt-4 text-xs font-bold ${card.tone === "emerald" ? "text-emerald-700" : card.tone === "rose" ? "text-rose-700" : "text-amber-700"}`}>{card.action === "deliver" ? "Nenhuma ficha gerada" : card.pendingCount > 0 ? `${card.pendingCount} ficha${card.pendingCount > 1 ? "s" : ""} pendente${card.pendingCount > 1 ? "s" : ""}` : `${card.signedCount} ficha${card.signedCount !== 1 ? "s" : ""} em dia`}</p><Button type="button" variant="outline" onClick={() => handleCollaboratorCardAction(card)} className={`mt-4 h-9 w-full rounded-xl text-xs font-bold ${actionClass}`}>{actionLabel}</Button></article>;
                })}</div>
                {collaboratorCards.length === 0 && <p className="rounded-2xl border border-dashed border-[#cfe3de] bg-white px-6 py-12 text-center text-sm text-[#668087]">Nenhum colaborador encontrado com os filtros atuais.</p>}
              </section>
            )}

            {/* Armário de Pastas por Setor */}
            <div hidden={archiveView !== "sectors"} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departments.map((dept: any) => {
                const isOpen = selectedFolderSectorId === dept.id;
                const deptEmployees = employees.filter((e: any) => e.departmentId === dept.id);
                  const pendingCount = deliveries.filter((d: any) => {
                    const emp = employees.find((e: any) => e.id === d.employeeId);
                    return emp?.departmentId === dept.id && !isDeliverySigned(d);
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
            {archiveView === "sectors" && selectedFolderSectorId !== null && (
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
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={profileDepartmentFilter} onChange={event => setProfileDepartmentFilter(Number(event.target.value))} className="h-9 rounded-xl border border-[#cfe3de] bg-white px-2 text-[11px] font-semibold text-[#315158]">
                      <option value={0}>Todos os setores</option>
                      {departments.map((department: any) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                    <select value={profileRoleFilter} onChange={event => setProfileRoleFilter(Number(event.target.value))} className="h-9 rounded-xl border border-[#cfe3de] bg-white px-2 text-[11px] font-semibold text-[#315158]">
                      <option value={0}>Todas as funções</option>
                      {jobRoles.map((role: any) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
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
                      onClick={collapseAllArchiveFolders}
                      className="rounded-xl border-[#dcebe8] text-xs font-bold text-[#5d7479]"
                    >
                      Fechar Gaveta
                    </Button>
                  </div>
                </div>

                {/* Colaboradores da Pasta */}
                <div className="space-y-4">
                  {profileEmployees
                    .filter((e: any) => e.departmentId === selectedFolderSectorId)
                    .filter((e: any) => e.fullName.toLowerCase().includes(folderSearchQuery.toLowerCase()))
                    .map((emp: any) => {
                      const employee = emp;
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
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0c7474] border border-[#cfe3de]">
                                {empDeliveries.length} EPIs entregues
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                aria-busy={openingArchiveEmployeeId === employee.id}
                                onClick={() => {
                                  if (expandedArchiveEmployeeId === employee.id) {
                                    setExpandedArchiveEmployeeId(0);
                                    return;
                                  }
                                  setOpeningArchiveEmployeeId(employee.id);
                                  window.setTimeout(() => {
                                    setOpeningArchiveEmployeeId(0);
                                    setExpandedArchiveEmployeeId(employee.id);
                                    document.getElementById(`epi-archive-file-${employee.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }, 220);
                                }}
                                className="h-8 rounded-lg bg-[#0c7474] px-3 text-[11px] font-bold text-white"
                              >
                                {openingArchiveEmployeeId === employee.id ? "Abrindo arquivo..." : expandedArchiveEmployeeId === employee.id ? "Fechar gaveta" : "Abrir ficha"}
                              </Button>
                              <Button type="button" size="sm" onClick={() => { setDeliveryEmployeeId(employee.id); setDeliveryEpiItemId(0); setIsDeliveryModalOpen(true); }} className="h-8 rounded-lg bg-[#3173a8] px-3 text-[11px] font-bold text-white hover:bg-[#235882]">
                                <Plus className="mr-1 h-3.5 w-3.5" /> Registrar entrega
                              </Button>
                            </div>
                          </div>

                          {/* Histórico de Entregas do Colaborador */}
                          {expandedArchiveEmployeeId === emp.id && <div id={`epi-archive-file-${employee.id}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                            {empDeliveries.map((d: any) => (
                              <div key={d.id} className="rounded-xl border border-[#cfe3de] bg-white p-3 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <b className="text-[#102b32]">{epiNameById.get(d.epiItemId) || "Equipamento"}</b>
                                  {isDeliverySigned(d) ? (
                                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">Assinado</span>
                                  ) : (
                                    <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">Pendente</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#668087]">Qtde: {d.quantity} un. • {new Date(d.deliveredAt).toLocaleDateString("pt-BR")}</p>
                                {evidenceByDeliveryId.get(d.id) && <p className={`text-[10px] font-bold ${evidenceByDeliveryId.get(d.id)?.status === "confirmed" ? "text-emerald-700" : "text-[#3173a8]"}`}>{evidenceByDeliveryId.get(d.id)?.status === "confirmed" ? "OTP confirmado e auditável" : `Evidência OTP: ${evidenceByDeliveryId.get(d.id)?.status}`}</p>}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  {!isDeliverySigned(d) ? <>
                                    <Button size="sm" disabled={sendEpiEvidenceMutation.isPending} onClick={() => sendOtpConfirmation(d)} className="h-7 flex-1 rounded-lg bg-[#0c7474] text-white text-[11px] font-bold hover:bg-[#063b43]">
                                      <MailCheck className="h-3 w-3 mr-1" /> {evidenceByDeliveryId.get(d.id) ? "Reenviar OTP" : "Enviar OTP"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openSignatureDialog(d)} className="h-7 rounded-lg border-[#cfe3de] text-[11px] font-bold text-[#668087]" title="Contingência: ciência eletrônica interna">
                                      <QrCode className="h-3 w-3" />
                                    </Button>
                                  </> : null}
                                  <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(d)} className="h-7 flex-1 rounded-lg border-[#cfe3de] text-[11px] font-bold text-[#3173a8]">
                                    <Download className="mr-1 h-3 w-3" /> Exportar ficha PDF
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {empDeliveries.length === 0 && (
                              <p className="text-xs text-[#668087] py-2">Nenhum EPI entregue a este colaborador ainda.</p>
                            )}
                          </div>}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Central de Evidências NR-06 */}
        {currentTab === "evidence" && <section className="space-y-5"><div className="rounded-3xl border border-[#b9e3d7] bg-[linear-gradient(135deg,#f3fffb,#edf8f6)] p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Central de evidências NR-06</p><h3 className="mt-1 text-xl font-bold text-[#102b32]">Comprovação auditável por empresa</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[#4e6e73]">Cada confirmação é salva de forma isolada por ambiente e empresa. A ficha congelada, seu hash, o link verificável, o QR Code e os eventos encadeados ficam disponíveis nesta central para consulta do responsável e apresentação em auditoria.</p></div><div className="rounded-2xl border border-[#b9e3d7] bg-white px-4 py-3 text-xs text-[#315158]"><strong className="block text-[#0c7474]">Local de guarda</strong><span className="mt-1 block">Evidência: <code>epi_delivery_evidence</code></span><span className="mt-1 block">Trilha: <code>epi_delivery_audit_events</code></span></div></div></div><div className="overflow-hidden rounded-3xl border border-[#dcebe8] bg-white shadow-xs"><div className="flex items-center justify-between border-b border-[#edf4f1] px-5 py-4"><div><h4 className="font-bold text-[#102b32]">Fichas com confirmação por e-mail</h4><p className="mt-1 text-xs text-[#668087]">Empresa em foco: {currentCompany?.name ?? "Não selecionada"}</p></div><span className="rounded-full bg-[#e8f6f1] px-3 py-1 text-xs font-bold text-[#0c7474]">{evidenceList.data?.items?.length ?? 0} evidência(s)</span></div>{evidenceList.isLoading ? <div className="grid min-h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#0c7474]" /></div> : evidenceList.data?.items?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-[#f8fbfa] text-[#668087]"><tr><th className="px-5 py-3 font-bold">Trabalhador / EPI</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 font-bold">Documento</th><th className="px-5 py-3 font-bold">Envio / confirmação</th><th className="px-5 py-3 text-right font-bold">Auditoria</th></tr></thead><tbody className="divide-y divide-[#edf4f1]">{evidenceList.data.items.map((item: any) => <tr key={item.evidence.id} className="hover:bg-[#fcfefd]"><td className="px-5 py-4"><strong className="block text-[#17383e]">{item.employeeName}</strong><span className="mt-1 block text-[#668087]">{item.epiName} · ficha #{item.evidence.deliveryId}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.evidence.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : item.evidence.status === "failed" || item.evidence.status === "expired" || item.evidence.status === "revoked" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"}`}>{item.evidence.status === "confirmed" ? "Confirmado por OTP" : item.evidence.status === "sent" ? "OTP enviado" : item.evidence.status === "viewed" ? "Ficha visualizada" : item.evidence.status}</span></td><td className="px-5 py-4 font-mono text-[10px] text-[#506c71]">{item.evidence.documentHash.slice(0, 20)}…</td><td className="px-5 py-4 text-[#668087]"><span className="block">Envio: {item.evidence.lastSentAt ? new Date(item.evidence.lastSentAt).toLocaleString("pt-BR") : "não enviado"}</span><span className="block">Confirmação: {item.evidence.confirmedAt ? new Date(item.evidence.confirmedAt).toLocaleString("pt-BR") : "pendente"}</span></td><td className="px-5 py-4 text-right"><Button size="sm" onClick={() => setSelectedEvidenceDeliveryId(item.evidence.deliveryId)} className="h-8 rounded-lg bg-[#0c7474] text-[11px] font-bold text-white"><Eye className="mr-1 h-3.5 w-3.5" /> Ver trilha</Button></td></tr>)}</tbody></table></div> : <div className="px-6 py-14 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-[#93b9b1]" /><h4 className="mt-3 font-bold text-[#315158]">Nenhuma evidência por OTP nesta empresa</h4><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#668087]">Registre a entrega, cadastre o e-mail do trabalhador e use “Enviar OTP” no arquivo de fichas. A primeira tentativa cria a evidência imutável e sua trilha de auditoria.</p></div>}</div></section>}

        {/* Aba Funcionários */}
        {currentTab === "employees" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-[#dcebe8] shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#102b32]">Colaboradores Cadastrados</h3>
                <p className="text-xs text-[#668087]">Lista completa de funcionários da empresa ativa com suas respectivas fichas de EPI.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#dcebe8] bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fbfa] text-[#668087] border-b border-[#dcebe8]">
                    <tr>
                      <th className="p-4 font-bold">Colaborador</th>
                      <th className="p-4 font-bold">CPF</th>
                      <th className="p-4 font-bold">E-mail OTP</th>
                      <th className="p-4 font-bold">Setor</th>
                      <th className="p-4 font-bold">Função / Cargo</th>
                      <th className="p-4 font-bold text-right">Fichas de EPI</th>
                      <th className="p-4 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f5f4]">
                    {employees.map((emp: any) => {
                      const empDeliveries = deliveries.filter((d: any) => d.employeeId === emp.id);
                      const deptName = departments.find((d: any) => d.id === emp.departmentId)?.name || "Geral";
                      const roleName = jobRoles.find((r: any) => r.id === emp.jobRoleId)?.name || "Colaborador";
                      const deliveryForOtp = [...empDeliveries].filter((delivery: any) => !isDeliverySigned(delivery)).sort((a: any, b: any) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime())[0] ?? null;
                      const deliveryEvidence = deliveryForOtp ? evidenceByDeliveryId.get(deliveryForOtp.id) : null;
                      const otpActionLabel = !emp.email ? "E-mail necessário" : !deliveryForOtp ? empDeliveries.length ? "Ficha confirmada" : "Sem ficha de EPI" : deliveryEvidence ? "Reenviar OTP" : "Enviar confirmação";
                      return (
                        <tr key={emp.id} className="hover:bg-[#fcfdfd]">
                          <td className="p-4 font-bold text-[#102b32] flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#0c7474] font-bold">
                              {emp.fullName.slice(0, 2).toUpperCase()}
                            </span>
                            {emp.fullName}
                          </td>
                          <td className="p-4 font-mono text-[#668087]">{emp.cpf || "Não informado"}</td>
                          <td className={`p-4 text-xs ${emp.email ? "text-[#0c7474]" : "text-[#a85a16]"}`}>{emp.email || "Não cadastrado"}</td>
                          <td className="p-4 text-[#668087]">{deptName}</td>
                          <td className="p-4 text-[#668087]">{roleName}</td>
                          <td className="p-4 text-right font-bold text-[#0c7474]">{empDeliveries.length} entregas</td>
                          <td className="p-4 text-right"><div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={updateEmployeeEmailMutation.isPending} onClick={() => updateEmployeeOtpEmail(emp)} className="h-8 rounded-lg border-[#cfe3de] text-[11px] font-bold text-[#0c7474]"><MailCheck className="mr-1 h-3.5 w-3.5" /> {emp.email ? "Editar e-mail" : "Cadastrar e-mail"}</Button><Button type="button" size="sm" variant="outline" title={!emp.email ? "Cadastre o e-mail do colaborador antes de enviar a confirmação" : !deliveryForOtp ? "Não há ficha pendente de confirmação" : "Enviar a confirmação da ficha pendente mais recente"} disabled={sendEpiEvidenceMutation.isPending || !emp.email || !deliveryForOtp} onClick={() => deliveryForOtp && sendOtpConfirmation(deliveryForOtp)} className="h-8 rounded-lg border-[#9fcfc5] bg-[#f3fbf8] text-[11px] font-bold text-[#087f78] hover:bg-[#e4f6f0] disabled:cursor-not-allowed disabled:opacity-50"><MailCheck className="mr-1 h-3.5 w-3.5" /> {otpActionLabel}</Button><Button type="button" size="sm" onClick={() => { setDeliveryEmployeeId(emp.id); setDeliveryEpiItemId(0); setIsDeliveryModalOpen(true); }} className="h-8 rounded-lg bg-[#3173a8] text-[11px] font-bold text-white hover:bg-[#235882]"><Plus className="mr-1 h-3.5 w-3.5" /> Entregar EPI</Button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </ModulePage>

      {selectedEvidenceDeliveryId > 0 && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"><section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-[#e4efed] pb-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Dossiê de evidência NR-06</p><h3 className="mt-1 text-xl font-bold text-[#102b32]">Trilha verificável de recebimento</h3></div><Button variant="ghost" size="icon" onClick={() => setSelectedEvidenceDeliveryId(0)}><X className="h-5 w-5" /></Button></div>{selectedEvidence.isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0c7474]" /></div> : selectedEvidence.data ? <div className="mt-5 space-y-5"><div className="grid gap-4 md:grid-cols-[1fr_180px]"><div className="rounded-2xl border border-[#dcebe8] bg-[#f8fbfa] p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#0c7474]">Integridade da ficha</p><p className="mt-2 break-all font-mono text-xs text-[#315158]">SHA-256: {selectedEvidence.data.evidence.documentHash}</p><p className="mt-3 text-sm text-[#668087]">Status: <strong className="text-[#17383e]">{selectedEvidence.data.evidence.status}</strong> · Confirmação: {selectedEvidence.data.evidence.confirmedAt ? new Date(selectedEvidence.data.evidence.confirmedAt).toLocaleString("pt-BR") : "pendente"}</p><a href={selectedEvidence.data.verificationUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-[#0c7474] underline">Abrir página de verificação</a></div><div className="rounded-2xl border border-[#dcebe8] bg-white p-3 text-center"><img src={selectedEvidence.data.qrCodeDataUrl} alt="QR Code de verificação da ficha" className="mx-auto h-36 w-36" /><p className="mt-2 text-[10px] leading-4 text-[#668087]">QR Code verifica a ficha congelada com o link individual.</p></div></div><section><h4 className="font-bold text-[#17383e]">Linha do tempo imutável</h4><div className="mt-3 space-y-3 border-l-2 border-[#b9e3d7] pl-4">{selectedEvidence.data.events.map((event: any) => <div key={event.id} className="relative rounded-xl border border-[#e0eeeb] bg-white p-3"><span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full bg-[#0c7474] ring-4 ring-[#effaf7]" /><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[#23454b]">{event.description}</strong><time className="text-xs text-[#668087]">{new Date(event.createdAt).toLocaleString("pt-BR")}</time></div><p className="mt-1 break-all font-mono text-[10px] text-[#78948f]">Hash: {event.eventHash}</p></div>)}</div></section></div> : <p className="py-10 text-center text-sm text-[#668087]">Não foi possível carregar este dossiê.</p>}</section></div>}

      {/* Modal de ciência eletrônica interna via QR Code */}
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
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0c8c89]">Registro presencial complementar</p>
                  <h4 className="text-sm font-bold text-[#102b32]">Ciência da entrega de EPI</h4>
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
                  <section className="rounded-xl border border-[#b9e3d7] bg-[#f4fbf8] p-4">
                    <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0c7474] shadow-sm"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-xs font-bold text-[#17383e]">Ciência presencial registrada no dispositivo do responsável</p><p className="mt-1 text-[11px] leading-5 text-[#668087]">Este aceite é complementar e confirma que a ficha física e as orientações foram apresentadas ao trabalhador.</p></div></div>
                    <div className="mt-3 rounded-lg border border-[#d5e8e2] bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#0c7474]">Comprovação principal</p><p className="mt-1 text-[11px] leading-5 text-[#4d6a70]">Mantenha a ficha física assinada e envie também a confirmação por e-mail OTP. O OTP gera o link verificável, o hash da ficha e a trilha auditável.</p></div>
                  </section>
                  <label className="block text-xs font-bold text-[#315158]">Nome do trabalhador que prestou ciência presencial<Input value={signatureName} onChange={event => setSignatureName(event.target.value)} className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label>
                  <Button 
                    disabled={isSigningQr || signEpiDeliveryMutation.isPending || signatureName.trim().length < 2}
                    onClick={handleMobileSign}
                    className="w-full rounded-xl bg-[#0c7474] text-white py-3 font-bold text-sm hover:bg-[#063b43] shadow-lg shadow-[#0c7474]/20 flex items-center justify-center gap-2"
                  >
                    {isSigningQr ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processando aceite...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Registrar ciência presencial
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
                    <h5 className="text-base font-bold text-[#102b32]">Ciência registrada!</h5>
                    <p className="mt-1 text-xs text-[#5d7479]">O aceite eletrônico interno foi registrado na ficha do trabalhador.</p>
                  </div>
                  <div className="pt-2 space-y-2">
                    <Button 
                      onClick={() => handleDownloadReceipt(activeQrDelivery)}
                      className="w-full rounded-xl bg-[#3173a8] text-white py-2.5 font-bold text-xs hover:bg-[#235882] flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Baixar comprovante interno (PDF)
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

      {isEpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#edf4f1] pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0c8c89]">Estoque da empresa</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">{editingEpiId ? "Editar EPI" : "Cadastrar EPI"}</h4><p className="mt-1 text-xs text-[#668087]">Empresa: <strong>{currentCompany?.name || "não selecionada"}</strong></p></div><button type="button" onClick={() => setIsEpiModalOpen(false)} className="rounded-full p-2 text-[#668087] hover:bg-[#f2faf8]"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2 flex flex-col gap-3 rounded-2xl border border-[#dcebe8] bg-[#f8fbfa] p-4 sm:flex-row sm:items-center"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#cfe3de] bg-white text-center text-[10px] text-[#668087]">{newEpiImageUrl ? <img src={newEpiImageUrl} alt="Prévia da foto do EPI" className="h-full w-full object-cover" /> : "Sem foto"}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#315158]">Foto do EPI</p><p className="mt-1 text-[11px] leading-4 text-[#668087]">PNG, JPEG ou WEBP de até 10 MB. A foto será vinculada apenas a este EPI.</p><div className="mt-2 flex flex-wrap items-center gap-2"><Input type="file" accept="image/png,image/jpeg,image/webp" disabled={isUploadingEpiImage} onChange={event => handleEpiImageUpload(event.target.files?.[0])} className="h-9 max-w-[220px] cursor-pointer text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-[#e8f6f1] file:px-2 file:py-1 file:text-xs file:font-bold file:text-[#0c7474]" />{isUploadingEpiImage && <Loader2 className="h-4 w-4 animate-spin text-[#0c7474]" />}{newEpiImageUrl && <Button type="button" variant="ghost" onClick={() => setNewEpiImageUrl("")} className="h-8 px-2 text-xs text-[#b85c36]">Remover foto</Button>}</div></div></div><label className="text-xs font-bold text-[#315158] sm:col-span-2">Nome do EPI *<Input value={newEpiName} onChange={event => setNewEpiName(event.target.value)} placeholder="Ex.: Capacete de segurança" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158] sm:col-span-2">Responsável pelo CA<Input value={newEpiResponsibleName} onChange={event => setNewEpiResponsibleName(event.target.value)} placeholder="Ex.: Ana Martins" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Número do CA<Input value={newEpiCaNumber} onChange={event => setNewEpiCaNumber(event.target.value)} placeholder="Ex.: 12345" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Fabricante ou importador<Input value={newEpiManufacturer} onChange={event => setNewEpiManufacturer(event.target.value)} placeholder="Ex.: Marca do fabricante" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Lote de fabricação *<Input value={newEpiLotNumber} onChange={event => setNewEpiLotNumber(event.target.value)} placeholder="Ex.: L-2026-001" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Quantidade em estoque *<Input value={newEpiStockQuantity} onChange={event => setNewEpiStockQuantity(event.target.value)} type="number" min="0" inputMode="numeric" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Estoque mínimo *<Input value={newEpiMinimumStock} onChange={event => setNewEpiMinimumStock(event.target.value)} type="number" min="0" inputMode="numeric" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Validade do CA<Input value={newEpiExpiresAt} onChange={event => setNewEpiExpiresAt(event.target.value)} type="date" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Validade do equipamento<Input value={newEpiEquipmentExpiresAt} onChange={event => setNewEpiEquipmentExpiresAt(event.target.value)} type="date" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158] sm:col-span-2">Proteção oferecida *<Textarea value={newEpiProtectionDescription} onChange={event => setNewEpiProtectionDescription(event.target.value)} rows={2} placeholder="Ex.: Proteção contra impacto de partículas volantes." className="mt-1.5 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158] sm:col-span-2">Limitações de proteção<Textarea value={newEpiLimitations} onChange={event => setNewEpiLimitations(event.target.value)} rows={2} placeholder="Condições em que este EPI não deve ser usado ou não protege." className="mt-1.5 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158] sm:col-span-2">Cuidados, guarda e conservação *<Textarea value={newEpiCareInstructions} onChange={event => setNewEpiCareInstructions(event.target.value)} rows={3} placeholder="Uso, ajuste, limpeza, higienização, guarda, manutenção e critérios de substituição." className="mt-1.5 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158] sm:col-span-2">Link do manual (opcional)<Input value={newEpiManualUrl} onChange={event => setNewEpiManualUrl(event.target.value)} type="url" placeholder="https://..." className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="sm:col-span-2 flex cursor-pointer items-center gap-2 rounded-xl border border-[#cfe3de] bg-[#f8fbfa] px-3 py-2 text-xs font-bold text-[#315158]"><input type="checkbox" checked={newEpiRequiresTraining} onChange={event => setNewEpiRequiresTraining(event.target.checked)} className="h-4 w-4 accent-[#123f69]" />Este EPI exige treinamento específico antes da entrega</label><label className="sm:col-span-2 flex cursor-pointer items-center gap-2 rounded-xl border border-[#cfe3de] bg-[#f8fbfa] px-3 py-2 text-xs font-bold text-[#315158]"><input type="checkbox" checked={newEpiRenewalRequested} onChange={event => setNewEpiRenewalRequested(event.target.checked)} className="h-4 w-4 accent-[#123f69]" />Encaminhar este CA para renovação</label></div>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsEpiModalOpen(false)} className="rounded-xl border-[#dcebe8]">Cancelar</Button><Button type="button" disabled={createEpiItemMutation.isPending || updateEpiItemMutation.isPending || isUploadingEpiImage || !newEpiName.trim() || !newEpiCaNumber.trim() || !newEpiManufacturer.trim() || !newEpiLotNumber.trim() || !newEpiProtectionDescription.trim() || !newEpiCareInstructions.trim() || !newEpiExpiresAt || !activeCompanyId} onClick={() => { const quantity = Number(newEpiStockQuantity); const minimum = Number(newEpiMinimumStock); if (!Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(minimum) || minimum < 0) { toast.error("Informe quantidades inteiras iguais ou maiores que zero."); return; } const values = { workspaceId, companyId: activeCompanyId, name: newEpiName.trim(), imageUrl: newEpiImageUrl || null, responsibleName: newEpiResponsibleName.trim() || null, renewalRequested: newEpiRenewalRequested, caNumber: newEpiCaNumber.trim() || null, manufacturer: newEpiManufacturer.trim() || null, lotNumber: newEpiLotNumber.trim() || null, caExpiresAt: newEpiExpiresAt ? new Date(`${newEpiExpiresAt}T12:00:00`) : null, equipmentExpiresAt: newEpiEquipmentExpiresAt ? new Date(`${newEpiEquipmentExpiresAt}T12:00:00`) : null, protectionDescription: newEpiProtectionDescription.trim() || null, limitations: newEpiLimitations.trim() || null, careInstructions: newEpiCareInstructions.trim() || null, manualUrl: newEpiManualUrl.trim() || null, requiresTraining: newEpiRequiresTraining, stockQuantity: quantity, minimumStock: minimum, expiresAt: newEpiExpiresAt ? new Date(`${newEpiExpiresAt}T12:00:00`) : null }; if (editingEpiId) updateEpiItemMutation.mutate({ ...values, epiItemId: editingEpiId }); else createEpiItemMutation.mutate(values); }} className="rounded-xl bg-[#0c7474] text-white hover:bg-[#063b43]">{createEpiItemMutation.isPending || updateEpiItemMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}{editingEpiId ? "Salvar alterações" : "Salvar no estoque"}</Button></div>
          </div>
        </div>
      )}

      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-[#dcebe8] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-[#edf4f1] pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3173a8]">Ficha de EPI</p><h4 className="mt-1 text-lg font-bold text-[#102b32]">Registrar entrega</h4><p className="mt-1 text-xs text-[#668087]">A entrega cria uma ficha individual exportável para o colaborador.</p></div><button type="button" onClick={() => setIsDeliveryModalOpen(false)} className="rounded-full p-2 text-[#668087] hover:bg-[#f2faf8]"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#315158] sm:col-span-2">Funcionário *<select value={deliveryEmployeeId} onChange={event => { setDeliveryEmployeeId(Number(event.target.value)); setDeliverySourceId(0); }} className="mt-1.5 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecione o funcionário</option>{employees.map((employee: any) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select></label><label className="text-xs font-bold text-[#315158] sm:col-span-2">EPI em estoque *<select value={deliveryEpiItemId} onChange={event => { setDeliveryEpiItemId(Number(event.target.value)); setDeliverySourceId(0); setDeliveryTrainingCompletedAt(""); }} className="mt-1.5 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecione o EPI</option>{stockItems.filter((item: any) => item.stockQuantity > 0).map((item: any) => <option key={item.id} value={item.id}>{item.name} · CA {item.caNumber || "Pendente"} · lote {item.lotNumber || "Pendente"} · {item.stockQuantity} disponível(is)</option>)}</select></label>{deliveryEpiItemId > 0 && (() => { const item = epiById.get(deliveryEpiItemId); return item ? <section className="sm:col-span-2 rounded-2xl border border-[#dcebe8] bg-[#f7fcfa] p-3 text-xs text-[#47636a]"><p className="font-bold text-[#315158]">Conferência NR-06 do item</p><p className="mt-1">CA {item.caNumber || "não informado"} · fabricante/importador {item.manufacturer || "não informado"} · lote {item.lotNumber || "não informado"}</p><p className="mt-1">Proteção: {item.protectionDescription || "não informada"}</p>{item.limitations && <p className="mt-1">Limitações: {item.limitations}</p>}</section> : null; })()}<label className="text-xs font-bold text-[#315158]">Quantidade *<Input value={deliveryQuantity} onChange={event => setDeliveryQuantity(event.target.value)} type="number" min="1" inputMode="numeric" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158]">Tipo de entrega<select value={deliveryKind} onChange={event => { const kind = event.target.value as "initial" | "replacement"; setDeliveryKind(kind); setDeliveryReason(kind === "initial" ? "initial" : "scheduled_replacement"); if (kind === "initial") setDeliverySourceId(0); }} className="mt-1.5 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value="initial">Entrega inicial</option><option value="replacement">Reposição</option></select></label>{deliveryKind === "replacement" && <><label className="text-xs font-bold text-[#315158]">Motivo da reposição<select value={deliveryReason} onChange={event => setDeliveryReason(event.target.value as typeof deliveryReason)} className="mt-1.5 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value="scheduled_replacement">Troca programada</option><option value="damage">Dano</option><option value="loss">Extravio</option><option value="expiry">Validade</option><option value="hygiene">Higienização</option><option value="other">Outro</option></select></label><label className="text-xs font-bold text-[#315158]">Entrega substituída *<select value={deliverySourceId} onChange={event => setDeliverySourceId(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecione a ficha anterior</option>{deliveries.filter((delivery: any) => delivery.employeeId === deliveryEmployeeId && delivery.epiItemId === deliveryEpiItemId && delivery.returnStatus === "delivered").map((delivery: any) => <option key={delivery.id} value={delivery.id}>Ficha #{delivery.id} · {new Date(delivery.deliveredAt).toLocaleDateString("pt-BR")}</option>)}</select></label></>}<label className="text-xs font-bold text-[#315158]">Condição na entrega<select value={deliveryCondition} onChange={event => setDeliveryCondition(event.target.value as typeof deliveryCondition)} className="mt-1.5 h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value="new">Novo</option><option value="sanitized">Higienizado</option><option value="inspected">Inspecionado</option></select></label><label className="text-xs font-bold text-[#315158]">Data da entrega *<Input value={deliveryDate} onChange={event => setDeliveryDate(event.target.value)} type="date" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label><label className="text-xs font-bold text-[#315158] sm:col-span-2">Responsável pela entrega *<Input value={deliveryDeliveredByName} onChange={event => setDeliveryDeliveredByName(event.target.value)} placeholder="Nome de quem realizou a entrega" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /></label>{epiById.get(deliveryEpiItemId)?.requiresTraining && <label className="text-xs font-bold text-[#315158] sm:col-span-2">Data do treinamento específico *<Input value={deliveryTrainingCompletedAt} onChange={event => setDeliveryTrainingCompletedAt(event.target.value)} type="date" className="mt-1.5 h-10 rounded-xl border-[#cfe3de]" /><span className="mt-1 block text-[11px] font-normal text-[#a85a16]">Este item foi cadastrado como EPI que exige treinamento específico.</span></label>}<section className="sm:col-span-2 rounded-2xl border border-[#b9e3d7] bg-[#f7fcfa] p-4"><p className="text-xs font-bold text-[#315158]">Orientação obrigatória na entrega</p><p className="mt-1 text-[11px] leading-5 text-[#668087]">Confirme que foram explicados proteção e limitações, uso e ajuste, manutenção e substituição, limpeza, higienização, guarda e conservação.</p><label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-bold text-[#0c7474]"><input type="checkbox" checked={deliveryOrientationConfirmed} onChange={event => setDeliveryOrientationConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0c7474]" />A orientação foi prestada ao trabalhador antes do registro desta entrega.</label></section><label className="text-xs font-bold text-[#315158] sm:col-span-2">Observações<Textarea value={deliveryNotes} onChange={event => setDeliveryNotes(event.target.value)} rows={3} placeholder="Uso previsto, ajuste realizado, troca programada ou fato relevante." className="mt-1.5 rounded-xl border-[#cfe3de]" /></label></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsDeliveryModalOpen(false)} className="rounded-xl border-[#dcebe8]">Cancelar</Button><Button type="button" disabled={createEpiDeliveryMutation.isPending || !deliveryEmployeeId || !deliveryEpiItemId || !deliveryOrientationConfirmed || !deliveryDeliveredByName.trim() || (deliveryKind === "replacement" && !deliverySourceId) || Boolean(epiById.get(deliveryEpiItemId)?.requiresTraining && !deliveryTrainingCompletedAt)} onClick={() => { const quantity = Number(deliveryQuantity); const item = epiById.get(deliveryEpiItemId); if (!Number.isInteger(quantity) || quantity < 1) { toast.error("Informe uma quantidade inteira maior que zero."); return; } if (!item || item.stockQuantity < quantity) { toast.error("O estoque disponível não atende a quantidade informada."); return; } const orientationTopics = `Proteção: ${item.protectionDescription || "conforme manual"}. Limitações: ${item.limitations || "conforme manual"}. Uso, ajuste, manutenção, substituição, limpeza, higienização, guarda e conservação: ${item.careInstructions || "conforme manual"}.`; createEpiDeliveryMutation.mutate({ workspaceId, companyId: activeCompanyId, employeeId: deliveryEmployeeId, epiItemId: deliveryEpiItemId, quantity, deliveryKind, deliveryReason, sourceDeliveryId: deliverySourceId || null, deliveredAt: new Date(`${deliveryDate}T12:00:00`), conditionAtDelivery: deliveryCondition, orientationTopics, orientationConfirmed: true, trainingRequired: Boolean(item.requiresTraining), trainingCompletedAt: deliveryTrainingCompletedAt ? new Date(`${deliveryTrainingCompletedAt}T12:00:00`) : null, deliveredByName: deliveryDeliveredByName.trim(), notes: deliveryNotes.trim() || null }); }} className="rounded-xl bg-[#3173a8] text-white hover:bg-[#235882]">{createEpiDeliveryMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}Criar ficha de EPI</Button></div></div>
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
                <label className="text-xs font-bold text-[#23454b]">E-mail para confirmação de EPI</label>
                <Input
                  value={newEmployeeEmail}
                  onChange={e => setNewEmployeeEmail(e.target.value)}
                  type="email"
                  placeholder="Ex.: trabalhador@empresa.com.br"
                  className="rounded-xl border-[#cfe3de] h-10 text-xs"
                />
                <p className="text-[11px] leading-4 text-[#668087]">Usado somente para enviar o código de confirmação do recebimento de EPI.</p>
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
                  disabled={createEmployeeMutation.isPending || newEmployeeName.trim().length < 2 || Boolean(newEmployeeEmail.trim() && !/^\S+@\S+\.\S+$/.test(newEmployeeEmail.trim()))}
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
                      email: newEmployeeEmail.trim() || null,
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
