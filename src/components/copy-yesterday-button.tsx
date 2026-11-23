"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyYesterdayButton({ onCopied }: { onCopied: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function copy() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/meals/copy-yesterday", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível copiar.");
      setMessage(result.count + " alimento(s) copiado(s) de ontem.");
      onCopied();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao copiar.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="flex flex-col items-end gap-1">
    <button type="button" onClick={copy} disabled={busy} className="btn-secondary inline-flex items-center gap-2 text-xs disabled:opacity-60">
      <Copy size={15} />{busy ? "Copiando..." : "Repetir ontem"}
    </button>
    {message && <span className="max-w-52 text-right text-xs text-[#756986]" role="status">{message}</span>}
  </div>;
}
