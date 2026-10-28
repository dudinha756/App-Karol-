"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ChevronUp, Circle, FileText, RefreshCw, Sparkles, Upload } from "lucide-react";

type Nutrition = { calories:number; protein:number; carbs:number; fat:number };

type DietOption = {
  id:string;
  name:string;
  defaultQuantity:string|number;
  referenceQuantity:string|number;
  unit:string;
  caloriesRef:string|number;
  proteinRef:string|number;
  carbsRef:string|number;
  fatRef:string|number;
  source:string;
  selected:boolean;
  quantity:number;
  nutrition:Nutrition;
};

type DietGroup = {
  id:string;
  name:string;
  selectionType:string;
  options:DietOption[];
  selectedOptionId:string|null;
};

type DietMeal = {
  id:string;
  name:string;
  scheduledTime?:string|null;
  calories:string|number;
  items:string[];
  calculationNote?:string|null;
  completed:boolean;
  groups:DietGroup[];
  hasChoiceGroups:boolean;
  selectedCount:number;
  nutrition:Nutrition;
};

type DietData = {
  document:{id:string;fileName:string;uploadedAt:string}|null;
  meals:DietMeal[];
  completedCount:number;
  totalCalories:number;
  selectedNutrition:Nutrition;
  completedNutrition:Nutrition;
};

const today=()=>{
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};

const zero=():Nutrition=>({calories:0,protein:0,carbs:0,fat:0});

function calcOption(option:DietOption,quantity:number):Nutrition{
  const reference=Number(option.referenceQuantity)||1;
  const factor=quantity/reference;
  return {
    calories:Number(option.caloriesRef||0)*factor,
    protein:Number(option.proteinRef||0)*factor,
    carbs:Number(option.carbsRef||0)*factor,
    fat:Number(option.fatRef||0)*factor
  };
}

function mealNutrition(meal:DietMeal,drafts:Record<string,string>):Nutrition{
  return meal.groups.flatMap(group=>group.options.filter(option=>option.selected)).reduce((sum,option)=>{
    const q=Number(drafts[option.id]??option.quantity);
    const n=calcOption(option,Number.isFinite(q)&&q>0?q:option.quantity);
    return {
      calories:sum.calories+n.calories,
      protein:sum.protein+n.protein,
      carbs:sum.carbs+n.carbs,
      fat:sum.fat+n.fat
    };
  },zero());
}

