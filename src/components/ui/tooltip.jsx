import { Info } from "lucide-react";

export function Tooltip({ label, children }) {
  return (
    <span className="group relative inline-flex items-center">
      {children || (
        <button
          type="button"
          className="focus-ring inline-flex h-5 w-5 items-center justify-center rounded-full text-[#777777] hover:bg-[#f1f1f1] hover:text-[#111111]"
          aria-label={label}
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
      <span className="tooltip-card pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 hidden w-64 -translate-x-1/2 rounded-[8px] border border-[#dedede] bg-white p-3 text-left text-xs font-medium leading-5 text-[#4b5563] group-hover:block group-focus-within:block">
        {label}
      </span>
    </span>
  );
}
