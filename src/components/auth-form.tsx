"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = mode === "register"
      ? { name: fd.get("name"), email: fd.get("email"), password: fd.get("password") }
      : { email: fd.get("email"), password: fd.get("password") };
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível continuar.");
      router.push(mode === "register" ? "/onboarding" : data.onboardingDone ? "/app" : "/onboarding");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro inesperado."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && <label className="block"><span className="mb-1.5 block text-sm font-bold">Nome</span><input className="input" name="name" placeholder="Seu nome" autoComplete="name" required /></label>}
      <label className="block"><span className="mb-1.5 block text-sm font-bold">E-mail</span><input className="input" name="email" type="email" placeholder="voce@email.com" autoComplete="email" required /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-bold">Senha</span><input className="input" name="password" type="password" placeholder={mode === "register" ? "Mínimo de 8 caracteres" : "Sua senha"} autoComplete={mode === "register" ? "new-password" : "current-password"} required /></label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <button disabled={loading} className="btn-primary w-full disabled:opacity-60">{loading ? "Aguarde..." : mode === "register" ? "Criar minha conta" : "Entrar"}</button>
      <p className="text-center text-sm text-[#748683]">{mode === "register" ? "Já tem conta? " : "Ainda não tem conta? "}<Link className="font-black text-[#145c5a]" href={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Entrar" : "Criar conta"}</Link></p>
    </form>
  );
}
