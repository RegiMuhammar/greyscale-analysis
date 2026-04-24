import { cn } from "../../lib";

const tones = {
  neutral: "border-[#dedede] bg-[#f7f7f6] text-[#333333]",
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
  warning: "border-[#FED7AA] bg-[#FFFBEB] text-[#92400E]",
  danger: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
  blue: "border-[#dedede] bg-white text-[#111111]",
};

export function Badge({ className, tone = "neutral", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
