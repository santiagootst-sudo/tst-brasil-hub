import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ModulePageProps = {
  children: ReactNode;
  className?: string;
};

type ModuleHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
};

type ModuleMetricProps = {
  label: string;
  value: ReactNode;
  detail: string;
  icon: LucideIcon;
  tone?: "teal" | "blue" | "amber" | "rose" | "green";
};

const toneClasses = {
  teal: "bg-[#e7f7f4] text-[#087f78]",
  blue: "bg-[#edf4ff] text-[#2563eb]",
  amber: "bg-[#fff7e7] text-[#b7791f]",
  rose: "bg-[#fff0ed] text-[#c85a3c]",
  green: "bg-[#ecf9f0] text-[#168a52]",
};

export function ModulePage({ children, className = "" }: ModulePageProps) {
  return <div className={`mx-auto w-full max-w-[1560px] space-y-6 ${className}`}>{children}</div>;
}

export function ModuleHeader({ eyebrow, title, description, icon: Icon, actions }: ModuleHeaderProps) {
  return <section className="flex flex-col gap-4 border-b border-[#e5eaec] pb-5 lg:flex-row lg:items-end lg:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      {Icon && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f7f4] text-[#087f78]"><Icon className="h-5 w-5" /></span>}
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#5f7b78]">{eyebrow}</p>}
        <h2 className="mt-1 text-[26px] font-semibold tracking-[-.035em] text-[#122d35]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#667a80]">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </section>;
}

export function ModuleMetricCard({ label, value, detail, icon: Icon, tone = "teal" }: ModuleMetricProps) {
  return <article className="min-h-[132px] rounded-xl border border-[#e5eaec] bg-white p-5 shadow-[0_1px_2px_rgba(16,43,50,.04)]">
    <div className="flex items-start gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#5f7077]">{label}</p><p className="mt-1 font-[tabular-nums] text-[30px] font-semibold leading-none tracking-[-.04em] text-[#17333b]">{value}</p><p className="mt-2 text-xs text-[#6b7e84]">{detail}</p></div></div>
  </article>;
}

export function ModuleSurface({ children, className = "" }: ModulePageProps) {
  return <section className={`overflow-hidden rounded-xl border border-[#e5eaec] bg-white shadow-[0_1px_2px_rgba(16,43,50,.04)] ${className}`}>{children}</section>;
}
