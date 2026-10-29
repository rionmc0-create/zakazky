"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  title: string;
  client: string | null;
  description: string | null;
  description_cs: string | null;
  description_en: string | null;
  status: string;
  budget: number;
  progress: number;
  created_at: string;
};

const emptyJob = {
  title: "",
  client: "",
  description_cs: "",
  description_en: "",
  status: "In development",
  budget: "0",
  progress: "0",
};

const JOBS_SELECT =
  "id,title,client,description,description_cs,description_en,status,budget,progress,created_at";

export default function AdminPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState(emptyJob);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadJobs() {
    const supabase = createClient();

    const { data, error: jobsError } = await supabase
      .from("jobs")
      .select(JOBS_SELECT)
      .order("created_at", { ascending: false });

    if (jobsError) {
      setError(`Načtení zakázek selhalo: ${jobsError.message}`);
      return false;
    }

    setJobs((data ?? []) as Job[]);
    return true;
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        router.replace("/admin/login");
        return;
      }

      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_portfolio_admin");

      if (cancelled) return;

      if (adminError || isAdmin !== true) {
        setError("Tento účet nemá oprávnění správce.");
        setLoading(false);
        return;
      }

      await loadJobs();

      if (!cancelled) {
        setLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function startEdit(job: Job) {
    setEditingId(job.id);

    setForm({
      title: job.title,
      client: job.client ?? "",
      description_cs: job.description_cs || job.description || "",
      description_en: job.description_en || "",
      status: job.status,
      budget: String(job.budget ?? 0),
      progress: String(job.progress ?? 0),
    });

    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyJob);
    setMessage("");
    setError("");
  }

  async function saveJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const budget = Number(form.budget);
    const progress = Number(form.progress);

    if (
      !form.title.trim() ||
      !Number.isFinite(budget) ||
      budget < 0 ||
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      setError(
        "Zkontroluj název, rozpočet a průběh projektu (0–100).",
      );
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();

      const payload = {
        title: form.title.trim(),
        client: form.client.trim(),
        description: form.description_cs.trim(),
        description_cs: form.description_cs.trim(),
        description_en: form.description_en.trim(),
        status: form.status,
        budget,
        progress,
      };

      const result = editingId
        ? await supabase
            .from("jobs")
            .update(payload)
            .eq("id", editingId)
        : await supabase.from("jobs").insert(payload);

      if (result.error) {
        throw new Error(result.error.message);
      }

      const refreshed = await loadJobs();

      if (!refreshed) {
        throw new Error(
          "Zakázka byla uložena, ale nepodařilo se obnovit seznam.",
        );
      }

      setForm(emptyJob);
      setEditingId(null);

      setMessage(
        editingId
          ? "Zakázka byla upravena."
          : "Zakázka byla přidána.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Uložení zakázky se nezdařilo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteJob(job: Job) {
    if (
      !window.confirm(
        `Opravdu chceš smazat projekt „${job.title}“?`,
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job.id);

    if (deleteError) {
      setError(`Mazání selhalo: ${deleteError.message}`);
      return;
    }

    setJobs((current) =>
      current.filter((item) => item.id !== job.id),
    );

    if (editingId === job.id) {
      resetForm();
    }

    setMessage("Zakázka byla smazána.");
  }

  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-white/10 bg-[#090a0c] px-3.5 py-3 text-sm text-zinc-100 outline-none focus:border-blue-500";

  const labelClass = "block text-xs font-medium text-zinc-400";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0c] text-sm text-zinc-500">
        Ověřování přístupu...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090a0c] text-zinc-100">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="text-lg font-semibold">
            Rionxdd<span className="text-blue-500">.</span>
            <span className="ml-3 text-xs font-normal text-zinc-500">
              ADMIN
            </span>
          </a>

          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-xs text-zinc-400 hover:text-white"
            >
              Veřejné portfolio
            </a>

            <button
              onClick={logout}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.05]"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <p className="mb-2 text-xs tracking-[0.16em] text-blue-400">
            PROJECT MANAGEMENT
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Správa zakázek
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Přidávej projekty, upravuj jejich stav a sleduj průběh.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4 text-sm text-emerald-300"
          >
            {message}
          </div>
        )}

        {error === "Tento účet nemá oprávnění správce." ? (
          <p className="text-sm text-zinc-500">
            Přístup je omezen na povolené administrátorské účty.
          </p>
        ) : (
          <>
            <section className="mb-10 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-7">
              <h2 className="text-lg font-semibold">
                {editingId ? "Upravit zakázku" : "Nová zakázka"}
              </h2>

              <form onSubmit={saveJob} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>
                    Název projektu *
                    <input
                      required
                      maxLength={150}
                      className={inputClass}
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="Např. Portfolio web"
                    />
                  </label>

                  <label className={labelClass}>
                    Klient / typ projektu
                    <input
                      maxLength={150}
                      className={inputClass}
                      value={form.client}
                      onChange={(e) =>
                        setForm({ ...form, client: e.target.value })
                      }
                      placeholder="Např. Web Development"
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>
                    Popis česky
                    <textarea
                      rows={4}
                      maxLength={5000}
                      className={inputClass}
                      value={form.description_cs}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description_cs: e.target.value,
                        })
                      }
                      placeholder="Popis projektu v češtině"
                    />
                  </label>

                  <label className={labelClass}>
                    Description in English
                    <textarea
                      rows={4}
                      maxLength={5000}
                      className={inputClass}
                      value={form.description_en}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description_en: e.target.value,
                        })
                      }
                      placeholder="Project description in English"
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <label className={labelClass}>
                    Stav
                    <select
                      className={inputClass}
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="In development">
                        Probíhá vývoj
                      </option>
                      <option value="Waiting for customer">
                        Čeká na zákazníka
                      </option>
                      <option value="Completed">Dokončeno</option>
                      <option value="Cancelled">Zrušeno</option>
                    </select>
                  </label>

                  <label className={labelClass}>
                    Rozpočet (Kč)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className={inputClass}
                      value={form.budget}
                      onChange={(e) =>
                        setForm({ ...form, budget: e.target.value })
                      }
                    />
                  </label>

                  <label className={labelClass}>
                    Průběh: {form.progress} %
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      className="mt-5 w-full accent-blue-500"
                      value={form.progress}
                      onChange={(e) =>
                        setForm({ ...form, progress: e.target.value })
                      }
                    />

                    <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
                      <span>0 %</span>
                      <span>50 %</span>
                      <span>100 %</span>
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {saving
                      ? "Ukládání..."
                      : editingId
                        ? "Uložit změny"
                        : "Přidat zakázku"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-white/10 px-5 py-3 text-sm text-zinc-300 hover:bg-white/[0.05]"
                    >
                      Zrušit úpravy
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Existující zakázky
                </h2>

                <span className="text-xs text-zinc-500">
                  {jobs.length} celkem
                </span>
              </div>

              {jobs.length === 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] px-5 py-12 text-center text-sm text-zinc-500">
                  Zatím tu nejsou žádné zakázky.
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <article
                      key={job.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <h3 className="font-medium">{job.title}</h3>

                        <p className="mt-1 text-xs text-zinc-500">
                          {job.client || "Bez typu"} · {job.status} ·{" "}
                          {job.progress ?? 0} %
                        </p>

                        <p className="mt-2 text-xs text-zinc-400">
                          Rozpočet:{" "}
                          {Number(job.budget || 0).toLocaleString("cs-CZ")} Kč
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => startEdit(job)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.05]"
                        >
                          Upravit
                        </button>

                        <button
                          onClick={() => void deleteJob(job)}
                          className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30"
                        >
                          Smazat
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}