import type { HTMLAttributes } from "react";

const FAVICON_URL = "/manus-storage/tst-brasil-hub-favicon_07785ba1.png";

type BrandLockupProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

export function BrandLockup({ compact = false, inverse = false, className = "", ...props }: BrandLockupProps) {
  const titleColor = inverse ? "text-white" : "text-[#102b32]";
  const subtitleColor = inverse ? "text-[#9ecfc5]" : "text-[#0c7474]";

  return (
    <div className={`flex items-center gap-2.5 ${className}`} {...props}>
      <div className={`grid place-content-center bg-gradient-to-br from-[#0c8c89] to-[#063b43] text-white shadow-md ${compact ? "h-8 w-8 rounded-lg text-xs" : "h-10 w-10 rounded-xl text-base"} font-black tracking-tighter`}>
        TST
      </div>
      <div className="leading-none">
        <p className={`${compact ? "text-base" : "text-lg"} font-extrabold tracking-[-0.04em] ${titleColor}`}>TST</p>
        <p className={`${compact ? "mt-0.5 text-[8px]" : "mt-1 text-[9px]"} font-bold uppercase tracking-[0.18em] ${subtitleColor}`}>Brasil Hub</p>
      </div>
    </div>
  );
}
