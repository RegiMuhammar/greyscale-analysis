import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import logoText from "../../logo/logo-text.png";
import { GREY_SCALE_GRADES } from "../constants/greyScaleChart";
import { useColorAnalysis } from "../hooks/useColorAnalysis";
import { WORKSPACE_HASH } from "../routes";
import {
  DEMO_ROI,
  DemoCard,
  PatchPair,
  SAMPLE_AFTER,
  SAMPLE_BEFORE,
  ScaleStrip,
  focusRing,
} from "./LandingDemo";

const NAV_LINKS = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#metrik", label: "Metrik" },
  { href: "#batasan", label: "Batasan" },
  { href: "#faq", label: "FAQ" },
];

const primaryButton = `inline-flex h-11 items-center justify-center rounded-[8px] bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 ${focusRing}`;
const secondaryButton = `inline-flex h-11 items-center justify-center rounded-[8px] border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-950 hover:bg-neutral-50 ${focusRing}`;

function SiteNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className={`shrink-0 rounded-[4px] ${focusRing}`}>
          <img src={logoText} alt="Grey Scale Analyser" className="h-8 w-auto" />
        </a>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-[6px] px-3 py-2 text-sm text-neutral-950 hover:bg-neutral-100 ${focusRing}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={WORKSPACE_HASH} className={`${primaryButton} max-sm:hidden`}>
            Mulai analisis
          </a>
          <button
            type="button"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-neutral-300 text-neutral-950 md:hidden ${focusRing}`}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id={menuId}
          aria-label="Navigasi utama"
          className="fixed inset-x-0 top-16 bottom-0 flex flex-col gap-1 overflow-y-auto border-t border-neutral-200 bg-white p-4 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center rounded-[8px] px-3 text-base font-medium text-neutral-950 hover:bg-neutral-100 ${focusRing}`}
            >
              {link.label}
            </a>
          ))}
          <a href={WORKSPACE_HASH} className={`${primaryButton} mt-4`}>
            Mulai analisis
          </a>
        </nav>
      ) : null}
    </header>
  );
}

function Hero({ demo }) {
  return (
    <section aria-labelledby="hero-heading" className="pt-14 sm:pt-20 lg:pt-28">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-[560px] flex-col gap-5">
          <h1
            id="hero-heading"
            className="font-display text-[40px] font-medium leading-[46px] tracking-[-0.8px] text-neutral-950 sm:text-[52px] sm:leading-[58px]"
          >
            Estimasi grade kelunturan warna dari dua foto kain
          </h1>
          <p className="max-w-[480px] text-base leading-7 text-neutral-600">
            Unggah foto sampel sebelum dan sesudah pencucian. Grey Scale Analyser menghitung selisih warna CIE LAB,
            memetakannya ke grade 5 sampai 1, dan menyiapkan laporan untuk observer.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={WORKSPACE_HASH} className={primaryButton}>
              Mulai analisis
            </a>
            <a href="#contoh" className={secondaryButton}>
              Lihat contoh hasil
            </a>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-6 sm:max-w-[360px] lg:pb-1">
          <div className="flex flex-col gap-1">
            <dt className="order-2 text-sm leading-5 text-neutral-600">Tingkat grade, termasuk setengah tingkat</dt>
            <dd className="order-1 font-display text-[32px] font-medium leading-none text-neutral-950">9</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="order-2 text-sm leading-5 text-neutral-600">Foto diproses di browser, tidak diunggah</dt>
            <dd className="order-1 font-display text-[32px] font-medium leading-none text-neutral-950">Lokal</dd>
          </div>
        </dl>
      </div>

      <div
        id="contoh"
        className="mt-12 flex w-full justify-center rounded-[20px] bg-neutral-100 px-3 py-8 sm:mt-16 sm:px-8 sm:py-14"
      >
        <DemoCard {...demo} />
      </div>
    </section>
  );
}

