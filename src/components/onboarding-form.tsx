"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm(){
  const router=useRouter(); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setErr("");const f=new FormData(e.currentTarget);const body=Object.fromEntries(f.entries());try{const r=await fetch('/api/onboarding',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Erro');router.push('/app');router.refresh();}catch(x){setErr(x instanceof Error?x.message:'Erro inesperado')}finally{setBusy(false)}}
  return <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
    <label><span className="mb-1.5 block text-sm font-bold">Idade</span><input name="age" type="number" className="input" min="14" max="100" required/></label>
    <label><span className="mb-1.5 block text-sm font-bold">Sexo biológico</span><select name="sex" className="input" required><option value="female">Feminino</option><option value="male">Masculino</option></select></label>
    <label><span className="mb-1.5 block text-sm font-bold">Altura (cm)</span><input name="heightCm" type="number" step="0.1" className="input" required/></label>
    <label><span className="mb-1.5 block text-sm font-bold">Peso (kg)</span><input name="weightKg" type="number" step="0.1" className="input" required/></label>
    <label><span className="mb-1.5 block text-sm font-bold">Objetivo</span><select name="goal" className="input"><option value="muscle_gain">Ganhar massa com controle de gordura</option><option value="maintain">Manter peso</option><option value="fat_loss">Reduzir gordura</option></select></label>
    <label><span className="mb-1.5 block text-sm font-bold">Atividade fora dos treinos</span><select name="baselineActivity" className="input"><option value="sedentary">Baixa</option><option value="light">Leve</option><option value="moderate">Moderada</option></select></label>
    {err&&<p className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{err}</p>}
    <div className="sm:col-span-2"><button disabled={busy} className="btn-primary w-full">{busy?'Salvando...':'Salvar e abrir meu painel'}</button></div>
  </form>
}
