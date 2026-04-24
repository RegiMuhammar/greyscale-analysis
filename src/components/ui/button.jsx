import { cn } from "../../lib";

const variants = {
  primary: "bg-[#111111] text-white hover:bg-[#000000] disabled:bg-[#b8b8b8]",
  secondary:
    "border border-[#dedede] bg-white text-[#111111] hover:bg-[#f4f4f4] disabled:text-[#a3a3a3]",
  ghost: "text-[#666666] hover:bg-[#f4f4f4] hover:text-[#111111] disabled:text-[#a3a3a3]",
  danger: "border border-[#F4B6B6] bg-white text-[#DC2626] hover:bg-[#FEF2F2]",
};

export function Button({ className, variant = "primary", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "focus-ring inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-[8px] px-4 py-2 text-center text-sm font-semibold leading-5 transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
