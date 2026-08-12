import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Требует вход. Возвращает сессию или уводит на /login. Использовать в защищённых страницах. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}