function ScaleSection({ activeGrade }) {
  return (
    <section aria-labelledby="skala-heading" className="mt-24 sm:mt-32">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2
          id="skala-heading"
          className="max-w-[520px] font-display text-[30px] font-medium leading-[38px] text-neutral-950 sm:text-[36px] sm:leading-[44px]"
        >
          Satu nilai Delta E, dipetakan ke sembilan tingkat grade
        </h2>
        <p className="max-w-[400px] text-sm leading-6 text-neutral-600">
          Batas di bawah adalah ambang yang dipakai aplikasi. Grade 5 berarti tidak ada perubahan yang terlihat, grade 1
          berarti perubahan ekstrem.
        </p>
      </div>
      <ScaleStrip activeGrade={activeGrade} />
    </section>
  );
}

const STEPS = [
  {
    title: "Unggah dua foto",
    body: "JPG, PNG, atau WEBP, maksimal 10MB per file. Foto dibaca langsung di browser dan tidak dikirim ke server mana pun.",
    visual: "photos",
  },
  {
    title: "Pilih area kain",
    body: "Tandai bagian kain yang dihitung. Meja, background, dan bayangan di luar kotak tidak ikut masuk rata-rata warna.",
    visual: "roi",
  },
  {
    title: "Hitung selisih warna",
    body: "Aplikasi menghitung rata-rata RGB, value, dan CIE LAB (D65) di area itu, lalu jarak warnanya sebagai Delta E CIE76.",
    visual: "formula",
  },
  {
    title: "Baca hasil dan unduh laporan",
    body: "Workspace menampilkan grade, histogram, radar RGB, dan change matrix. Observer mengisi grade manual dan catatan, lalu mengunduh hasilnya.",
    visual: "outputs",
  },
];

