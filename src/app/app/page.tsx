import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        App (Protected)
      </h1>
      <p>
        Logged in as: <b>{data.user?.email}</b>
      </p>
      <p style={{ marginTop: 12 }}>
        <a href="/logout">Logout</a>
      </p>
    </main>
  );
}
