"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode, inviteToken }: { mode: "login" | "register"; inviteToken?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [checkingInvite, setCheckingInvite] = useState(mode === "register");

  useEffect(() => {
    if (mode !== "register") return;

    if (!inviteToken) {
      setCheckingInvite(false);
      setError("O cadastro de novos usuários é feito por convite.");
      return;
    }

    fetch("/api/invitations/validate?token=" + encodeURIComponent(inviteToken), { cache: "no-store" })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.valid) throw new Error("Convite inválido ou expirado.");
        setInviteEmail(data.email);
      })
      .catch(err => setError(err instanceof Error ? err.message : "Convite inválido."))
      .finally(() => setCheckingInvite(false));
  }, [mode, inviteToken]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = mode === "register"
      ? { name: fd.get("name"), email: inviteEmail, password: fd.get("password"), inviteToken }
      : { email: fd.get("email"), password: fd.get("password") };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível continuar.");
      router.push(mode === "register" ? "/onboarding" : data.onboardingDone ? "/app" : "/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "register" && checkingInvite) {
    return <div className="rounded-2xl bg-[#f2f6f4] p-5 text-sm font-bold text-[#60736f]">Validando seu convite...</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && <>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Nome</span>
          <input className="input" name="name" placeholder="Seu nome" autoComplete="name" required disabled={!inviteEmail} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">E-mail convidado</span>
          <input className="input bg-[#f5f8f7]" value={inviteEmail} readOnly placeholder="Convite necessário" />
        </label>
      </>}

      {mode === "login" && <label className="block">
        <span className="mb-1.5 block text-sm font-bold">E-mail</span>
        <input className="input" name="email" type="email" placeholder="voce@email.com" autoComplete="email" required />
      </label>}

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Senha</span>
        <input className="input" name="password" type="password" placeholder={mode === "register" ? "Mínimo de 8 caracteres" : "Sua senha"} autoComplete={mode === "register" ? "new-password" : "current-password"} required disabled={mode === "register" && !inviteEmail} />
      </label>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

      <button disabled={loading || (mode === "register" && !inviteEmail)} className="btn-primary w-full disabled:opacity-60">
        {loading ? "Aguarde..." : mode === "register" ? "Concluir cadastro" : "Entrar"}
      </button>

      {mode === "register"
        ? <p className="text-center text-sm text-[#748683]">Já tem conta? <Link className="font-black text-[#145c5a]" href="/login">Entrar</Link></p>
        : <p className="text-center text-sm text-[#748683]">Ainda não tem conta? Peça um convite a quem administra o App Karol.</p>}
    </form>
  );
}
