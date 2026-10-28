"use client";

import { useEffect, useState } from "react";
import { Apple, CalendarDays, ClipboardList, Dumbbell, FileText, Home, LogOut, MoreHorizontal, Plus, TrendingUp, Users, X } from "lucide-react";
import { Logo } from "./logo";
import { DietPanel } from "./diet-panel";
import { FoodEntryForm } from "./food-entry-form";
import { UserInvitesPanel } from "./user-invites-panel";
import { CalendarPanel } from "./calendar-panel";
import { StrengthPanel } from "./strength-panel";

type Dash={
  profile:{name:string;weightKg:number;canInvite:boolean};
  summary:{consumed:number;exercise:number;maintenance:number;target:number;balance:number;protein:number;carbs:number;fat:number;proteinTarget:number;carbsTarget:number;fatTarget:number};
  foods:any[];
  workouts:any[];
  weightTrend:any[];
};

const today=function(){
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};

export function AppShell(){
  const [view,setView]=useState("Hoje");
  const [data,setData]=useState<Dash|null>(null);
  const [modal,setModal]=useState<"food"|"workout"|"weight"|null>(null);
  const [loading,setLoading]=useState(true);
  const [moreOpen,setMoreOpen]=useState(false);

  async function load(silent=false){
    if(!silent)setLoading(true);
    const r=await fetch("/api/dashboard?date="+today(),{cache:"no-store"});
    if(r.status===401){location.href="/login";return}
    const d=await r.json();
    setData(d);
    if(!silent)setLoading(false);
  }

  useEffect(function(){load()},[]);

  const desktopNav=[
    {name:"Hoje",icon:Home},
    {name:"Agenda",icon:CalendarDays},
    {name:"Alimentação",icon:Apple},
    {name:"Minha dieta",icon:FileText},
    {name:"Treinos",icon:Dumbbell},
    {name:"Musculação",icon:ClipboardList},
    {name:"Progresso",icon:TrendingUp},
    ...(data?.profile.canInvite?[{name:"Usuários",icon:Users}]:[])
  ];

  const mobilePrimary=[
    {name:"Hoje",icon:Home},
    {name:"Agenda",icon:CalendarDays},
    {name:"Alimentação",icon:Apple},
    {name:"Treinos",icon:Dumbbell}
  ];

  const moreItems=[
    {name:"Minha dieta",icon:FileText,description:"Plano alimentar e checklist"},
    {name:"Musculação",icon:ClipboardList,description:"Ficha, cargas e evolução"},
    {name:"Progresso",icon:TrendingUp,description:"Peso e tendência"},
    ...(data?.profile.canInvite?[{name:"Usuários",icon:Users,description:"Convites e acessos"}]:[])
  ];

  const moreActive=moreItems.some(function(x){return x.name===view});

  function chooseView(name:string){
    setView(name);
    setMoreOpen(false);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function logout(){
    await fetch("/api/auth/logout",{method:"POST"});
    location.href="/";
  }

  return <div className="min-h-screen forma-shell">
    <aside className="forma-sidebar fixed inset-y-0 left-0 hidden w-64 border-r bg-white p-5 lg:block">
      <Logo/>
      <div className="mt-8">
        <p className="px-3 text-[10px] font-black uppercase tracking-[.18em] text-[#aea3bb]">Navegação</p>
        <nav className="mt-2 space-y-1">
          {desktopNav.map(function(item){
            const Icon=item.icon;
            return <button key={item.name} onClick={function(){chooseView(item.name)}} className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition "+(view===item.name?"bg-[#f1edff] text-[#654cff]":"text-[#83778f] hover:bg-[#f8f5ff]")}>
              <Icon size={18}/>{item.name}
            </button>
          })}
        </nav>
      </div>
      <div className="absolute bottom-5 left-5 right-5 border-t border-[#f0ebf7] pt-3">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#8a5b5b] hover:bg-red-50"><LogOut size={18}/>Sair</button>
      </div>
    </aside>

    <main className="pb-28 lg:ml-64 lg:pb-8">
      <header className="forma-header sticky top-0 z-20 border-b px-4 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="lg:hidden"><Logo compact/></div>
          <div className="min-w-0 flex-1 lg:flex-none">
            <p className="hidden text-xs font-black uppercase tracking-[.18em] text-[#958aa5] lg:block">Forma day</p>
            <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">{view}</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={function(){setModal("food")}} className="btn-secondary hidden items-center gap-2 sm:inline-flex"><Plus size={16}/>Refeição</button>
            <button onClick={function(){setModal("workout")}} className="btn-primary inline-flex items-center gap-2"><Plus size={16}/><span>Treino</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        {loading||!data
          ? <div className="card p-10 text-center text-[#817590]">Carregando seu painel...</div>
          : <View name={view} data={data} setModal={setModal} refresh={function(){load(true)}}/>}
      </div>
    </main>

    <nav className="mobile-nav lg:hidden">
      {mobilePrimary.map(function(item){
        const Icon=item.icon;
        return <button key={item.name} onClick={function(){chooseView(item.name)}} className={"mobile-nav-item "+(view===item.name?"mobile-nav-active":"")}>
          <Icon size={19}/><span>{item.name}</span>
        </button>
      })}
      <button onClick={function(){setMoreOpen(true)}} className={"mobile-nav-item "+(moreActive?"mobile-nav-active":"")}>
        <MoreHorizontal size={20}/><span>Mais</span>
      </button>
    </nav>

    {moreOpen&&<div className="modal-backdrop lg:hidden" onClick={function(){setMoreOpen(false)}}>
      <div className="modal-sheet" onClick={function(e){e.stopPropagation()}}>
        <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Mais recursos</p><h2 className="text-xl font-black">O que você quer abrir?</h2></div><button onClick={function(){setMoreOpen(false)}} className="icon-btn"><X size={18}/></button></div>
        <div className="grid gap-2">
          {moreItems.map(function(item){
            const Icon=item.icon;
            return <button key={item.name} onClick={function(){chooseView(item.name)}} className="flex items-center gap-3 rounded-2xl border border-[#eee8f6] p-4 text-left hover:bg-[#faf7ff]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f1edff] text-[#654cff]"><Icon size={19}/></span>
              <div><p className="font-black">{item.name}</p><p className="mt-1 text-xs text-[#817590]">{item.description}</p></div>
            </button>
          })}
        </div>
      </div>
    </div>}

    {modal&&<EntryModal type={modal} close={function(){setModal(null)}} done={function(){setModal(null);load(true)}} weight={data?.profile.weightKg||50}/>}
  </div>;
}

function Ring({value,max,label}:{value:number;max:number;label:string}){
  const p=Math.min(100,Math.round(value/max*100||0));
  return <div>
    <div className="mb-1 flex justify-between text-xs font-bold"><span>{label}</span><span>{Math.round(value)+" / "+Math.round(max)+" g"}</span></div>
    <div className="h-2 rounded-full bg-[#eee9f8]"><div className="forma-progress h-2 rounded-full transition-all" style={{width:p+"%"}}/></div>
  </div>;
}

function View({name,data,setModal,refresh}:{name:string;data:Dash;setModal:(x:any)=>void;refresh:()=>void}){
  const s=data.summary;

  if(name==="Agenda")return <CalendarPanel/>;
  if(name==="Minha dieta")return <DietPanel onNutritionChange={refresh}/>;
  if(name==="Musculação")return <StrengthPanel/>;
  if(name==="Usuários")return <UserInvitesPanel/>;

  if(name==="Hoje"){
    const firstName=(data.profile.name||"").trim().split(" ")[0]||"você";
    const calorieProgress=Math.min(100,Math.round((s.consumed/(s.target||1))*100));
    return <div className="space-y-5">
      <section className="glow-card relative overflow-hidden p-5 sm:p-7">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#acd0ff]/35 blur-3xl"/>
        <div className="absolute -bottom-20 left-1/4 h-44 w-44 rounded-full bg-[#ff6cd2]/20 blur-3xl"/>
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="eyebrow">Seu dia no Forma day</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#29154a] sm:text-4xl">Oi, {firstName}. <span className="bg-gradient-to-r from-[#654cff] to-[#ff6cd2] bg-clip-text text-transparent">Vamos cuidar de hoje?</span></h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#7c718c]">Nutrição, movimento e evolução em uma visão simples para você saber onde está e qual é o próximo passo.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={function(){setModal("food")}} className="btn-primary inline-flex items-center gap-2"><Plus size={16}/>Registrar refeição</button>
              <button onClick={function(){setModal("workout")}} className="btn-secondary inline-flex items-center gap-2"><Dumbbell size={16}/>Registrar treino</button>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-[#674eff] via-[#8961ff] to-[#ed70ce] p-5 text-white shadow-[0_18px_45px_rgba(101,76,255,.22)]">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-black uppercase tracking-[.14em] text-white/70">Progresso alimentar</p><p className="mt-2 text-4xl font-black">{calorieProgress}%</p></div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">{Math.round(s.consumed)} / {Math.round(s.target)} kcal</span>
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{width:calorieProgress+"%"}}/></div>
            <p className="mt-3 text-xs leading-5 text-white/75">Acompanhe a tendência do dia sem precisar fazer conta manual.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {[["Consumidas",s.consumed,"kcal"],["Gasto estimado",s.maintenance,"kcal"],["Saldo",s.balance,"kcal"]].map(function(item){
          const l=item[0],v=item[1] as number,u=item[2];
          return <div className="metric-card" key={String(l)}><p className="metric-label">{l}</p><div className="metric-value">{Math.round(v)}</div><p className="metric-help">{u}</p></div>
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="card p-5 sm:p-6">
          <div className="flex justify-between gap-3">
            <div><p className="eyebrow">Macros do dia</p><h2 className="mt-1 text-2xl font-black text-[#342250]">Seu equilíbrio nutricional</h2></div>
            <span className="h-fit rounded-full bg-[#fff0fa] px-3 py-1 text-xs font-black text-[#df4db0]">meta diária</span>
          </div>
          <div className="mt-6 space-y-4">
            <Ring value={s.protein} max={s.proteinTarget} label="Proteína"/>
            <Ring value={s.carbs} max={s.carbsTarget} label="Carboidratos"/>
            <Ring value={s.fat} max={s.fatTarget} label="Gorduras"/>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <p className="eyebrow">Ações rápidas</p>
          <div className="mt-4 grid gap-2">
            <button onClick={function(){setModal("food")}} className="quick-action"><Plus size={17}/>Registrar refeição</button>
            <button onClick={function(){setModal("workout")}} className="quick-action"><Plus size={17}/>Registrar atividade</button>
            <button onClick={function(){setModal("weight")}} className="quick-action"><Plus size={17}/>Atualizar peso</button>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#958aa5]">Pequenos registros deixam sua evolução mais fácil de enxergar.</p>
        </div>
      </section>
    </div>;
  }

  if(name==="Alimentação")return <section className="card overflow-hidden">
    <div className="flex items-center justify-between gap-3 border-b border-[#eee8f6] p-4 sm:p-5">
      <div><h2 className="text-xl font-black">Refeições de hoje</h2><p className="text-sm text-[#8c819b]">{data.foods.length+" itens registrados"}</p></div>
      <button onClick={function(){setModal("food")}} className="btn-primary shrink-0">+ Adicionar</button>
    </div>
    {data.foods.length?data.foods.map(function(f:any){return <div key={f.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#f0ebf7] p-4 sm:p-5">
      <div className="min-w-0"><p className="truncate font-black">{f.name}</p><p className="mt-1 text-xs text-[#8c819b]">{f.mealType+" · "+f.quantity+" "+f.unit}</p></div>
      <div className="text-right"><p className="font-black">{Math.round(+f.calories)+" kcal"}</p><p className="text-xs text-[#8c819b]">{"P "+Math.round(+f.protein)+" · C "+Math.round(+f.carbs)+" · G "+Math.round(+f.fat)}</p></div>
    </div>}):<Empty icon={Apple} text="Nenhuma refeição registrada hoje."/>}
  </section>;

  if(name==="Treinos")return <section className="card overflow-hidden">
    <div className="flex items-center justify-between gap-3 border-b border-[#eee8f6] p-4 sm:p-5">
      <div><h2 className="text-xl font-black">Atividades de hoje</h2><p className="text-sm text-[#8c819b]">{Math.round(s.exercise)+" kcal de exercício estimadas"}</p></div>
      <button onClick={function(){setModal("workout")}} className="btn-primary shrink-0">+ Adicionar</button>
    </div>
    {data.workouts.length?data.workouts.map(function(w:any){return <div key={w.id} className="flex items-center justify-between gap-4 border-b border-[#f0ebf7] p-4 sm:p-5">
      <div><p className="font-black">{w.type}</p><p className="text-xs text-[#8c819b]">{w.durationMinutes+" min · "+w.intensity}</p></div>
      <div className="shrink-0 text-right font-black">{"≈ "+Math.round(+w.caloriesEstimated)+" kcal"}</div>
    </div>}):<Empty icon={Dumbbell} text="Nenhuma atividade registrada hoje."/>}
  </section>;

  return <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
    <section className="card p-5 sm:p-6">
      <h2 className="text-xl font-black">Evolução de peso</h2>
      <p className="mt-1 text-sm text-[#8c819b]">Últimos registros</p>
      <div className="mt-6 flex h-48 items-end gap-2">
        {data.weightTrend.length?data.weightTrend.map(function(x:any,i:number){
          const vals=data.weightTrend.map(function(z:any){return +z.weightKg});
          const mn=Math.min.apply(null,vals)-.5,mx=Math.max.apply(null,vals)+.5;
          const h=25+((+x.weightKg-mn)/(mx-mn||1))*70;
          return <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-[#8d63ff]" style={{height:h+"%"}}/><span className="text-[10px] font-bold text-[#8c819b]">{+x.weightKg}</span></div>
        }):<p className="m-auto text-sm text-[#8c819b]">Registre seu peso para ver a tendência.</p>}
      </div>
    </section>

    <section className="card p-5 sm:p-6">
      <p className="eyebrow">Peso atual</p>
      <div className="mt-2 kpi-number text-5xl font-black">{data.profile.weightKg}<span className="ml-1 text-lg">kg</span></div>
      <button onClick={function(){setModal("weight")}} className="btn-primary mt-6 w-full">Atualizar peso</button>
    </section>
  </div>;
}

function Empty({icon:Icon,text}:{icon:any;text:string}){
  return <div className="grid place-items-center gap-3 p-10 text-center text-[#8c819b] sm:p-12"><Icon size={28}/><p className="text-sm">{text}</p></div>;
}

function EntryModal({type,close,done,weight}:{type:"food"|"workout"|"weight";close:()=>void;done:()=>void;weight:number}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true);
    setError("");
    const body=Object.fromEntries(new FormData(e.currentTarget).entries());
    const url=type==="workout"?"/api/workouts":"/api/progress";
    const r=await fetch(url,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(Object.assign({},body,{logDate:today(),weightKg:type==="weight"?body.weightKg:undefined,currentWeightKg:weight}))
    });
    const result=await r.json().catch(function(){return {}});
    setBusy(false);
    if(r.ok)done(); else setError(result.error||"Não consegui salvar.");
  }

  return <div className="modal-backdrop">
    <div className="modal-sheet">
      <div className="mb-5 flex items-center justify-between">
        <div><p className="eyebrow">{type==="food"?"Alimentação":type==="workout"?"Atividade":"Progresso"}</p><h2 className="text-xl font-black">{type==="food"?"Adicionar refeição":type==="workout"?"Registrar atividade":"Atualizar peso"}</h2></div>
        <button onClick={close} className="icon-btn"><X size={19}/></button>
      </div>

      {type==="food"?<FoodEntryForm done={done}/>:<form onSubmit={submit} className="grid gap-3">
        {error&&<div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        {type==="workout"&&<>
          <label><span className="field-label">Tipo</span><select className="input" name="type"><option>Musculação</option><option>Jiu-jitsu</option><option>Muay Thai</option><option>Corrida</option><option>Caminhada</option><option>Outro</option></select></label>
          <label><span className="field-label">Duração</span><input className="input" name="durationMinutes" type="number" min="1" placeholder="Minutos" required/></label>
          <label><span className="field-label">Intensidade</span><select className="input" name="intensity"><option value="moderate">Moderada</option><option value="light">Leve</option><option value="high">Alta</option></select></label>
        </>}
        {type==="weight"&&<label><span className="field-label">Peso (kg)</span><input className="input" name="weightKg" type="number" step=".1" defaultValue={weight} required/></label>}
        <button disabled={busy} className="btn-primary mt-2 w-full">{busy?"Salvando...":"Salvar"}</button>
      </form>}
    </div>
  </div>;
}
