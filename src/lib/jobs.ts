
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type DatabaseJob = {
  id: string;
  title: string;
  client: string;
  description: string;
  description_cs: string;
  description_en: string;
  status: string;
  budget: number;
  progress: number;
  created_at: string;
};

export async function getJobs(): Promise<DatabaseJob[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Chybí Supabase proměnné v .env.local");
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?select=id,title,client,description,description_cs,description_en,status,budget,progress,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Supabase chyba: ${response.status} ${await response.text()}`,
    );
  }

  return response.json() as Promise<DatabaseJob[]>;
}
