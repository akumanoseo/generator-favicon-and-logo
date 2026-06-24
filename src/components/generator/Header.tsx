"use client";

import Link from "next/link";
import { useFactory } from "@/lib/store";
import { useT, persistLang, type Lang } from "@/lib/i18n";

export function Header() {
  const { t, lang } = useT();
  const setLang = (l: Lang) => {
    persistLang(l);
    useFactory.setState({ lang: l });
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-akuma-darker/70 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xs text-neutral-400 transition hover:text-akuma-redBright" title={t("nav.home")}>
          {t("nav.home")}
        </Link>
        <div className="h-6 w-px bg-white/10" />
        <h1 className="font-display text-lg leading-none text-akuma-light sm:text-xl">
          {t("header.title")}
          <span className="ml-2 text-sm font-normal text-akuma-redBright">{t("header.by")}</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Language switch */}
        <div className="flex gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5 text-xs" title={t("lang.label")}>
          {(["ru", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-2 py-1 font-semibold uppercase transition ${
                lang === l ? "bg-akuma-red text-white" : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
