import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";

export const metadata = { title: "Вход — Бюджет" };

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) redirect("/login?error=1");
    throw e; // NEXT_REDIRECT при успехе пробрасываем дальше
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Бюджет</h1>
        <p className="text-sm opacity-60">Вход в дашборд</p>
      </div>

      <form action={login} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-80">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-[15px] outline-none focus:border-white/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-80">Пароль</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-[15px] outline-none focus:border-white/30"
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            Неверный email или пароль.
          </p>
        ) : null}

        <button
          type="submit"
          className="h-11 rounded-lg bg-white px-4 text-[15px] font-medium text-black transition-opacity hover:opacity-90"
        >
          Войти
        </button>
      </form>
    </main>
  );
}
