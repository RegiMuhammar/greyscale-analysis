import { Badge } from "./ui/badge";
import logoText from "../../logo/logo-text.png";

export function AppHeader() {
  return (
    <header className="border-b border-[#dedede] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <img
            src={logoText}
            alt="Grey Scale Analyser"
            className="h-9 max-w-[210px] object-contain object-left"
          />
          <div className="hidden h-8 w-px bg-[#dedede] sm:block" />
          <p className="min-w-0 text-sm font-medium leading-5 text-[#666666]">
            Instrumen digital observasi tekstil
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">Client-side</Badge>
          <Badge tone="neutral">ISO 105-A02 visual reference</Badge>
        </div>
      </div>
    </header>
  );
}
