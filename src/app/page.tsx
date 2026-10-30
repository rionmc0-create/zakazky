"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Language = "CZ" | "EN";
type Status =
  | "In development"
  | "Completed"
  | "Waiting for customer"
  | "Cancelled";

type Job = {
  id: string;
  name: string;
  type: string;
  status: Status;
  progress: number;
  description: string;
  date: string;
  budget: number;
};

type JobRow = {
  id: string;
  title: string;
  client: string | null;
  description: string | null;
  description_cs: string | null;
  description_en: string | null;
  status: string;
  budget: number | null;
  progress: number | null;
  created_at: string;
  updated_at: string | null;
};

const JOBS_SELECT =
  "id,title,client,description,description_cs,description_en,status,budget,progress,created_at,updated_at";

const translations = {
  CZ: {
    subtitle: "PROJECT MANAGEMENT",
    overview: "Přehled projektů",
    intro: "Přehled Aktuální práce a dokončených zakázek.(Tenhle web byl nedávno založen, takže je možné že některé projekty zde nebudou.)",
    active: "Aktivní projekty",
    completed: "Dokončené",
    total: "Celkem projektů",
    budgetTotal: "Odhadovaná hodnota všech projektů",
    budgetDetail: "Hodnota všech zakázek",
    all: "Všechny",
    inProgress: "Probíhá",
    waiting: "Čeká na zákazníka",
    search: "Hledat projekt...",
    project: "PROJEKT",
    status: "STAV",
    progress: "PRŮBĚH",
    budget: "ODHADOVANÝ ROZPOČET",
    updated: "NAPOSLEDY AKTUALIZOVÁNO",
    development: "Probíhá vývoj",
    waitingStatus: "Čeká na zákazníka",
    completedStatus: "Dokončeno",
    cancelledStatus: "Zrušeno",
    empty: "Žádné projekty nenalezeny.",
    loading: "Načítání projektů...",
    loadError: "Projekty se nepodařilo načíst.",
    retry: "Zkusit znovu",
    footer: "Tenhle web byl vytvořen : Rion2._ | Rionxdd | Rion",
    allWork: "MOJE PRÁCE",
    public: "Veřejný přehled",
    client: "ZÁKAZNÍK",
    projectCount: "projektů",
    displayedBudget: "Rozpočet zobrazených zakázek:",
    author: "Navrženo a spravováno",
    contactLabel: "SPOLUPRÁCE",
    contactTitle: "Máš zájem o vlastní projekt?",
    contactDescription:
      "Potřebuješ Minecraft plugin, Discord bota nebo web? Napiš mi svou představu a společně probereme možnosti.",
    contactButton: "Kontaktovat na Discordu",
    contactNote: "Napiš mi, co potřebuješ vytvořit, a domluvíme se na podrobnostech.",
  },
  EN: {
    subtitle: "PROJECT MANAGEMENT",
    overview: "Project overview",
    intro: "An overview of current work and completed projects.(Some projects may not be listed here as this website was recently created.)",
    active: "Active projects",
    completed: "Completed",
    total: "Total projects",
    budgetTotal: "Estimated value of all projects",
    budgetDetail: "Value of all projects",
    all: "All projects",
    inProgress: "In progress",
    waiting: "Awaiting customer",
    search: "Search projects...",
    project: "PROJECT",
    status: "STATUS",
    progress: "PROGRESS",
    budget: "ESTIMATED BUDGET",
    updated: "LAST UPDATED",
    development: "In development",
    waitingStatus: "Awaiting customer",
    completedStatus: "Completed",
    cancelledStatus: "Cancelled",
    empty: "No projects found.",
    loading: "Loading projects...",
    loadError: "Could not load projects.",
    retry: "Try again",
    footer: "This web has been created by Rion2._ | Rionxdd | Rion",
    allWork: "MY WORK",
    public: "Public overview",
    client: "CLIENT",
    projectCount: "projects",
    displayedBudget: "Budget of displayed projects:",
    author: "Designed and managed by",
    contactLabel: "LET'S WORK TOGETHER",
    contactTitle: "Have a project in mind?",
    contactDescription:
      "Need a Minecraft plugin, a Discord bot, or a web? Tell me your idea and we can discuss how to bring it to life.",
    contactButton: "Contact me on Discord",
    contactNote: "Tell me what you need and we can discuss the details.",
  },
};

const currencyFormatter = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
});