export function DietPanel({onNutritionChange}:{onNutritionChange?:()=>void}) {
  const inputRef=useRef<HTMLInputElement>(null);
  const [data,setData]=useState<DietData|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [choiceBusy,setChoiceBusy]=useState<string|null>(null);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [quantityDrafts,setQuantityDrafts]=useState<Record<string,string>>({});

  async function load(){
    const r=await fetch("/api/diet?date="+today(),{cache:"no-store"});
    if(r.ok){
      const next=await r.json();
      setData(next);
      setQuantityDrafts({});
      if(!expanded&&next.meals?.length)setExpanded(next.meals[0].id);
    }
  }

  useEffect(()=>{load()},[]);

  async function upload(file?:File){
    if(!file)return;
    setBusy(true);
    setMessage("Lendo o PDF e organizando seu plano...");
    const form=new FormData();
    form.append("file",file);
    const r=await fetch("/api/diet",{method:"POST",body:form});
    const result=await r.json();
    setBusy(false);
    if(!r.ok){setMessage(result.error||"Não consegui processar o PDF.");return}
    setMessage("PDF importado. Agora você pode escolher as opções de cada refeição.");
    await load();
  }

  async function chooseOption(meal:DietMeal,group:DietGroup,option:DietOption){
    setChoiceBusy(option.id);
    const selected=!option.selected;
    const quantity=Number(quantityDrafts[option.id]??option.quantity??option.defaultQuantity);

    const r=await fetch("/api/diet/choice",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        mealId:meal.id,
        groupId:group.id,
        optionId:option.id,
        selected,
        quantity,
        logDate:today()
      })
    });

    setChoiceBusy(null);
    if(!r.ok){
      const body=await r.json().catch(()=>({}));
      setMessage(body.error||"Não consegui salvar sua escolha.");
      return;
    }

    await load();
    if(meal.completed)onNutritionChange?.();
  }

  async function saveQuantity(meal:DietMeal,group:DietGroup,option:DietOption){
    if(!option.selected)return;
    const quantity=Number(quantityDrafts[option.id]??option.quantity);
    if(!Number.isFinite(quantity)||quantity<=0)return;

    setChoiceBusy(option.id);
    const r=await fetch("/api/diet/choice",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        mealId:meal.id,
        groupId:group.id,
        optionId:option.id,
        selected:true,
        quantity,
        logDate:today()
      })
    });
    setChoiceBusy(null);

    if(r.ok){
      await load();
      if(meal.completed)onNutritionChange?.();
    }
  }

  async function toggleMeal(meal:DietMeal){
    const allSelected=!meal.hasChoiceGroups||meal.groups.every(group=>Boolean(group.selectedOptionId));
    if(!meal.completed&&!allSelected){
      setMessage("Escolha uma opção em cada grupo antes de concluir a refeição.");
      setExpanded(meal.id);
      return;
    }

    setBusy(true);
    const r=await fetch("/api/diet/check",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({mealId:meal.id,completed:!meal.completed,logDate:today()})
    });
    setBusy(false);

    if(!r.ok){
      const body=await r.json().catch(()=>({}));
      setMessage(body.error||"Não consegui atualizar a refeição.");
      return;
    }

    await load();
    onNutritionChange?.();
  }

  const pct=data?.meals.length?Math.round((data.completedCount/data.meals.length)*100):0;

  return <div className="space-y-5">
    <section className="glow-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Minha dieta</p>
          <h2 className="page-title">Escolha o que você comeu em cada refeição</h2>
          <p className="page-copy">Selecione uma opção de cada grupo, ajuste a quantidade se necessário e o Forma day calcula calorias, proteína, carboidratos e gordura automaticamente.</p>
        </div>
        <div>
          <input ref={inputRef} className="hidden" type="file" accept="application/pdf,.pdf" onChange={e=>upload(e.target.files?.[0])}/>
          <button disabled={busy} onClick={()=>inputRef.current?.click()} className="btn-secondary inline-flex items-center gap-2">
            {busy?<RefreshCw size={17} className="animate-spin"/>:<Upload size={17}/>}
            {data?.document?"Trocar PDF":"Adicionar PDF"}
          </button>
        </div>
      </div>

      {message&&<div className="mt-4 rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-[#5d477c]">{message}</div>}

      {data?.document&&<div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e9e2f4] bg-white/80 px-4 py-3">
        <span className="forma-icon-bubble grid h-10 w-10 place-items-center rounded-xl"><FileText size={18}/></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#342250]">{data.document.fileName}</p>
          <p className="mt-0.5 text-xs text-[#8c819b]">Plano alimentar atual</p>
        </div>
      </div>}
    </section>

    {!data?.document?<section className="card grid place-items-center gap-3 p-12 text-center">
      <FileText size={34} className="text-[#9b8cac]"/>
      <div><p className="font-black">Nenhum plano alimentar importado</p><p className="mt-1 text-sm text-[#8c819b]">Adicione seu PDF para começar.</p></div>
    </section>:<>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="metric-card">
          <p className="metric-label">Refeições concluídas</p>
          <p className="metric-value">{data.completedCount}/{data.meals.length}</p>
          <div className="mt-3 h-2 rounded-full bg-[#eee9f8]"><div className="forma-progress h-2 rounded-full transition-all" style={{width:pct+"%"}}/></div>
          <p className="metric-help">{pct}% do dia</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Escolhido hoje</p>
          <p className="metric-value">{Math.round(data.selectedNutrition.calories)}</p>
          <p className="metric-help">kcal nas opções selecionadas</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Já consumido</p>
          <p className="metric-value">{Math.round(data.completedNutrition.calories)}</p>
          <p className="metric-help">kcal das refeições concluídas</p>
        </div>
      </section>

      <section className="space-y-3">
        {data.meals.map((meal,index)=>{
          const open=expanded===meal.id;
          const liveNutrition=mealNutrition(meal,quantityDrafts);
          const selectedGroups=meal.groups.filter(group=>group.selectedOptionId).length;
          const allSelected=!meal.hasChoiceGroups||selectedGroups===meal.groups.length;

          return <article key={meal.id} className={"card overflow-hidden transition "+(meal.completed?"ring-2 ring-[#d9cff8]":"")}>
            <button onClick={()=>setExpanded(open?null:meal.id)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
              <span className={"grid h-11 w-11 shrink-0 place-items-center rounded-2xl "+(meal.completed?"bg-[#f1edff] text-[#654cff]":"bg-[#faf7ff] text-[#9b8cac]")}>
                {meal.completed?<CheckCircle2 size={22}/>:<Circle size={22}/>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#9b8cac]">{"Refeição "+(index+1)+(meal.scheduledTime?" · "+meal.scheduledTime:"")}</p>
                <h3 className="mt-1 truncate text-lg font-black text-[#342250]">{meal.name}</h3>
                {meal.hasChoiceGroups&&<p className="mt-1 text-xs font-bold text-[#8c819b]">{selectedGroups}/{meal.groups.length} grupos escolhidos</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-black text-[#342250]">{Math.round(liveNutrition.calories)} kcal</p>
                <p className="mt-1 text-[10px] font-bold text-[#958aa5]">P {liveNutrition.protein.toFixed(1)} · C {liveNutrition.carbs.toFixed(1)} · G {liveNutrition.fat.toFixed(1)}</p>
              </div>
              {open?<ChevronUp size={18} className="shrink-0 text-[#8c819b]"/>:<ChevronDown size={18} className="shrink-0 text-[#8c819b]"/>}
            </button>

            {open&&<div className="border-t border-[#f0ebf7] p-4 sm:p-5">
              {meal.hasChoiceGroups?<div className="space-y-5">
                {meal.groups.map(group=><div key={group.id}>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#4b376a]">{group.name}</p>
                      <p className="mt-0.5 text-xs text-[#958aa5]">{group.options.length===1?"Marque este item se consumiu":"Escolha uma opção"}</p>
                    </div>
                    {group.selectedOptionId&&<span className="rounded-full bg-[#f1edff] px-2.5 py-1 text-[10px] font-black text-[#654cff]">escolhido</span>}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.options.map(option=>{
                      const effectiveQuantity=Number(quantityDrafts[option.id]??option.quantity);
                      const nutrition=calcOption(option,Number.isFinite(effectiveQuantity)?effectiveQuantity:option.quantity);
                      const pending=choiceBusy===option.id;

                      return <div key={option.id} className={"rounded-2xl border p-3 transition "+(option.selected?"border-[#bfb0f3] bg-[#f7f3ff] shadow-sm":"border-[#ece6f5] bg-white hover:border-[#d9cff2]")}>
                        <button disabled={pending} onClick={()=>chooseOption(meal,group,option)} className="flex w-full items-start gap-3 text-left">
                          <span className={"mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border "+(option.selected?"border-[#654cff] bg-[#654cff] text-white":"border-[#d6cce6] bg-white text-transparent")}>
                            {pending?<RefreshCw size={13} className="animate-spin"/>:<Check size={13}/>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-[#3d295c]">{option.name}</p>
                            <p className="mt-1 text-xs text-[#8c819b]">{Math.round(nutrition.calories)} kcal · {option.source}</p>
                          </div>
                        </button>

                        {option.selected&&<div className="mt-3 border-t border-[#e6ddf5] pt-3">
                          <label className="grid grid-cols-[1fr_auto] items-center gap-2">
                            <div>
                              <span className="mb-1 block text-[10px] font-black uppercase tracking-[.1em] text-[#958aa5]">Quantidade consumida</span>
                              <input
                                className="input py-2"
                                type="number"
                                min=".1"
                                max="5000"
                                step=".1"
                                value={quantityDrafts[option.id]??String(option.quantity)}
                                onChange={e=>setQuantityDrafts(prev=>({...prev,[option.id]:e.target.value}))}
                                onBlur={()=>saveQuantity(meal,group,option)}
                              />
                            </div>
                            <span className="mt-5 min-w-12 rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-[#655778]">{option.unit}</span>
                          </label>
                          <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
                            <MiniMacro label="kcal" value={Math.round(nutrition.calories).toString()}/>
                            <MiniMacro label="P" value={nutrition.protein.toFixed(1)+"g"}/>
                            <MiniMacro label="C" value={nutrition.carbs.toFixed(1)+"g"}/>
                            <MiniMacro label="G" value={nutrition.fat.toFixed(1)+"g"}/>
                          </div>
                        </div>}
                      </div>;
                    })}
                  </div>
                </div>)}

                <div className="rounded-2xl bg-gradient-to-r from-[#f5f1ff] to-[#fff2fa] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.12em] text-[#8d7ca2]">Total desta refeição</p>
                      <p className="mt-1 text-2xl font-black text-[#342250]">{Math.round(liveNutrition.calories)} kcal</p>
                      <p className="mt-1 text-xs text-[#817590]">P {liveNutrition.protein.toFixed(1)} g · C {liveNutrition.carbs.toFixed(1)} g · G {liveNutrition.fat.toFixed(1)} g</p>
                    </div>
                    <button
                      disabled={busy||(!meal.completed&&!allSelected)}
                      onClick={()=>toggleMeal(meal)}
                      className={meal.completed?"btn-secondary":"btn-primary"}
                    >
                      {meal.completed?"Desmarcar refeição":"Marcar como feita"}
                    </button>
                  </div>
                  {!allSelected&&!meal.completed&&<p className="mt-3 text-xs font-bold text-[#a06b8e]">Escolha uma opção em todos os grupos para concluir a refeição.</p>}
                </div>
              </div>:<div>
                <div className="rounded-2xl bg-[#faf8ff] p-4">
                  <p className="text-xs font-black uppercase tracking-[.12em] text-[#958aa5]">Itens do plano</p>
                  <div className="mt-2 space-y-1.5">{meal.items.map((item,i)=><p key={i} className="text-sm leading-5 text-[#655778]">• {item}</p>)}</div>
                </div>
                <button onClick={()=>toggleMeal(meal)} className={(meal.completed?"btn-secondary":"btn-primary")+" mt-4 w-full"}>{meal.completed?"Desmarcar refeição":"Marcar como feita"}</button>
              </div>}
            </div>}
          </article>;
        })}
      </section>

      <section className="card p-5">
        <div className="flex items-start gap-3">
          <span className="forma-icon-bubble grid h-10 w-10 shrink-0 place-items-center rounded-xl"><Sparkles size={18}/></span>
          <div>
            <p className="font-black text-[#3d295c]">Como os cálculos funcionam</p>
            <p className="mt-1 text-xs leading-5 text-[#817590]">Alimentos com correspondência na TACO usam os valores por 100 g e são recalculados pela quantidade escolhida. Preparações específicas da sua dieta usam os valores disponíveis no próprio plano e ficam identificadas pela fonte.</p>
          </div>
        </div>
      </section>
    </>}
  </div>;
}

function MiniMacro({label,value}:{label:string;value:string}){
  return <div className="rounded-lg bg-white px-1 py-2"><p className="text-[9px] font-black uppercase text-[#a196b0]">{label}</p><p className="mt-0.5 text-[11px] font-black text-[#4b376a]">{value}</p></div>;
}
