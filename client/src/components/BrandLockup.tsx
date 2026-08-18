import type { HTMLAttributes } from "react";

const OFFICIAL_LOGO_URL = "/manus-storage/tst-brasil-hub-logo-otimizado_50d81e90.png";

type BrandLockupProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

export function BrandLockup({ compact = false, inverse = false, className = "", ...props }: BrandLockupProps) {
  const imageSize = compact ? "h-8 w-[5.7rem]" : "h-12 w-[8.6rem]";

  return (
    <div className={`flex items-center ${className}`} {...props}>
      <div className={inverse ? "rounded-xl bg-white px-2 py-1.5 shadow-sm" : ""}>
        <img
          src={OFFICIAL_LOGO_URL}
          alt="TST Brasil Hub"
          className={`${imageSize} block object-contain`}
        />
      </div>
    </div>
  );
}
