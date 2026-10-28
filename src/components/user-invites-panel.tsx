"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Mail, RefreshCw, UserPlus } from "lucide-react";

type Invite = {
  id: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

export function UserInvitesPanel() {
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [createdFor, setCreatedFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/invitations", { cache: "no-store" });
    if (r.ok) setInvites(await r.json());
  }

  useEffect(() => { load(); }, []);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInviteUrl("");
    setCopied(false);

    const r = await fetch("/api/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);

    if (!r.ok) {
      setError(data.error || "Não consegui gerar o convite.");
      return;
    }

    setInviteUrl(data.inviteUrl);
    setCreatedFor(data.email);
    setEmail("");
    await load();
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const now = Date.now();

  return <div className="space-y-5">
    <section className="card p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f1edff] text-[#654cff]"><UserPlus size={20}/></span>
        <div className="flex-1">
          <p className="text-sm font-black text-[#654cff]">Convidar usuário</p>
          <h2 className="mt-1 text-2xl font-black">Gere um link de cadastro</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817590]">
            Informe o e-mail. O Forma day cria um link exclusivo, válido por 7 dias, para a pessoa concluir o próprio cadastro.
          </p>

          <form onSubmit={createInvite} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a196b0]"/>
              <input className="input pl-11" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@email.com" required/>
            </div>
            <button disabled={busy} className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap">
              {busy ? <RefreshCw size={17} className="animate-spin"/> : <Link2 size={17}/>}
              Gerar link
            </button>
          </form>

          {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          {inviteUrl && <div className="mt-4 rounded-2xl border border-[#dfd4f5] bg-[#faf7ff] p-4">
            <p className="text-xs font-black uppercase tracking-[.12em] text-[#817590]">Link criado para {createdFor}</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input className="input flex-1 bg-white text-sm" value={inviteUrl} readOnly/>
              <button type="button" onClick={copyLink} className="btn-secondary inline-flex items-center justify-center gap-2">
                {copied ? <Check size={17}/> : <Copy size={17}/>}
                {copied ? "Copiado" : "Copiar link"}
              </button>
            </div>
          </div>}
        </div>
      </div>
    </section>

    <section className="card overflow-hidden">
      <div className="border-b border-[#eee8f6] p-5">
        <h2 className="text-xl font-black">Convites recentes</h2>
        <p className="mt-1 text-sm text-[#8c819b]">Se perder um link, gere um novo convite para o mesmo e-mail.</p>
      </div>

      {invites.length ? invites.map(invite => {
        const expired = new Date(invite.expiresAt).getTime() < now;
        const status = invite.usedAt ? "Cadastro concluído" : expired ? "Expirado" : "Aguardando cadastro";
        return <div key={invite.id} className="flex flex-col gap-2 border-b border-[#f0ebf7] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black">{invite.email}</p>
            <p className="mt-1 text-xs text-[#8c819b]">Criado em {new Date(invite.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${invite.usedAt ? "bg-[#fff0fa] text-[#654cff]" : expired ? "bg-[#f6eeee] text-[#a14f78]" : "bg-[#fff7df] text-[#8b712f]"}`}>
            {status}
          </span>
        </div>;
      }) : <div className="p-10 text-center text-sm text-[#8c819b]">Nenhum convite gerado ainda.</div>}
    </section>
  </div>;
}
