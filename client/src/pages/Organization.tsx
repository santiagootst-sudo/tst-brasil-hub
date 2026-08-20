import { BriefcaseBusiness, Building2, CircleAlert, Layers3, Loader2, Plus, UserRoundPlus, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ModuleHeader, ModulePage } from "@/components/ModulePageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { workspaceIdFromSearch } from "@shared/workspaceContext";

export default function Organization() {
  const search = useSearch();
  const workspaceId = workspaceIdFromSearch(search) ?? 0;
  const utils = trpc.useUtils();
  const workspace = trpc.portal.workspace.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const organization = trpc.portal.organization.useQuery({ workspaceId }, { enabled: workspaceId > 0 });
  const [companyId, setCompanyId] = useState(0);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleDepartmentId, setRoleDepartmentId] = useState(0);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeDepartmentId, setEmployeeDepartmentId] = useState(0);
  const [employeeRoleId, setEmployeeRoleId] = useState(0);

  const refresh = async () => {
    await Promise.all([utils.portal.organization.invalidate({ workspaceId }), utils.portal.workspace.invalidate({ workspaceId })]);
  };
  const createDepartment = trpc.portal.createDepartment.useMutation({ onSuccess: async () => { setDepartmentName(""); setDepartmentDescription(""); await refresh(); toast.success("Setor registrado."); }, onError: error => toast.error(error.message) });
  const createRole = trpc.portal.createJobRole.useMutation({ onSuccess: async () => { setRoleName(""); setRoleDescription(""); setRoleDepartmentId(0); await refresh(); toast.success("Função registrada."); }, onError: error => toast.error(error.message) });
  const createEmployee = trpc.portal.createEmployee.useMutation({ onSuccess: async () => { setEmployeeName(""); setEmployeeEmail(""); setEmployeeDepartmentId(0); setEmployeeRoleId(0); await refresh(); toast.success("Pessoa registrada."); }, onError: error => toast.error(error.message) });

  if (workspace.isLoading || organization.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#0c7474]" /></div>;
  if (!workspaceId || !workspace.data) return <DashboardLayout title="Estrutura e equipe"><div className="rounded-3xl border border-dashed border-[#bddbd5] bg-white p-10 text-center"><CircleAlert className="mx-auto h-9 w-9 text-[#e98766]" /><h2 className="mt-4 text-2xl font-bold">Selecione um ambiente para organizar a estrutura.</h2><Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Escolher ambiente</Link></div></DashboardLayout>;

  const current = workspace.data;
  const canManage = current.role === "owner" || current.role === "manager";
  const companies = current.companies;
  const currentCompanyId = companyId || companies[0]?.id || 0;
  const currentCompany = companies.find(company => company.id === currentCompanyId);
  const departments = (organization.data?.departments ?? []).filter(item => item.companyId === currentCompanyId);
  const jobRoles = (organization.data?.jobRoles ?? []).filter(item => item.companyId === currentCompanyId);
  const employees = (organization.data?.employees ?? []).filter(item => item.companyId === currentCompanyId);
  const departmentNameById = new Map(departments.map(item => [item.id, item.name]));
  const roleNameById = new Map(jobRoles.map(item => [item.id, item.name]));
  const modulePurpose = current.kind === "autonomo"
    ? "Use esta base para estruturar cada cliente atendido: setores, funções e pessoas alimentam PGR, CIPA, EPIs, treinamentos, inspeções e documentos vinculados."
    : "Use esta base para organizar a operação interna: setores, funções e pessoas alimentam EPIs, treinamentos, inspeções, CIPA, exames e indicadores da empresa.";

  return <DashboardLayout title="Estrutura e equipe"><ModulePage>
    <ModuleHeader eyebrow="Base operacional" title="Estrutura e equipe" description={modulePurpose} icon={Layers3} actions={<span className="rounded-lg border border-[#dbe6e4] bg-white px-3 py-2 text-xs font-bold text-[#17383e]"><span className="mr-1 text-[#6c8186]">{current.kind === "autonomo" ? "Empresa atendida:" : "Empresa da operação:"}</span>{currentCompany?.name ?? "Selecione uma empresa"}</span>} />

    {!companies.length ? <section className="rounded-3xl border border-dashed border-[#bddbd5] bg-[#fbfefd] p-10 text-center"><Building2 className="mx-auto h-10 w-10 text-[#0c7474]" /><h3 className="mt-4 text-xl font-bold">Cadastre uma empresa antes de estruturar a equipe.</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#668087]">Setores, funções e pessoas sempre pertencem a uma empresa e ao ambiente selecionado.</p><Link href={`/app/pgr?workspace=${current.id}`} className="mt-6 inline-flex rounded-xl bg-[#0c7474] px-5 py-3 text-sm font-bold text-white">Abrir empresas e PGR</Link></section> : <>
      <section className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><label className="block text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Empresa em foco</label><select value={currentCompanyId} onChange={event => { setCompanyId(Number(event.target.value)); setRoleDepartmentId(0); setEmployeeDepartmentId(0); setEmployeeRoleId(0); }} className="mt-3 h-11 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm font-semibold text-[#23454b] md:max-w-md">{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></section>
      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f6f1] text-[#0c7474]"><Layers3 className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0c8c89]">Estrutura</p><h3 className="text-lg font-bold">Setores</h3></div></div>{canManage && <div className="mt-5 space-y-3"><Input value={departmentName} onChange={event => setDepartmentName(event.target.value)} placeholder="Ex.: Produção" /><Textarea value={departmentDescription} onChange={event => setDepartmentDescription(event.target.value)} placeholder="Descrição opcional do setor" className="min-h-20" /><Button disabled={createDepartment.isPending || departmentName.trim().length < 2} onClick={() => createDepartment.mutate({ workspaceId, companyId: currentCompanyId, name: departmentName.trim(), description: departmentDescription.trim() || null })} className="w-full rounded-xl bg-[#0c7474] text-white"><Plus className="mr-2 h-4 w-4" />Adicionar setor</Button></div>}<div className="mt-5 space-y-2">{departments.length ? departments.map(item => <div key={item.id} className="rounded-xl border border-[#e6f0ee] p-3"><strong className="block text-sm">{item.name}</strong>{item.description && <small className="mt-1 block text-xs text-[#668087]">{item.description}</small>}</div>) : <p className="rounded-xl bg-[#f7fcfa] p-3 text-sm text-[#668087]">Nenhum setor registrado para esta empresa.</p>}</div></article>
        <article className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf4ff] text-[#3173a8]"><BriefcaseBusiness className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#3173a8]">Responsabilidades</p><h3 className="text-lg font-bold">Funções</h3></div></div>{canManage && <div className="mt-5 space-y-3"><Input value={roleName} onChange={event => setRoleName(event.target.value)} placeholder="Ex.: Técnico de manutenção" /><select value={roleDepartmentId} onChange={event => setRoleDepartmentId(Number(event.target.value))} className="h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Vincular a um setor (opcional)</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Textarea value={roleDescription} onChange={event => setRoleDescription(event.target.value)} placeholder="Descrição opcional da função" className="min-h-20" /><Button disabled={createRole.isPending || roleName.trim().length < 2} onClick={() => createRole.mutate({ workspaceId, companyId: currentCompanyId, departmentId: roleDepartmentId || null, name: roleName.trim(), description: roleDescription.trim() || null })} className="w-full rounded-xl bg-[#3173a8] text-white"><Plus className="mr-2 h-4 w-4" />Adicionar função</Button></div>}<div className="mt-5 space-y-2">{jobRoles.length ? jobRoles.map(item => <div key={item.id} className="rounded-xl border border-[#e6f0ee] p-3"><strong className="block text-sm">{item.name}</strong><small className="mt-1 block text-xs text-[#668087]">{item.departmentId ? departmentNameById.get(item.departmentId) ?? "Setor" : "Função transversal"}</small></div>) : <p className="rounded-xl bg-[#f7fbff] p-3 text-sm text-[#668087]">Nenhuma função registrada para esta empresa.</p>}</div></article>
        <article className="rounded-3xl border border-[#dcebe8] bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e9] text-[#d67845]"><UsersRound className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#bd6e4f]">Pessoas</p><h3 className="text-lg font-bold">Equipe</h3></div></div>{canManage && <div className="mt-5 space-y-3"><Input value={employeeName} onChange={event => setEmployeeName(event.target.value)} placeholder="Nome completo" /><Input value={employeeEmail} onChange={event => setEmployeeEmail(event.target.value)} type="email" placeholder="E-mail para confirmação de EPI (opcional)" /><p className="-mt-1 text-xs leading-5 text-[#668087]">O e-mail é usado somente para enviar a confirmação de recebimento. Cadastre-o antes de emitir uma ficha com OTP.</p><select value={employeeDepartmentId} onChange={event => setEmployeeDepartmentId(Number(event.target.value))} className="h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecionar setor (opcional)</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={employeeRoleId} onChange={event => setEmployeeRoleId(Number(event.target.value))} className="h-10 w-full rounded-xl border border-[#cfe3de] bg-white px-3 text-sm"><option value={0}>Selecionar função (opcional)</option>{jobRoles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Button disabled={createEmployee.isPending || employeeName.trim().length < 2 || Boolean(employeeEmail.trim() && !/^\S+@\S+\.\S+$/.test(employeeEmail.trim()))} onClick={() => createEmployee.mutate({ workspaceId, companyId: currentCompanyId, departmentId: employeeDepartmentId || null, jobRoleId: employeeRoleId || null, fullName: employeeName.trim(), email: employeeEmail.trim() || null, hiredAt: null })} className="w-full rounded-xl bg-[#d67845] text-white"><UserRoundPlus className="mr-2 h-4 w-4" />Adicionar pessoa</Button></div>}<div className="mt-5 space-y-2">{employees.length ? employees.map(item => <div key={item.id} className="rounded-xl border border-[#e6f0ee] p-3"><strong className="block text-sm">{item.fullName}</strong><small className="mt-1 block text-xs text-[#668087]">{roleNameById.get(item.jobRoleId ?? 0) ?? "Função não informada"} · {departmentNameById.get(item.departmentId ?? 0) ?? "Setor não informado"}</small>{item.email ? <small className="mt-1 block text-xs font-medium text-[#0c7474]">E-mail de confirmação: {item.email}</small> : <small className="mt-1 block text-xs text-[#a85a16]">Sem e-mail para confirmação OTP</small>}</div>) : <p className="rounded-xl bg-[#fffaf7] p-3 text-sm text-[#668087]">Nenhuma pessoa registrada para esta empresa.</p>}</div></article>
      </section>
    </>}
  </ModulePage></DashboardLayout>;
}
