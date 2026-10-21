"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, Plus, RefreshCw, Search } from "lucide-react";

type TacoFood = {
  id: number;
  description: string;
  category?: string | null;
  energyKcal?: string | null;
  proteinG?: string | null;
  carbsG?: string | null;
  fatG?: string | null;
  source: string;
};

type SavedFood = {
  id:string;
  name:string;
  referenceQuantity:string;
  referenceUnit:string;
  calories:string;
  protein:string;
  carbs:string;
  fat:string;
};

const today=()=>{
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};

export function FoodEntryForm({done}:{done:()=>void}) {
  const [mode,setMode]=useState<'taco'|'saved'|'new'|'manual'>('taco');
  const [mealType,setMealType]=useState("Café da manhã");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const [query,setQuery]=useState("");
  const [tacoFoods,setTacoFoods]=useState<TacoFood[]>([]);
  const [searching,setSearching]=useState(false);
  const [selectedTaco,setSelectedTaco]=useState<TacoFood|null>(null);
  const [grams,setGrams]=useState("100");

  const [savedFoods,setSavedFoods]=useState<SavedFood[]>([]);
  const [selectedFoodId,setSelectedFoodId]=useState("");
  const [savedQuantity,setSavedQuantity]=useState("");
  const [newFood,setNewFood]=useState({name:"",referenceQuantity:"100",referenceUnit:"g",calories:"",protein:"",carbs:"",fat:""});

  useEffect(()=>{
    fetch('/api/food-library',{cache:'no-store'})
      .then(r=>r.ok?r.json():[])
      .then((rows:SavedFood[])=>{
        setSavedFoods(rows);
        if(rows.length){
          setSelectedFoodId(rows[0].id);
          setSavedQuantity(String(rows[0].referenceQuantity));
        }
      });
  },[]);

  useEffect(()=>{
    if(mode!=='taco')return;
    const q=query.trim();
    if(q.length<2){
      setTacoFoods([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer=setTimeout(()=>{
      fetch('/api/taco?q='+encodeURIComponent(q),{cache:'no-store'})
        .then(r=>r.ok?r.json():[])
        .then((rows:TacoFood[])=>setTacoFoods(rows))
        .finally(()=>setSearching(false));
    },250);

    return ()=>clearTimeout(timer);
  },[query,mode]);

  const tacoPreview=useMemo(()=>{
    if(!selectedTaco)return null;
    const factor=Number(grams||0)/100;
    return {
      kcal:Number(selectedTaco.energyKcal||0)*factor,
      protein:Number(selectedTaco.proteinG||0)*factor,
      carbs:Number(selectedTaco.carbsG||0)*factor,
      fat:Number(selectedTaco.fatG||0)*factor
    };
  },[selectedTaco,grams]);

  const selectedSaved=savedFoods.find(f=>f.id===selectedFoodId);
  const savedPreview=useMemo(()=>{
    if(!selectedSaved)return null;
    const ref=Number(selectedSaved.referenceQuantity||1);
    const factor=Number(savedQuantity||0)/ref;
    return {
      kcal:Number(selectedSaved.calories||0)*factor,
      protein:Number(selectedSaved.protein||0)*factor,
      carbs:Number(selectedSaved.carbs||0)*factor,
      fat:Number(selectedSaved.fat||0)*factor
    };
  },[selectedSaved,savedQuantity]);

  async function postMeal(payload:any){
    setBusy(true);setError("");
    const r=await fetch('/api/meals',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({...payload,mealType,logDate:today()})
    });
    const data=await r.json().catch(()=>({}));
    setBusy(false);
    if(!r.ok){setError(data.error||'Não consegui registrar a refeição.');return}
    done();
  }

  async function saveNewFood(){
    setBusy(true);setError("");
    const r=await fetch('/api/food-library',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(newFood)
    });
    const data=await r.json().catch(()=>({}));
    setBusy(false);
    if(!r.ok){setError(data.error||'Não consegui cadastrar o alimento.');return}

    const next=[...savedFoods,data].sort((a,b)=>a.name.localeCompare(b.name));
    setSavedFoods(next);
    setSelectedFoodId(data.id);
    setSavedQuantity(String(data.referenceQuantity));
    setNewFood({name:"",referenceQuantity:"100",referenceUnit:"g",calories:"",protein:"",carbs:"",fat:""});
    setMode('saved');
  }

  async function submitManual(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const body=Object.fromEntries(new FormData(e.currentTarget).entries());
    await postMeal(body);
  }

  return <div className="grid gap-4">
    <select className="input" value={mealType} onChange={e=>setMealType(e.target.value)}>
      <option>Café da manhã</option>
      <option>Lanche</option>
      <option>Almoço</option>
      <option>Lanche da tarde</option>
      <option>Jantar</option>
      <option>Ceia</option>
    </select>

    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f2f6f4] p-1 sm:grid-cols-4">
      <button type="button" onClick={()=>setMode('taco')} className={`rounded-xl px-2 py-2 text-xs font-black ${mode==='taco'?'bg-white text-[#145c5a] shadow-sm':'text-[#70817e]'}`}>Tabela TACO</button>
      <button type="button" onClick={()=>setMode('saved')} className={`rounded-xl px-2 py-2 text-xs font-black ${mode==='saved'?'bg-white text-[#145c5a] shadow-sm':'text-[#70817e]'}`}>Meus alimentos</button>
      <button type="button" onClick={()=>setMode('new')} className={`rounded-xl px-2 py-2 text-xs font-black ${mode==='new'?'bg-white text-[#145c5a] shadow-sm':'text-[#70817e]'}`}>Cadastrar</button>
      <button type="button" onClick={()=>setMode('manual')} className={`rounded-xl px-2 py-2 text-xs font-black ${mode==='manual'?'bg-white text-[#145c5a] shadow-sm':'text-[#70817e]'}`}>Manual</button>
    </div>

    {error&&<div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

    {mode==='taco'&&<div className="grid gap-3">
      <div className="rounded-xl bg-[#edf6f2] p-4 text-sm leading-5 text-[#45645d]">
        Busque o alimento pela <strong>TACO 4ª edição (NEPA/UNICAMP)</strong>. Os valores são por 100 g; o app recalcula automaticamente pela quantidade consumida.
      </div>

      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#879894]"/>
        <input className="input pl-11" value={query} onChange={e=>{setQuery(e.target.value);setSelectedTaco(null)}} placeholder="Ex.: arroz integral cozido, banana, frango..."/>
        {searching&&<RefreshCw size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#7b8d89]"/>}
      </div>

      {query.trim().length>=2&&!selectedTaco&&<div className="max-h-60 overflow-y-auto rounded-2xl border border-[#e0e9e6] bg-white">
        {tacoFoods.length?tacoFoods.map(food=><button
          key={food.id}
          type="button"
          onClick={()=>{setSelectedTaco(food);setQuery(food.description);setGrams('100')}}
          className="block w-full border-b border-[#edf2f0] px-4 py-3 text-left hover:bg-[#f5f9f7]"
        >
          <p className="text-sm font-black">{food.description}</p>
          <p className="mt-1 text-xs text-[#7b8d89]">{food.category||'TACO'} · {Math.round(Number(food.energyKcal||0))} kcal/100 g</p>
        </button>):!searching&&<div className="p-5 text-center text-sm text-[#7c8d8a]">Nenhum alimento encontrado.</div>}
      </div>}

      {selectedTaco&&<>
        <div className="rounded-2xl border border-[#dce9e5] bg-[#f7fbf9] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#145c5a]"><Database size={17}/></span>
            <div>
              <p className="font-black">{selectedTaco.description}</p>
              <p className="mt-1 text-xs text-[#758783]">{selectedTaco.category} · referência de 100 g</p>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Quantidade consumida (g)</span>
          <input className="input" type="number" min=".1" max="5000" step=".1" value={grams} onChange={e=>setGrams(e.target.value)}/>
        </label>

        {tacoPreview&&<MacroPreview {...tacoPreview}/>}

        <button disabled={busy||!Number(grams)} onClick={()=>postMeal({tacoFoodId:selectedTaco.id,quantity:Number(grams)})} className="btn-primary w-full">
          {busy?'Salvando...':'Adicionar à refeição'}
        </button>
      </>}
    </div>}

    {mode==='saved'&&<div className="grid gap-3">
      {savedFoods.length?<>
        <select className="input" value={selectedFoodId} onChange={e=>{
          const id=e.target.value;setSelectedFoodId(id);
          const food=savedFoods.find(x=>x.id===id);if(food)setSavedQuantity(String(food.referenceQuantity));
        }}>{savedFoods.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <input className="input" type="number" min=".1" step=".1" value={savedQuantity} onChange={e=>setSavedQuantity(e.target.value)} placeholder="Quantidade consumida"/>
          <div className="grid min-w-20 place-items-center rounded-xl bg-[#edf3f1] px-4 text-sm font-black text-[#536965]">{selectedSaved?.referenceUnit||'g'}</div>
        </div>

        {savedPreview&&<MacroPreview {...savedPreview}/>}

        <button disabled={busy||!selectedFoodId||!Number(savedQuantity)} onClick={()=>postMeal({foodId:selectedFoodId,quantity:Number(savedQuantity)})} className="btn-primary w-full">
          {busy?'Salvando...':'Adicionar à refeição'}
        </button>
      </>:<div className="rounded-xl bg-[#f4f7f6] p-4 text-sm text-[#61736f]">
        Você ainda não cadastrou alimentos próprios. Use <strong>Tabela TACO</strong> para alimentos comuns ou <strong>Cadastrar</strong> para produtos específicos.
      </div>}
    </div>}

    {mode==='new'&&<div className="grid gap-3">
      <div className="rounded-xl bg-[#edf6f2] p-4 text-sm leading-5 text-[#45645d]">
        Para alimentos industrializados ou receitas próprias, informe os dados de uma porção de referência. Depois o App Karol recalcula qualquer quantidade.
      </div>
      <input className="input" placeholder="Nome do alimento" value={newFood.name} onChange={e=>setNewFood({...newFood,name:e.target.value})}/>
      <div className="grid grid-cols-2 gap-3">
        <input className="input" type="number" min=".1" step=".1" placeholder="Porção de referência" value={newFood.referenceQuantity} onChange={e=>setNewFood({...newFood,referenceQuantity:e.target.value})}/>
        <select className="input" value={newFood.referenceUnit} onChange={e=>setNewFood({...newFood,referenceUnit:e.target.value})}>
          <option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option><option value="porção">porção</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input className="input" type="number" min="0" step=".1" placeholder="Proteína g" value={newFood.protein} onChange={e=>setNewFood({...newFood,protein:e.target.value})}/>
        <input className="input" type="number" min="0" step=".1" placeholder="Carbo g" value={newFood.carbs} onChange={e=>setNewFood({...newFood,carbs:e.target.value})}/>
        <input className="input" type="number" min="0" step=".1" placeholder="Gordura g" value={newFood.fat} onChange={e=>setNewFood({...newFood,fat:e.target.value})}/>
      </div>
      <input className="input" type="number" min="0" step=".1" placeholder="Calorias (opcional)" value={newFood.calories} onChange={e=>setNewFood({...newFood,calories:e.target.value})}/>
      <button disabled={busy||!newFood.name||!Number(newFood.referenceQuantity)} type="button" onClick={saveNewFood} className="btn-primary w-full">
        {busy?'Salvando...':'Salvar alimento'}
      </button>
    </div>}

    {mode==='manual'&&<form onSubmit={submitManual} className="grid gap-3">
      <input className="input" name="name" placeholder="Alimento ou refeição" required/>
      <div className="grid grid-cols-2 gap-3">
        <input className="input" name="quantity" type="number" step=".1" placeholder="Quantidade" defaultValue="1"/>
        <input className="input" name="unit" placeholder="Unidade" defaultValue="porção"/>
      </div>
      <input className="input" name="calories" type="number" step=".1" placeholder="Calorias"/>
      <div className="grid grid-cols-3 gap-2">
        <input className="input" name="protein" type="number" step=".1" placeholder="Proteína"/>
        <input className="input" name="carbs" type="number" step=".1" placeholder="Carbo"/>
        <input className="input" name="fat" type="number" step=".1" placeholder="Gordura"/>
      </div>
      <button disabled={busy} className="btn-primary w-full">{busy?'Salvando...':'Adicionar à refeição'}</button>
    </form>}
  </div>;
}

function MacroPreview({kcal,protein,carbs,fat}:{kcal:number;protein:number;carbs:number;fat:number}) {
  return <div className="rounded-2xl border border-[#dce9e5] bg-[#f7fbf9] p-4">
    <div className="flex items-center justify-between">
      <span className="text-sm font-black">Calculado automaticamente</span>
      <strong className="text-lg">{Math.round(kcal)} kcal</strong>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-white p-2"><p className="text-[10px] font-black uppercase text-[#82928f]">Proteína</p><p className="mt-1 font-black">{protein.toFixed(1)} g</p></div>
      <div className="rounded-xl bg-white p-2"><p className="text-[10px] font-black uppercase text-[#82928f]">Carbo</p><p className="mt-1 font-black">{carbs.toFixed(1)} g</p></div>
      <div className="rounded-xl bg-white p-2"><p className="text-[10px] font-black uppercase text-[#82928f]">Gordura</p><p className="mt-1 font-black">{fat.toFixed(1)} g</p></div>
    </div>
  </div>;
}