function StepVisual({ kind }) {
  if (kind === "photos") {
    return (
      <div className="grid w-full max-w-[420px] grid-cols-2 gap-3">
        {[
          [SAMPLE_BEFORE, "sample-sebelum.jpeg"],
          [SAMPLE_AFTER, "sample-sesudah.jpeg"],
        ].map(([src, name]) => (
          <figure key={name} className="rounded-[12px] bg-white p-2">
            <img src={src} alt="" className="aspect-[4/5] w-full rounded-[8px] object-cover" />
            <figcaption className="mt-2 truncate font-mono text-xs text-neutral-600">{name}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  if (kind === "roi") {
    return (
      <div className="relative aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-[12px] bg-white">
        <img src={SAMPLE_BEFORE} alt="Contoh penetapan area kain ROI" className="h-full w-full object-cover" />
        <div
          aria-hidden="true"
          className="absolute border-2 border-dashed border-neutral-950"
          style={{
            left: `${DEMO_ROI.x * 100}%`,
            top: `${DEMO_ROI.y * 100}%`,
            width: `${DEMO_ROI.width * 100}%`,
            height: `${DEMO_ROI.height * 100}%`,
            boxShadow: "0 0 0 999px rgba(255, 255, 255, 0.6)",
          }}
        />
      </div>
    );
  }

  if (kind === "formula") {
    return (
      <div className="w-full max-w-[440px] rounded-[12px] bg-white p-5 font-mono text-sm leading-7 text-neutral-950">
        <p className="text-xs text-neutral-600">value</p>
        <p>0.299R + 0.587G + 0.114B</p>
        <p className="mt-4 text-xs text-neutral-600">sRGB ke LAB</p>
        <p>sRGB → linear → XYZ (D65) → L* a* b*</p>
        <p className="mt-4 text-xs text-neutral-600">Delta E CIE76</p>
        <p>√(ΔL*² + Δa*² + Δb*²)</p>
      </div>
    );
  }

  return (
    <ul className="w-full max-w-[420px] divide-y divide-neutral-200 rounded-[12px] bg-white px-5 text-sm">
      {[
        ["greyscale_sebelum.png", "Greyscale foto sebelum"],
        ["greyscale_sesudah.png", "Greyscale foto sesudah"],
        ["komposit_greyscale.png", "Empat gambar dalam satu file"],
        ["Laporan PDF", "Metrik, grade, dan catatan observer"],
      ].map(([file, note]) => (
        <li key={file} className="flex flex-col gap-0.5 py-3">
          <span className="font-mono text-neutral-950">{file}</span>
          <span className="text-xs text-neutral-600">{note}</span>
        </li>
      ))}
    </ul>
  );
}

function StepsSection() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef([]);
  const baseId = useId();

  const onKeyDown = (event) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (active + keys[event.key] + STEPS.length) % STEPS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="cara-kerja" aria-labelledby="cara-kerja-heading" className="mt-24 sm:mt-32">
      <h2
        id="cara-kerja-heading"
        className="max-w-[560px] font-display text-[30px] font-medium leading-[38px] text-neutral-950 sm:text-[36px] sm:leading-[44px]"
      >
        Dari foto ke grade, tanpa meninggalkan browser
      </h2>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div role="tablist" aria-orientation="vertical" aria-label="Langkah analisis" className="flex flex-col border-l border-neutral-200">
          {STEPS.map((step, index) => {
            const selected = index === active;
            return (
              <button
                key={step.title}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={onKeyDown}
                className={`-ml-px flex flex-col gap-2 border-l-2 px-5 py-5 text-left transition-colors ${
                  selected ? "border-neutral-950" : "border-transparent hover:bg-neutral-50"
                } ${focusRing}`}
              >
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-xs tabular-nums text-neutral-600">0{index + 1}</span>
                  <span className="text-lg font-medium text-neutral-950">{step.title}</span>
                </span>
                {selected ? <span className="pl-8 text-sm leading-6 text-neutral-600">{step.body}</span> : null}
              </button>
            );
          })}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active}`}
          className="flex min-h-[360px] items-center justify-center rounded-[20px] bg-neutral-100 p-6 sm:p-10"
        >
          <StepVisual kind={STEPS[active].visual} />
        </div>
      </div>
    </section>
  );
}

const METRICS = [
  {
    name: "RGB rata-rata",
    spec: "R̄, Ḡ, B̄ per foto",
    body: "Dasar swatch warna dan radar RGB. Channel dengan selisih terbesar disebut di ringkasan hasil.",
  },
  {
    name: "Value",
    spec: "0.299R + 0.587G + 0.114B",
    body: "Terang gelap sampel. Naik berarti cenderung pudar, turun berarti lebih gelap.",
  },
  {
    name: "CIE LAB",
    spec: "L*  a*  b*  (D65)",
    body: "L* untuk terang gelap, a* untuk hijau ke merah, b* untuk biru ke kuning.",
  },
  {
    name: "Delta E CIE76",
    spec: "√(ΔL*² + Δa*² + Δb*²)",
    body: "Jarak warna rata-rata sebelum dan sesudah. Nilai inilah yang dipetakan ke grade.",
    key: true,
  },
  {
    name: "Histogram",
    spec: "256 bin per channel",
    body: "Sebaran tonal R, G, B, dan value, untuk melihat pergeseran ke arah terang atau gelap.",
  },
  {
    name: "Change matrix",
    spec: "grid 18 × 18",
    body: "Peta perubahan per area: 70% bobot jarak RGB, 30% bobot selisih value.",
  },
];

function MetricsSection() {
  return (
    <section id="metrik" aria-labelledby="metrik-heading" className="mt-24 sm:mt-32">
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2
          id="metrik-heading"
          className="max-w-[520px] font-display text-[30px] font-medium leading-[38px] text-neutral-950 sm:text-[36px] sm:leading-[44px]"
        >
          Yang dihitung dari setiap pasangan foto
        </h2>
        <p className="max-w-[400px] text-sm leading-6 text-neutral-600">
          Semua angka di workspace bisa ditelusuri ke rumus di bawah. Tidak ada model atau layanan eksternal yang ikut
          menilai.
        </p>
      </div>

      <dl className="grid overflow-hidden rounded-[20px] border border-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((metric) => (
          <div
            key={metric.name}
            className={`flex flex-col gap-3 border-neutral-200 p-6 [&:not(:first-child)]:border-t sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l lg:[&:nth-child(3)]:border-t-0 lg:[&:nth-child(even)]:border-l-0 lg:[&:not(:nth-child(3n+1))]:border-l ${
              metric.key ? "bg-neutral-950" : "bg-white"
            }`}
          >
            <dt className={`text-base font-medium ${metric.key ? "text-white" : "text-neutral-950"}`}>{metric.name}</dt>
            <dd className={`font-mono text-sm ${metric.key ? "text-white" : "text-neutral-950"}`}>{metric.spec}</dd>
            <dd className={`text-sm leading-6 ${metric.key ? "text-neutral-300" : "text-neutral-600"}`}>{metric.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LimitsSection() {
  return (
    <section id="batasan" aria-labelledby="batasan-heading" className="mt-24 sm:mt-32">
      <h2
        id="batasan-heading"
        className="max-w-[560px] font-display text-[30px] font-medium leading-[38px] text-neutral-950 sm:text-[36px] sm:leading-[44px]"
      >
        Kapan hasilnya bisa dipakai, kapan tetap perlu lab
      </h2>

      <div className="mt-10 grid gap-4 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-5 rounded-[20px] bg-neutral-100 p-6 sm:p-8">
          <h3 className="text-xl font-medium text-neutral-950">Dipakai untuk</h3>
          <ul className="flex flex-col gap-3 text-sm leading-6 text-neutral-950">
            <li>Penyaringan awal sebelum sampel dikirim ke uji laboratorium.</li>
            <li>Membandingkan beberapa sampel yang difoto dengan cahaya dan jarak yang sama.</li>
            <li>Dokumentasi visual dan catatan observer dalam satu laporan PDF.</li>
            <li>Belajar membaca hubungan antara Delta E dan skala grey.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-5 rounded-[20px] border border-neutral-200 bg-white p-6 sm:p-8">
          <h3 className="text-xl font-medium text-neutral-950">Belum menggantikan</h3>
          <ul className="flex flex-col gap-3 text-sm leading-6 text-neutral-600">
            <li>Pengukuran spektrofotometer.</li>
            <li>Penilaian observer dengan grey scale fisik ISO 105-A03.</li>
            <li>Kalibrasi kamera atau white reference card, yang belum tersedia di aplikasi.</li>
            <li>Analisis per piksel: Delta E dihitung dari warna rata-rata area.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Apakah foto saya dikirim ke server?",
    a: "Tidak. Konversi greyscale, perhitungan LAB, Delta E, histogram, dan change matrix berjalan dengan Canvas API di browser Anda. Aplikasi ini tidak punya backend, database, atau login.",
  },
  {
    q: "Bagaimana grade dihitung?",
    a: "Warna rata-rata area kain dikonversi ke CIE LAB, lalu jarak antara foto sebelum dan sesudah dihitung sebagai Delta E CIE76. Delta E sampai 0.8 menjadi grade 5, di atas 16 menjadi grade 1. Tabel lengkapnya ada di bagian skala di atas.",
  },
  {
    q: "Kenapa saya harus memilih area kain?",
    a: "Rata-rata warna dihitung dari semua piksel di dalam area. Jika seluruh foto ikut dihitung, meja, background, atau bayangan ikut menggeser hasil. Workspace memberi peringatan bila area yang dipilih masih hampir seluruh foto.",
  },
  {
    q: "Bagaimana cara memotret sampel supaya hasilnya bisa dibandingkan?",
    a: "Foto kedua sampel di bawah cahaya, jarak, dan sudut yang sama, tanpa flash. Jika selisih value antara dua foto lebih dari 25, workspace menandai kemungkinan perbedaan pencahayaan, bukan perubahan kain.",
  },
  {
    q: "Apakah hasilnya setara pengukuran laboratorium?",
    a: "Tidak. Ini estimasi berbasis foto yang dipengaruhi kamera, white balance, dan pencahayaan. Gunakan sebagai pembacaan awal, lalu konfirmasi dengan grey scale fisik atau spektrofotometer.",
  },
  {
    q: "Apa saja yang bisa saya unduh?",
    a: "PNG greyscale untuk foto sebelum dan sesudah, satu PNG komposit berisi empat gambar, dan laporan PDF yang memuat metrik, estimasi grade, serta grade dan catatan observer.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="faq" aria-labelledby="faq-heading" className="mt-24 sm:mt-32">
      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
        <h2
          id="faq-heading"
          className="max-w-[360px] font-display text-[30px] font-medium leading-[38px] text-neutral-950 sm:text-[36px] sm:leading-[44px]"
        >
          Sebelum Anda mengunggah foto
        </h2>

        <div className="flex w-full max-w-[656px] flex-col border-l border-neutral-200">
          {FAQS.map((item, index) => {
            const expanded = open === index;
            return (
              <div key={item.q} className={`-ml-px border-l-2 ${expanded ? "border-neutral-950" : "border-transparent"}`}>
                <h3>
                  <button
                    type="button"
                    id={`${baseId}-q-${index}`}
                    aria-expanded={expanded}
                    aria-controls={`${baseId}-a-${index}`}
                    onClick={() => setOpen(expanded ? -1 : index)}
                    className={`flex min-h-11 w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-medium text-neutral-950 hover:bg-neutral-50 sm:px-8 ${focusRing}`}
                  >
                    {item.q}
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </h3>
                <div
                  id={`${baseId}-a-${index}`}
                  role="region"
                  aria-labelledby={`${baseId}-q-${index}`}
                  hidden={!expanded}
                  className="px-5 pb-6 text-sm leading-6 text-neutral-600 sm:px-8"
                >
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ClosingBand() {
  return (
    <section
      aria-labelledby="closing-heading"
      className="mt-24 flex flex-col gap-10 overflow-hidden rounded-[20px] bg-neutral-950 px-6 py-12 sm:mt-32 sm:px-12 md:flex-row md:items-center md:justify-between lg:px-16"
    >
      <div className="flex max-w-[440px] flex-col items-start gap-5">
        <h2 id="closing-heading" className="font-display text-[30px] font-medium leading-[38px] text-white sm:text-[36px] sm:leading-[44px]">
          Punya foto sebelum dan sesudah pencucian?
        </h2>
        <p className="text-sm leading-6 text-neutral-300">
          Workspace terbuka tanpa akun. Foto tetap di perangkat Anda sampai Anda menutup tab.
        </p>
        <a
          href={WORKSPACE_HASH}
          className="inline-flex h-11 items-center justify-center rounded-[8px] bg-white px-4 text-sm font-medium text-neutral-950 hover:bg-neutral-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Mulai analisis
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2 self-center" aria-hidden="true">
        {GREY_SCALE_GRADES.map((item) => (
          <PatchPair key={item.grade} patches={item.patches} size="h-10 w-10 sm:h-12 sm:w-12" />
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-neutral-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <img src={logoText} alt="Grey Scale Analyser" className="h-7 w-auto self-start" />
          <p className="text-sm text-neutral-600">Alat bantu observasi kelunturan warna tekstil. Diproses di browser.</p>
        </div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-1 gap-y-1">
          <a href={WORKSPACE_HASH} className={`rounded-[6px] px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100 ${focusRing}`}>
            Workspace
          </a>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-[6px] px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 ${focusRing}`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function Landing() {
  const demo = useColorAnalysis(SAMPLE_BEFORE, SAMPLE_AFTER, DEMO_ROI, DEMO_ROI);

  return (
    <div id="top" className="min-h-screen bg-white text-neutral-950">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <Hero demo={demo} />
        <ScaleSection activeGrade={demo.analysis?.estimatedGrade} />
        <StepsSection />
        <MetricsSection />
        <LimitsSection />
        <FaqSection />
        <ClosingBand />
      </main>
      <SiteFooter />
    </div>
  );
}
