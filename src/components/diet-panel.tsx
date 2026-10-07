"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, FileText, RefreshCw, Upload } from "lucide-react";

type DietMeal = {
  id: string;
  name: string;
  scheduledTime?: string | null;
  calories: string | number;
  items: string[];
  calculationNote?: string | null;
  completed: boolean;
};

type DietData = {
  document: { id: string; fileName: string; uploadedAt: string } | null;
  meals: DietMeal[];
  completedCount: number;
  totalCalories: number;
};

const today = () => new Date().toISOString().slice(0, 10);

export function DietPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<DietData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [calories, setCalories] = useState("");

  async function load() {
    const r = await fetch("/api/diet?date=" + today(), { cache: "no-store" });
    if (r.ok) setData(await r.json());
  }

  useEffect(() => { load(); }, []);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("Lendo o PDF e calculando as refeições...");
    const form = new FormData();
    form.append("file", file);
    const r = await fetch("/api/diet", { method: "POST", body: form });
    const result = await r.json();
    setBusy(false);
    if (!r.ok) {
      setMessage(result.error || "Não consegui processar o PDF.");
      return;
    }
    setMessage(`PDF importado: ${result.mealsFound} refeições identificadas.`);
    await load();
  }

  async function toggle(meal: DietMeal) {
    setData(prev => prev ? {
      ...prev,
      completedCount: prev.completedCount + (meal.completed ? -1 : 1),
      meals: prev.meals.map(m => m.id === meal.id ? { ...m, completed: !m.completed } : m)
    } : prev);

    const r = await fetch("/api/diet/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mealId: meal.id, completed: !meal.completed, logDate: today() })
    });
    if (!r.ok) await load();
  }

  async function saveCalories(mealId: string) {
    const value = Number(calories);
    if (!Number.isFinite(value) || value < 0) return;
    const r = await fetch("/api/diet", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mealId, calories: value })
    });
    if (r.ok) {
      setEditing(null);
      setCalories("");
      await load();
    }
  }

  const pct = data?.meals.length ? Math.round((data.completedCount / data.meals.length) * 100) : 0;
  const completedCalories = data?.meals
    .filter(m => m.completed)
    .reduce((sum, m) => sum + Number(m.calories), 0) || 0;

  return <div className="space-y-5">
    <section className="card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#145c5a]">Minha dieta</p>
          <h2 className="mt-1 text-2xl font-black">Importe seu plano alimentar em PDF</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71827f]">
            O app identifica as refeições, calcula as calorias quando o PDF traz calorias, macros ou quantidades reconhecíveis e monta seu checklist diário.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="application/pdf,.pdf"
            onChange={e => upload(e.target.files?.[0])}
          />
          <button
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            {busy ? <RefreshCw size={17} className="animate-spin"/> : <Upload size={17}/>}
            {data?.document ? "Trocar PDF" : "Adicionar PDF"}
          </button>
        </div>
      </div>
      {message && <div className="mt-4 rounded-xl bg-[#edf6f2] px-4 py-3 text-sm font-semibold text-[#315f55]">{message}</div>}
      {data?.document && <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#e2ebe8] bg-white px-4 py-3">
        <FileText size={19} className="text-[#145c5a]"/>
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{data.document.fileName}</p>
          <p className="text-xs text-[#7e8f8c]">Plano atual</p>
        </div>
      </div>}
    </section>

    {!data?.document ? <section className="card grid place-items-center gap-3 p-12 text-center">
      <FileText size={34} className="text-[#78928c]"/>
      <div>
        <p className="font-black">Nenhum plano alimentar importado</p>
        <p className="mt-1 text-sm text-[#7b8d89]">Adicione seu PDF para montar as refeições do dia.</p>
      </div>
    </section> : <>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-black uppercase tracking-[.15em] text-[#82928f]">Progresso hoje</p>
          <p className="mt-2 text-3xl font-black">{data.completedCount}/{data.meals.length}</p>
          <div className="mt-3 h-2 rounded-full bg-[#e8efed]">
            <div className="h-2 rounded-full bg-[#145c5a]" style={{ width: pct + "%" }}/>
          </div>
          <p className="mt-2 text-xs text-[#7c8d8a]">{pct}% das refeições concluídas</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-black uppercase tracking-[.15em] text-[#82928f]">Plano diário</p>
          <p className="mt-2 text-3xl font-black">{Math.round(data.totalCalories)} kcal</p>
          <p className="mt-2 text-xs text-[#7c8d8a]">Soma das refeições identificadas</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-black uppercase tracking-[.15em] text-[#82928f]">Já consumidas</p>
          <p className="mt-2 text-3xl font-black">{Math.round(completedCalories)} kcal</p>
          <p className="mt-2 text-xs text-[#7c8d8a]">Com base no seu checklist de hoje</p>
        </div>
      </section>

      <section className="space-y-3">
        {data.meals.map((meal, index) => <article key={meal.id} className={`card overflow-hidden transition ${meal.completed ? "ring-1 ring-[#9dcdbb]" : ""}`}>
          <div className="flex gap-4 p-5">
            <button
              onClick={() => toggle(meal)}
              className="mt-1 shrink-0 text-[#145c5a]"
              aria-label={meal.completed ? "Desmarcar refeição" : "Marcar refeição como concluída"}
            >
              {meal.completed ? <CheckCircle2 size={27}/> : <Circle size={27}/>}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.14em] text-[#8a9996]">Refeição {index + 1}</p>
                  <h3 className={`mt-1 text-lg font-black ${meal.completed ? "text-[#66807a]" : ""}`}>{meal.name}</h3>
                  {meal.scheduledTime && <p className="mt-1 text-xs font-bold text-[#6f827e]">{meal.scheduledTime}</p>}
                </div>
                <div className="sm:text-right">
                  {editing === meal.id ? <div className="flex gap-2">
                    <input
                      autoFocus
                      className="input w-28"
                      type="number"
                      min="0"
                      step="1"
                      value={calories}
                      onChange={e => setCalories(e.target.value)}
                    />
                    <button className="btn-primary" onClick={() => saveCalories(meal.id)}>Salvar</button>
                  </div> : <>
                    <p className="text-lg font-black">{Math.round(Number(meal.calories))} kcal</p>
                    <button
                      className="mt-1 text-xs font-bold text-[#35756b] underline"
                      onClick={() => { setEditing(meal.id); setCalories(String(Math.round(Number(meal.calories)))); }}
                    >
                      ajustar calorias
                    </button>
                  </>}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#f7f9f8] p-4">
                <p className="text-xs font-black uppercase tracking-[.12em] text-[#81918e]">Itens identificados</p>
                <div className="mt-2 space-y-1.5">
                  {meal.items.length ? meal.items.slice(0, 12).map((item, i) =>
                    <p key={i} className="text-sm leading-5 text-[#536662]">• {item}</p>
                  ) : <p className="text-sm text-[#7c8d8a]">Nenhum item detalhado.</p>}
                </div>
              </div>
              {meal.calculationNote && <p className="mt-3 text-xs leading-5 text-[#7b8d89]">{meal.calculationNote}</p>}
            </div>
          </div>
        </article>)}
      </section>
    </>}
  </div>;
}
