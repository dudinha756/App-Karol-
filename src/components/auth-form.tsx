"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";

export function AuthForm({ mode, inviteToken }: { mode: "login" | "register"; inviteToken?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [checkingInvite, setCheckingInvite] = useState(mode === "register" && Boolean(inviteToken));
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (mode !== "register") return;

    if (!inviteToken) return;

    fetch("/api/invitations/validate?token=" + encodeURIComponent(inviteToken), { cache: "no-store" })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.valid) throw new Error("Convite inválido ou expirado.");
        setInviteEmail(data.email);
      })
      .catch(() => {
        setInviteEmail("");
        setError("Não foi possível validar o convite. Você ainda pode criar sua conta normalmente.");
      })
      .finally(() => setCheckingInvite(false));
  }, [mode, inviteToken]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (mode === "register" && fd.get("password") !== fd.get("confirmPassword")) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);

    const body = mode === "register"
      ? {
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          ...(inviteEmail ? { inviteToken } : {})
        }
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
    return <div className="rounded-2xl bg-[#f7f3ff] p-5 text-sm font-bold text-[#756986]">Validando seu convite...</div>;
  }

  if (mode === "login" && forgotOpen) {
    return <PasswordResetFlow close={() => setForgotOpen(false)} />;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && <>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Nome</span>
          <input className="input" name="name" placeholder="Seu nome" autoComplete="name" minLength={2} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">{inviteEmail ? "E-mail do convite" : "E-mail"}</span>
          {inviteEmail
            ? <input className="input bg-[#f5f8f7]" name="email" type="email" value={inviteEmail} autoComplete="email" readOnly required />
            : <input className="input" name="email" type="email" placeholder="voce@email.com" autoComplete="email" required />}
        </label>
      </>}

      {mode === "login" && <label className="block">
        <span className="mb-1.5 block text-sm font-bold">E-mail</span>
        <input className="input" name="email" type="email" placeholder="voce@email.com" autoComplete="email" required />
      </label>}

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-sm font-bold">Senha</span>
          {mode === "login" && <button
            type="button"
            onClick={() => { setError(""); setForgotOpen(true); }}
            className="text-xs font-black text-[#654cff] hover:underline"
          >
            Esqueci minha senha
          </button>}
        </div>
        <input className="input" name="password" type="password" placeholder={mode === "register" ? "Mínimo de 8 caracteres" : "Sua senha"} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : undefined} required />
      </label>

      {mode === "register" && <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Confirmar senha</span>
        <input className="input" name="confirmPassword" type="password" placeholder="Repita sua senha" autoComplete="new-password" minLength={8} required />
      </label>}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

      <button disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? "Aguarde..." : mode === "register" ? "Concluir cadastro" : "Entrar"}
      </button>

      {mode === "register"
        ? <p className="text-center text-sm text-[#8c819b]">Já tem conta? <Link className="font-black text-[#654cff]" href="/login">Entrar</Link></p>
        : <p className="text-center text-sm text-[#8c819b]">Ainda não tem conta? <Link className="font-black text-[#654cff]" href="/register">Criar conta gratuitamente</Link></p>}
    </form>
  );
}

function PasswordResetFlow({ close }: { close: () => void }) {
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível enviar o código.");
      setMessage(data.message || "Se esse e-mail estiver cadastrado, enviaremos um código.");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, password })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível redefinir a senha.");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return <div className="text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f1edff] text-[#654cff]">
        <CheckCircle2 size={26} />
      </span>
      <h2 className="mt-4 text-xl font-black">Senha redefinida</h2>
      <p className="mt-2 text-sm leading-6 text-[#7c718c]">Sua nova senha já está ativa. Você pode voltar e entrar normalmente.</p>
      <button type="button" onClick={close} className="btn-primary mt-6 w-full">Voltar para o login</button>
    </div>;
  }

  return <div>
    <button type="button" onClick={step === "code" ? () => setStep("email") : close} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#655778]">
      <ArrowLeft size={16} /> Voltar
    </button>

    <div className="mb-5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f1edff] text-[#654cff]">
        {step === "email" ? <Mail size={19}/> : <KeyRound size={19}/>}
      </span>
      <h2 className="mt-4 text-2xl font-black">{step === "email" ? "Recuperar senha" : "Digite o código"}</h2>
      <p className="mt-2 text-sm leading-6 text-[#7c718c]">
        {step === "email"
          ? "Informe o e-mail da sua conta. Enviaremos um código de 6 dígitos para confirmar sua identidade."
          : "Use o código recebido por e-mail e escolha uma nova senha. O código expira em 10 minutos."}
      </p>
    </div>

    {step === "email" ? <form onSubmit={requestCode} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">E-mail</span>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" required autoFocus />
      </label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <button disabled={loading} className="btn-primary w-full">{loading ? "Enviando..." : "Enviar código"}</button>
    </form> : <form onSubmit={resetPassword} className="space-y-4">
      {message && <p className="rounded-xl bg-[#f6f2ff] p-3 text-sm font-semibold text-[#5d477c]">{message}</p>}
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Código de 6 dígitos</span>
        <input className="input text-center text-xl font-black tracking-[.28em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required autoFocus />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Nova senha</span>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" required />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Confirmar nova senha</span>
        <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" autoComplete="new-password" required />
      </label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <button disabled={loading || code.length !== 6} className="btn-primary w-full">{loading ? "Redefinindo..." : "Redefinir senha"}</button>
      <button disabled={loading} type="button" onClick={() => requestCode()} className="btn-secondary w-full">Enviar novo código</button>
    </form>}
  </div>;
}
