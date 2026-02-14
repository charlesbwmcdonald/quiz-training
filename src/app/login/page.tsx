import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params?.next ?? "/app";
  const error = params?.error;

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Sign in
      </h1>

      {error ? (
        <div
          style={{
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          <b>Login failed:</b> {error}
        </div>
      ) : null}

      <form action={login} style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="next" value={next} />

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: 12,
            borderRadius: 10,
            border: 0,
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