function mapJob(row: JobRow, language: Language): Job {
  const allowedStatuses: Status[] = [
    "In development",
    "Completed",
    "Waiting for customer",
    "Cancelled",
  ];

  const progress = Math.min(
    100,
    Math.max(0, Number(row.progress ?? 0)),
  );

  const lastUpdated = row.updated_at || row.created_at;

  return {
    id: row.id,
    name: row.title || "Untitled project",
    type: row.client || "",
    status: allowedStatuses.includes(row.status as Status)
      ? (row.status as Status)
      : "In development",
    progress,
    description:
      language === "CZ"
        ? row.description_cs || row.description || ""
        : row.description_en || row.description || "",
date: lastUpdated
  ? (() => {
      const date = new Date(lastUpdated);

      date.setMinutes(0, 0, 0);

      return new Intl.DateTimeFormat(
        language === "CZ" ? "cs-CZ" : "en-GB",
        {
          day: "numeric",
          month: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
          timeZone: "Europe/Prague",
        }
      ).format(date);
    })()
  : "",
    budget: Math.max(0, Number(row.budget ?? 0)),
  };
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("CZ");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const t = translations[language];

  useEffect(() => {
    let cancelled = false;

    async function fetchJobs() {
      setLoading(true);
      setLoadError("");

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("jobs")
          .select(JOBS_SELECT)
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        const rows = (data ?? []) as unknown as JobRow[];
        const mappedJobs = rows.map((row) => mapJob(row, language));

        if (!cancelled) {
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);

        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : t.loadError,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [language, reloadKey, t.loadError]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        job.name.toLowerCase().includes(query) ||
        job.type.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" &&
          job.status !== "Completed" &&
          job.status !== "Cancelled") ||
        (filter === "Completed" && job.status === "Completed");

      return matchesSearch && matchesFilter;
    });
  }, [jobs, filter, search]);

  const activeCount = jobs.filter(
    (job) =>
      job.status !== "Completed" && job.status !== "Cancelled",
  ).length;

  const completedCount = jobs.filter(
    (job) => job.status === "Completed",
  ).length;

  const totalBudget = jobs.reduce(
    (sum, job) => sum + job.budget,
    0,
  );

  const displayedBudget = filteredJobs.reduce(
    (sum, job) => sum + job.budget,
    0,
  );

  function statusLabel(status: Status) {
    if (status === "Completed") return t.completedStatus;
    if (status === "Waiting for customer") return t.waitingStatus;
    if (status === "Cancelled") return t.cancelledStatus;
    return t.development;
  }

  function statusStyle(status: Status) {
    if (status === "Completed") {
      return "border-emerald-900/70 bg-emerald-950/40 text-emerald-400";
    }

    if (status === "Waiting for customer") {
      return "border-amber-900/70 bg-amber-950/30 text-amber-400";
    }

    if (status === "Cancelled") {
      return "border-red-900/70 bg-red-950/30 text-red-400";
    }

    return "border-blue-900/70 bg-blue-950/40 text-blue-400";
  }

  function formatBudget(amount: number) {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(amount)} Kč`;
  }

  function retryLoading() {
    setLoadError("");
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  return (
    <main className="min-h-screen bg-[#090a0c] text-zinc-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#15171b] text-sm font-bold tracking-tight">
              R
            </div>

            <div>
              <div className="text-lg font-semibold tracking-tight">
                Rionxdd<span className="text-blue-500"></span>
              </div>
              <div className="mt-0.5 text-[10px] font-medium tracking-[0.2em] text-zinc-500">
                {t.subtitle}
              </div>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-500 sm:block">
              {t.public}
            </span>

            <div className="flex rounded-lg border border-white/10 bg-[#111214] p-1">
              {(["CZ", "EN"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={language === lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    language === lang
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {t.allWork}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.overview}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">{t.intro}</p>
          </div>

          <div className="text-sm text-zinc-500">
            <span className="text-zinc-300">Rion2._</span>
            <span className="mx-2 text-zinc-700">/</span>
            Developer
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-900/60 bg-red-950/30 p-4"
          >
            <p className="text-sm text-red-300">{t.loadError}</p>
            <p className="mt-2 break-words text-xs text-red-400/80">
              {loadError}
            </p>
            <button
              type="button"
              onClick={retryLoading}
              className="mt-3 rounded-lg border border-red-900/60 px-3 py-2 text-xs text-red-300 hover:bg-red-950/40"
            >
              {t.retry}
            </button>
          </div>
        )}

        <section className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t.active}
            value={String(activeCount).padStart(2, "0")}
            detail={language === "CZ" ? "Aktuálně otevřené" : "Currently ongoing"}
            accent
          />

          <StatCard
            label={t.completed}
            value={String(completedCount).padStart(2, "0")}
            detail={language === "CZ" ? "Úspěšně dokončené" : "Successfully delivered"}
          />

          <StatCard
            label={t.budgetTotal}
            value={formatBudget(totalBudget)}
            detail={t.budgetDetail}
            accent
          />

          <StatCard
            label={t.total}
            value={String(jobs.length).padStart(2, "0")}
            detail={language === "CZ" ? "Všechny evidované projekty" : "All recorded projects"}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f12]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "All", label: t.all },
                { id: "Active", label: t.inProgress },
                { id: "Completed", label: t.completed },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                    filter === item.id
                      ? "bg-white/[0.09] text-white"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#090a0c] px-3 sm:w-64">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-zinc-600"
                aria-hidden="true"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m16 16 4.3 4.3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.search}
                aria-label={t.search}
                className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={language === "CZ" ? "Vymazat hledání" : "Clear search"}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(200px,1.6fr)_minmax(130px,1fr)_minmax(110px,1fr)_120px_110px] gap-5 border-b border-white/[0.06] px-5 py-3 text-[10px] font-semibold tracking-[0.12em] text-zinc-600 lg:grid">
            <span>{t.project}</span>
            <span>{t.status}</span>
            <span>{t.progress}</span>
            <span>{t.budget}</span>
            <span>{t.updated}</span>
          </div>

          <div>
            {loading ? (
              <div className="px-5 py-14 text-center text-sm text-zinc-500">
                {t.loading}
              </div>
            ) : (
              <>
                {filteredJobs.map((job) => (
                  <article
                    key={job.id}
                    className="group grid gap-5 border-b border-white/[0.06] px-4 py-5 transition-colors duration-200 last:border-b-0 hover:bg-white/[0.025] sm:px-5 lg:grid-cols-[minmax(200px,1.6fr)_minmax(130px,1fr)_minmax(110px,1fr)_120px_110px] lg:items-center lg:gap-5"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                          {t.project}
                        </span>

                        {job.type && (
                          <>
                            <span className="text-zinc-700">/</span>
                            <span className="text-[10px] text-zinc-500">
                              {job.type}
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="break-words text-sm font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-white">
                        {job.name}
                      </h2>

                      {job.description && (
                        <p className="mt-1.5 max-w-md whitespace-pre-line break-words text-xs leading-5 text-zinc-500">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 lg:hidden">
                        {t.status}
                      </div>

                      <span
                        className={`inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] font-medium ${statusStyle(job.status)}`}
                      >
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          {job.status === "In development" && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />
                          )}
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                        </span>
                        {statusLabel(job.status)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 lg:hidden">
                          {t.progress}
                        </span>

                        <span className="font-mono text-xs font-medium tabular-nums text-zinc-300">
                          {job.progress}
                          <span className="ml-0.5 text-zinc-600">%</span>
                        </span>
                      </div>

                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
                        role="progressbar"
                        aria-valuenow={job.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${job.name} progress`}
                      >
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ${
                            job.status === "Completed"
                              ? "bg-emerald-500"
                              : job.status === "Waiting for customer"
                                ? "bg-amber-500"
                                : job.status === "Cancelled"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 lg:hidden">
                        {t.budget}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-zinc-200">
                        {formatBudget(job.budget)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600 lg:hidden">
                        {t.updated}
                      </span>
                      <span className="text-xs tabular-nums text-zinc-400">
                        {job.date}
                      </span>
                    </div>
                  </article>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="px-5 py-14 text-center text-sm text-zinc-500">
                    {t.empty}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-white/[0.06] px-5 py-3.5 text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {filteredJobs.length} {t.projectCount}
            </span>

            <span>
              {t.displayedBudget}{" "}
              <span className="font-medium text-zinc-300">
                {formatBudget(displayedBudget)}
              </span>
            </span>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#11151d] to-[#0e0f12] p-6 sm:p-9">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {t.contactLabel}
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t.contactTitle}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              {t.contactDescription}
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="https://discord.com/users/rion2._"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4752C4]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M19.73 5.33A18.2 18.2 0 0 0 15.24 4a12.6 12.6 0 0 0-.57 1.18 16.8 16.8 0 0 0-5.34 0A12.6 12.6 0 0 0 8.76 4a18.2 18.2 0 0 0-4.49 1.33C1.43 9.6.66 13.77 1.05 17.88a18.3 18.3 0 0 0 5.5 2.78c.44-.6.83-1.24 1.16-1.91-.64-.24-1.25-.54-1.82-.9.15-.11.3-.23.44-.35a13 13 0 0 0 11.34 0c.14.12.29.24.44.35-.57.36-1.18.66-1.82.9.33.67.72 1.31 1.16 1.91a18.3 18.3 0 0 0 5.5-2.78c.46-4.77-.79-8.9-3.22-12.55ZM8.02 14.75c-1.07 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18 1.97.99 1.95 2.18c0 1.2-.86 2.18-1.95 2.18Zm7.96 0c-1.07 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18 1.97.99 1.95 2.18c0 1.2-.86 2.18-1.95 2.18Z" />
                </svg>
                {t.contactButton}
              </a>

              <div className="text-xs leading-5 text-zinc-500">
                <div>{t.contactNote}</div>
                <div className="mt-1 font-medium text-zinc-300">
                  Discord: rion2._
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-2 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.footer}</span>

          <span>
            {t.author}{" "}
            <span className="text-zinc-400">Rion2._</span>
          </span>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 transition-colors hover:border-white/[0.12]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500">{label}</span>

        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            accent ? "bg-blue-500" : "bg-zinc-700"
          }`}
        />
      </div>

      <div className="mt-4 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        {value}
      </div>

      <div className="mt-2 text-[11px] text-zinc-600">{detail}</div>
    </div>
  );
}