import { Badge } from "./ui/badge";
import logoText from "../../logo/logo-text.png";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <a
            href="#/"
            className="rounded-[4px] focus-ring"
            title="Kembali ke Beranda"
            aria-label="Kembali ke Beranda Grey Scale Analyser"
          >
            <img
              src={logoText}
              alt="Grey Scale Analyser"
              className="h-8 max-w-[200px] object-contain object-left"
            />
          </a>
          <div className="hidden h-6 w-px bg-neutral-200 sm:block" />
          <p className="min-w-0 text-sm font-medium leading-5 text-neutral-600">
            Workspace observasi tekstil
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden flex-wrap gap-2 sm:flex">
            <Badge tone="blue">Client-side</Badge>
            <Badge tone="neutral">ISO 105-A02 reference</Badge>
          </div>
          <a
            href="#/"
            className="inline-flex h-9 items-center justify-center rounded-[8px] border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-950 hover:bg-neutral-50 focus-ring"
          >
            ← Beranda
          </a>
        </div>
      </div>
    </header>
  );
}
