"use client";
import { useEffect,useMemo,useState } from "react";
import { Activity, Apple, BarChart3, Dumbbell, FileText, Home, LogOut, Plus, Settings, TrendingUp, X } from "lucide-react";
import { Logo } from "./logo";
import { DietPanel } from "./diet-panel";

type Dash={profile:{name:string;weightKg:number};summary:{consumed:number;exercise:number;maintenance:number;target:number;balance:number;protein:number;carbs:number;fat:number;proteinTarget:number;carbsTarget:number;fatTarget:number};foods:any[];workouts:any[];weightTrend:any[]};
const today=()=>new Date().toISOString().slice(0,10);
export function AppShell(){
 const [view,setView]=useState('Hoje');const [data,setData]=useState<Dash|null>(null);const [modal,setModal]=useState<'food'|'workout'|'weight'|null>(null);const [loading,setLoading]=useState(true);
 async function load(silent=false){if(!silent)setLoading(true);const r=await fetch('/api/dashboard?date='+today(),{cache:'no-store'});if(r.status===401){location.href='/login';return}const d=await r.json();setData(d);if(!silent)setLoading(false)}
 useEffect(()=>{load()},[]);
 const nav=[['Hoje',Home],['Minha dieta',FileText],['Alimentação',Apple],['Treinos',Dumbbell],['Progresso',TrendingUp]] as const;
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});location.href='/'}
 return <div className="min-h-screen bg-[#f6f8f7]">
  <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#e2eae8] bg-white p-5 lg:block"><Logo/><nav className="mt-9 space-y-1">{nav.map(([n,I])=><button key={n} onClick={()=>setView(n)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${view===n?'bg-[#e7f3ee] text-[#145c5a]':'text-[#647673] hover:bg-[#f4f7f6]'}`}><I size={18}/>{n}</button>)}</nav><div className="absolute bottom-5 left-5 right-5"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#647673] hover:bg-[#f4f7f6]"><Settings size={18}/>Configurações</button><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#8a5b5b] hover:bg-red-50"><LogOut size={18}/>Sair</button></div></aside>
  <main className="pb-24 lg:ml-64 lg:pb-8"><header className="sticky top-0 z-20 border-b border-[#e3ebe8] bg-[#f6f8f7]/90 px-5 py-4 backdrop-blur sm:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between"><div className="lg:hidden"><Logo compact/></div><div><p className="hidden text-xs font-black uppercase tracking-[.18em] text-[#7f918e] lg:block">Forma</p><h1 className="text-xl font-black tracking-tight">{view}</h1></div><div className="flex gap-2"><button onClick={()=>setModal('food')} className="btn-secondary hidden sm:inline-flex items-center gap-2"><Plus size={16}/>Refeição</button><button onClick={()=>setModal('workout')} className="btn-primary inline-flex items-center gap-2"><Plus size={16}/>Treino</button></div></div></header>
  <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">{loading||!data?<div className="card p-10 text-center text-[#6f817e]">Carregando seu painel...</div>:<View name={view} data={data} setModal={setModal}/>}</div></main>
  <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#dfe8e5] bg-white px-2 py-2 lg:hidden">{nav.map(([n,I])=><button key={n} onClick={()=>setView(n)} className={`grid place-items-center gap-1 rounded-xl py-2 text-[11px] font-bold ${view===n?'text-[#145c5a]':'text-[#7d8d8a]'}`}><I size={19}/>{n}</button>)}</nav>
  {modal&&<EntryModal type={modal} close={()=>setModal(null)} done={()=>{setModal(null);load(true)}} weight={data?.profile.weightKg||50}/>} </div>
}
function Ring({value,max,label}:{value:number;max:number;label:string}){const p=Math.min(100,Math.round(value/max*100||0));return <div><div className="mb-1 flex justify-between text-xs font-bold"><span>{label}</span><span>{Math.round(value)} / {Math.round(max)} g</span></div><div className="h-2 rounded-full bg-[#e8efed]"><div className="h-2 rounded-full bg-[#145c5a]" style={{width:p+'%'}}/></div></div>}
function View({name,data,setModal}:{name:string;data:Dash;setModal:(x:any)=>void}){const s=data.summary;
 if(name==='Minha dieta')return <DietPanel/>;
 if(name==='Hoje')return <div className="space-y-5"><section className="grid gap-4 md:grid-cols-3">{[["Consumidas",s.consumed,"kcal"],["Gasto estimado",s.maintenance,"kcal"],["Saldo",s.balance,"kcal"]].map(([l,v,u]:any)=><div className="card p-5" key={l}><p className="text-xs font-black uppercase tracking-[.15em] text-[#82928f]">{l}</p><div className="mt-2 kpi-number text-4xl font-black">{Math.round(v)}</div><p className="mt-1 text-xs text-[#7f918e]">{u}</p></div>)}</section><section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="card p-6"><div className="flex justify-between"><div><p className="text-sm font-black text-[#145c5a]">Meta do dia</p><h2 className="mt-1 text-2xl font-black">{Math.round(s.target)} kcal</h2></div><span className="h-fit rounded-full bg-[#e3f3ec] px-3 py-1 text-xs font-black text-[#145c5a]">estimativa</span></div><div className="mt-6 space-y-4"><Ring value={s.protein} max={s.proteinTarget} label="Proteína"/><Ring value={s.carbs} max={s.carbsTarget} label="Carboidratos"/><Ring value={s.fat} max={s.fatTarget} label="Gorduras"/></div></div><div className="card p-6"><p className="text-sm font-black">Ações rápidas</p><div className="mt-4 grid gap-3"><button onClick={()=>setModal('food')} className="btn-secondary text-left">+ Registrar refeição</button><button onClick={()=>setModal('workout')} className="btn-secondary text-left">+ Registrar treino</button><button onClick={()=>setModal('weight')} className="btn-secondary text-left">+ Atualizar peso</button></div><p className="mt-4 text-xs leading-5 text-[#80918e]">O gasto de exercício é estimado por MET e peso corporal. Use a tendência de semanas como referência principal.</p></div></section></div>;
 if(name==='Alimentação')return <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-[#e7eeec] p-5"><div><h2 className="text-xl font-black">Refeições de hoje</h2><p className="text-sm text-[#768885]">{data.foods.length} itens registrados</p></div><button onClick={()=>setModal('food')} className="btn-primary">+ Adicionar</button></div>{data.foods.length?data.foods.map((f:any)=><div key={f.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#edf2f0] p-5"><div><p className="font-black">{f.name}</p><p className="mt-1 text-xs text-[#7d8e8b]">{f.mealType} · {f.quantity} {f.unit}</p></div><div className="text-right"><p className="font-black">{Math.round(+f.calories)} kcal</p><p className="text-xs text-[#7d8e8b]">P {Math.round(+f.protein)} · C {Math.round(+f.carbs)} · G {Math.round(+f.fat)}</p></div></div>):<Empty icon={Apple} text="Nenhuma refeição registrada hoje."/>}</section>;
 if(name==='Treinos')return <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-[#e7eeec] p-5"><div><h2 className="text-xl font-black">Treinos de hoje</h2><p className="text-sm text-[#768885]">{Math.round(s.exercise)} kcal de exercício estimadas</p></div><button onClick={()=>setModal('workout')} className="btn-primary">+ Adicionar</button></div>{data.workouts.length?data.workouts.map((w:any)=><div key={w.id} className="flex items-center justify-between border-b border-[#edf2f0] p-5"><div><p className="font-black">{w.type}</p><p className="text-xs text-[#7d8e8b]">{w.durationMinutes} min · {w.intensity}</p></div><div className="text-right font-black">≈ {Math.round(+w.caloriesEstimated)} kcal</div></div>):<Empty icon={Dumbbell} text="Nenhum treino registrado hoje."/>}</section>;
 return <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]"><section className="card p-6"><h2 className="text-xl font-black">Evolução de peso</h2><p className="mt-1 text-sm text-[#758783]">Últimos registros</p><div className="mt-6 flex h-48 items-end gap-2">{data.weightTrend.length?data.weightTrend.map((x:any,i:number)=>{const vals=data.weightTrend.map((z:any)=>+z.weightKg);const mn=Math.min(...vals)-.5,mx=Math.max(...vals)+.5;const h=25+((+x.weightKg-mn)/(mx-mn||1))*70;return <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-[#79b9a2]" style={{height:h+'%'}}/><span className="text-[10px] font-bold text-[#748683]">{+x.weightKg}</span></div>}):<p className="m-auto text-sm text-[#7a8c89]">Registre seu peso para ver a tendência.</p>}</div></section><section className="card p-6"><p className="text-sm font-black text-[#145c5a]">Peso atual</p><div className="mt-2 kpi-number text-5xl font-black">{data.profile.weightKg}<span className="ml-1 text-lg">kg</span></div><button onClick={()=>setModal('weight')} className="btn-primary mt-6 w-full">Atualizar peso</button></section></div>}
function Empty({icon:Icon,text}:{icon:any;text:string}){return <div className="grid place-items-center gap-3 p-12 text-center text-[#7c8d8a]"><Icon size={28}/><p className="text-sm">{text}</p></div>}
type SavedFood={
 id:string;name:string;referenceQuantity:string;referenceUnit:string;
 calories:string;protein:string;carbs:string;fat:string
};

function EntryModal({type,close,done,weight}:{type:'food'|'workout'|'weight';close:()=>void;done:()=>void;weight:number}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [foodMode,setFoodMode]=useState<'saved'|'new'|'manual'>('saved');
 const [foods,setFoods]=useState<SavedFood[]>([]);
 const [selectedFoodId,setSelectedFoodId]=useState("");
 const [quantity,setQuantity]=useState("");
 const [mealType,setMealType]=useState("Café da manhã");
 const [newFood,setNewFood]=useState({name:"",referenceQuantity:"100",referenceUnit:"g",calories:"",protein:"",carbs:"",fat:""});
 
 useEffect(()=>{
   if(type!=='food')return;
   fetch('/api/food-library',{cache:'no-store'})
    .then(r=>r.ok?r.json():[])
    .then((rows:SavedFood[])=>{
      setFoods(rows);
      if(rows.length&&!selectedFoodId){
        setSelectedFoodId(rows[0].id);
        setQuantity(String(rows[0].referenceQuantity));
      }
    });
 },[type]);

 const selected=foods.find(f=>f.id===selectedFoodId);
 const preview=useMemo(()=>{
   if(!selected)return null;
   const q=Number(quantity||0);
   const ref=Number(selected.referenceQuantity||1);
   const factor=q/ref;
   return {
     calories:Number(selected.calories)*factor,
     protein:Number(selected.protein)*factor,
     carbs:Number(selected.carbs)*factor,
     fat:Number(selected.fat)*factor
   };
 },[selected,quantity]);

 async function saveNewFood(){
   setError("");
   setBusy(true);
   const r=await fetch('/api/food-library',{
     method:'POST',
     headers:{'content-type':'application/json'},
     body:JSON.stringify(newFood)
   });
   const body=await r.json();
   setBusy(false);
   if(!r.ok){setError(body.error||'Não consegui salvar o alimento.');return}
   setFoods(prev=>[...prev,body].sort((a,b)=>a.name.localeCompare(b.name)));
   setSelectedFoodId(body.id);
   setQuantity(String(body.referenceQuantity));
   setFoodMode('saved');
   setNewFood({name:"",referenceQuantity:"100",referenceUnit:"g",calories:"",protein:"",carbs:"",fat:""});
 }

 async function submit(e:React.FormEvent<HTMLFormElement>){
   e.preventDefault();
   setBusy(true);setError("");
   const body=Object.fromEntries(new FormData(e.currentTarget).entries());
   const url=type==='food'?'/api/meals':type==='workout'?'/api/workouts':'/api/progress';

   let payload:any={...body,logDate:today(),weightKg:type==='weight'?body.weightKg:undefined,currentWeightKg:weight};

   if(type==='food'&&foodMode==='saved'){
     if(!selectedFoodId||!Number(quantity)){setBusy(false);setError('Escolha um alimento e informe a quantidade.');return}
     payload={foodId:selectedFoodId,quantity:Number(quantity),mealType,logDate:today()};
   }

   const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
   const result=await r.json().catch(()=>({}));
   setBusy(false);
   if(r.ok)done(); else setError(result.error||'Não consegui salvar.');
 }

 return <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-0 sm:place-items-center sm:p-5">
   <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xl font-black">{type==='food'?'Adicionar refeição':type==='workout'?'Registrar treino':'Atualizar peso'}</h2>
      <button onClick={close} className="rounded-xl p-2 hover:bg-[#f1f5f3]"><X size={19}/></button>
    </div>

    {type==='food'&&<div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#f2f6f4] p-1">
      <button type="button" onClick={()=>setFoodMode('saved')} className={`rounded-xl px-2 py-2 text-xs font-black ${foodMode==='saved'?'bg-white text-[#145c5a] shadow-sm':'text-[#70817e]'}`}>Alimento salvo</button>
      <button type="button" onClick={()=>setFoodMode('new')} className={`rounded-xl px-2 py-2 text-xs font-black ${foodMode==='new'?'bg-white text-[#145c5a] shadow-sm':'text-[#70817e]'}`}>Cadastrar</button>
      <button type="button" onClick={()=>setFoodMode('manual')} className={`rounded-xl px-2 py-2 text-xs font-black ${foodMode==='manual'?'bg-white text-[#145c5a] shadow-sm':'text-[#70817e]'}`}>Manual</button>
    </div>}

    {error&&<div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

    {type==='food'&&foodMode==='new'?<div className="grid gap-3">
      <div className="rounded-xl bg-[#edf6f2] p-4 text-sm leading-5 text-[#45645d]">
        Cadastre os valores de uma porção de referência uma vez. Depois, ao informar quanto você realmente comeu, o app calcula automaticamente calorias, proteína, carboidratos e gordura.
      </div>
      <input className="input" placeholder="Nome do alimento" value={newFood.name} onChange={e=>setNewFood({...newFood,name:e.target.value})}/>
      <div className="grid grid-cols-2 gap-3">
        <input className="input" type="number" min="0.1" step=".1" placeholder="Porção de referência" value={newFood.referenceQuantity} onChange={e=>setNewFood({...newFood,referenceQuantity:e.target.value})}/>
        <select className="input" value={newFood.referenceUnit} onChange={e=>setNewFood({...newFood,referenceUnit:e.target.value})}>
          <option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option><option value="porção">porção</option>
        </select>
      </div>
      <p className="text-xs font-black uppercase tracking-[.12em] text-[#7b8d89]">Macros da porção de referência</p>
      <div className="grid grid-cols-3 gap-2">
        <input className="input" type="number" min="0" step=".1" placeholder="Proteína g" value={newFood.protein} onChange={e=>setNewFood({...newFood,protein:e.target.value})}/>
        <input className="input" type="number" min="0" step=".1" placeholder="Carbo g" value={newFood.carbs} onChange={e=>setNewFood({...newFood,carbs:e.target.value})}/>
        <input className="input" type="number" min="0" step=".1" placeholder="Gordura g" value={newFood.fat} onChange={e=>setNewFood({...newFood,fat:e.target.value})}/>
      </div>
      <input className="input" type="number" min="0" step=".1" placeholder="Calorias (opcional — calculo pelos macros se deixar vazio)" value={newFood.calories} onChange={e=>setNewFood({...newFood,calories:e.target.value})}/>
      <button disabled={busy} type="button" onClick={saveNewFood} className="btn-primary w-full">{busy?'Salvando...':'Salvar alimento'}</button>
    </div>:<form onSubmit={submit} className="grid gap-3">
      {type==='food'&&foodMode==='saved'&&<>
        {foods.length?<><select className="input" value={selectedFoodId} onChange={e=>{
          const id=e.target.value;setSelectedFoodId(id);
          const food=foods.find(x=>x.id===id);if(food)setQuantity(String(food.referenceQuantity));
        }}>{foods.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select className="input" value={mealType} onChange={e=>setMealType(e.target.value)}>
          <option>Café da manhã</option><option>Lanche</option><option>Almoço</option><option>Lanche da tarde</option><option>Jantar</option><option>Ceia</option>
        </select>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <input className="input" type="number" min=".1" step=".1" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Quantidade consumida"/>
          <div className="grid min-w-20 place-items-center rounded-xl bg-[#edf3f1] px-4 text-sm font-black text-[#536965]">{selected?.referenceUnit||'g'}</div>
        </div>
        {preview&&<div className="rounded-2xl border border-[#dce9e5] bg-[#f7fbf9] p-4">
          <div className="flex items-center justify-between"><span className="text-sm font-black">Calculado automaticamente</span><strong className="text-lg">{Math.round(preview.calories)} kcal</strong></div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white p-2"><p className="text-[10px] font-black uppercase text-[#82928f]">Proteína</p><p className="mt-1 font-black">{preview.protein.toFixed(1)} g</p></div>
            <div className="rounded-xl bg-white p-2"><p className="text-[10px] font-black uppercase text-[#82928f]">Carbo</p><p className="mt-1 font-black">{preview.carbs.toFixed(1)} g</p></div>
            <div className="rounded-xl bg-white p-2"><p className="text-[10px] font-black uppercase text-[#82928f]">Gordura</p><p className="mt-1 font-black">{preview.fat.toFixed(1)} g</p></div>
          </div>
        </div>}</>:<div className="rounded-xl bg-[#f4f7f6] p-4 text-sm text-[#61736f]">Você ainda não cadastrou alimentos. Vá em <strong>Cadastrar</strong> e informe os macros de uma porção de referência.</div>}
      </>}

      {type==='food'&&foodMode==='manual'&&<>
        <input className="input" name="name" placeholder="Alimento ou refeição" required/>
        <select className="input" name="mealType"><option>Café da manhã</option><option>Lanche</option><option>Almoço</option><option>Lanche da tarde</option><option>Jantar</option><option>Ceia</option></select>
        <div className="grid grid-cols-2 gap-3"><input className="input" name="quantity" type="number" step=".1" placeholder="Quantidade" defaultValue="1"/><input className="input" name="unit" placeholder="Unidade" defaultValue="porção"/></div>
        <input className="input" name="calories" type="number" step=".1" placeholder="Calorias"/>
        <div className="grid grid-cols-3 gap-2"><input className="input" name="protein" type="number" step=".1" placeholder="Proteína"/><input className="input" name="carbs" type="number" step=".1" placeholder="Carbo"/><input className="input" name="fat" type="number" step=".1" placeholder="Gordura"/></div>
      </>}

      {type==='workout'&&<><select className="input" name="type"><option>Musculação</option><option>Jiu-jitsu</option><option>Muay Thai</option><option>Corrida</option><option>Caminhada</option><option>Outro</option></select><input className="input" name="durationMinutes" type="number" placeholder="Duração em minutos" required/><select className="input" name="intensity"><option value="moderate">Moderada</option><option value="light">Leve</option><option value="high">Alta</option></select></>}
      {type==='weight'&&<input className="input" name="weightKg" type="number" step=".1" defaultValue={weight} required/>}
      {(type!=='food'||foodMode!=='new')&&<button disabled={busy||type==='food'&&foodMode==='saved'&&!foods.length} className="btn-primary mt-2 w-full">{busy?'Salvando...':'Salvar'}</button>}
    </form>}
   </div>
 </div>
}
