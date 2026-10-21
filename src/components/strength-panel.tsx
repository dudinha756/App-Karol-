"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Dumbbell, FileText, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";

type Progress={id:string;logDate:string;setsCompleted?:number|null;repsCompleted?:string|null;weightKg?:string|null;rpe?:string|null;notes?:string|null};
type Exercise={id:string;name:string;sets?:number|null;reps?:string|null;restSeconds?:number|null;notes?:string|null;progress:Progress[]};
type Routine={id:string;name:string;sourceDocumentId?:string|null;createdAt:string;exercises:Exercise[]};

function today(){
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

export function StrengthPanel(){
  const fileRef=useRef<HTMLInputElement>(null);
  const [routines,setRoutines]=useState<Routine[]>([]);
  const [showManual,setShowManual]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [expanded,setExpanded]=useState<string|null>(null);
  const [logExercise,setLogExercise]=useState<Exercise|null>(null);
  const [manualName,setManualName]=useState("Treino A");
  const [manualExercises,setManualExercises]=useState([{name:"",sets:"3",reps:"10",restSeconds:"60",notes:""}]);

  async function load(){
    const r=await fetch("/api/strength",{cache:"no-store"});
    if(r.ok){
      const d=await r.json();
      setRoutines(d.routines||[]);
    }
  }
  useEffect(function(){load()},[]);

  async function upload(file?:File){
    if(!file)return;
    setBusy(true);
    setMessage("Lendo a ficha e identificando exercícios...");
    const form=new FormData();
    form.append("file",file);
    form.append("name",file.name.replace(/\.pdf$/i,""));
    const r=await fetch("/api/strength",{method:"POST",body:form});
    const d=await r.json().catch(function(){return {}});
    setBusy(false);
    if(!r.ok){setMessage(d.error||"Não consegui importar o PDF.");return}
    setMessage(d.exercisesFound?"Ficha importada com "+d.exercisesFound+" exercícios identificados.":"Ficha importada. O PDF foi salvo, mas os exercícios precisam ser cadastrados manualmente.");
    await load();
  }

  async function createManual(){
    const valid=manualExercises.filter(function(x){return x.name.trim()});
    if(!manualName.trim()||!valid.length){setMessage("Informe o nome do treino e pelo menos um exercício.");return}
    setBusy(true);setMessage("");
    const r=await fetch("/api/strength",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:manualName,exercises:valid})});
    const d=await r.json().catch(function(){return {}});
    setBusy(false);
    if(!r.ok){setMessage(d.error||"Não consegui criar a ficha.");return}
    setShowManual(false);
    setManualName("Treino A");
    setManualExercises([{name:"",sets:"3",reps:"10",restSeconds:"60",notes:""}]);
    setMessage("Ficha criada com sucesso.");
    await load();
  }

  async function removeRoutine(id:string){
    if(!confirm("Excluir esta ficha e todo o histórico ligado aos exercícios dela?"))return;
    const r=await fetch("/api/strength?id="+encodeURIComponent(id),{method:"DELETE"});
    if(r.ok)await load();
  }

  const totalExercises=routines.reduce(function(a,r){return a+r.exercises.length},0);
  const totalLogs=routines.reduce(function(a,r){return a+r.exercises.reduce(function(b,e){return b+e.progress.length},0)},0);

  return <div className="space-y-5">
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">Musculação</p>
          <h2 className="page-title">Sua ficha e sua evolução no mesmo lugar</h2>
          <p className="page-copy">Importe a ficha em PDF ou monte manualmente. Depois registre carga, séries, repetições e RPE para acompanhar a progressão.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input ref={fileRef} className="hidden" type="file" accept="application/pdf,.pdf" onChange={function(e){upload(e.target.files?.[0])}}/>
          <button disabled={busy} onClick={function(){fileRef.current?.click()}} className="btn-secondary inline-flex items-center justify-center gap-2">{busy?<RefreshCw size={17} className="animate-spin"/>:<Upload size={17}/>}Importar PDF</button>
          <button onClick={function(){setShowManual(true)}} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17}/>Criar ficha</button>
        </div>
      </div>
      {message&&<div className="mt-4 rounded-xl bg-[#edf6f2] px-4 py-3 text-sm font-semibold text-[#315f55]">{message}</div>}
    </section>

    <section className="grid gap-4 sm:grid-cols-3">
      <div className="metric-card"><p className="metric-label">Fichas</p><p className="metric-value">{routines.length}</p><p className="metric-help">planos cadastrados</p></div>
      <div className="metric-card"><p className="metric-label">Exercícios</p><p className="metric-value">{totalExercises}</p><p className="metric-help">na sua rotina</p></div>
      <div className="metric-card"><p className="metric-label">Registros</p><p className="metric-value">{totalLogs}</p><p className="metric-help">de progressão</p></div>
    </section>

    {routines.length?<section className="space-y-3">{routines.map(function(r){
      const open=expanded===r.id;
      return <article key={r.id} className="card overflow-hidden">
        <div className="flex items-center gap-3 p-4 sm:p-5">
          <button onClick={function(){setExpanded(open?null:r.id)}} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7f3ee] text-[#145c5a]"><Dumbbell size={19}/></span>
            <div className="min-w-0"><p className="truncate text-lg font-black">{r.name}</p><p className="mt-1 text-xs text-[#748683]">{r.exercises.length+" exercícios "+(r.sourceDocumentId?"· importado de PDF":"· criado manualmente")}</p></div>
            {open?<ChevronUp size={18} className="ml-auto shrink-0"/>:<ChevronDown size={18} className="ml-auto shrink-0"/>}
          </button>
          <button onClick={function(){removeRoutine(r.id)}} className="icon-btn shrink-0 text-[#966666]" aria-label="Excluir ficha"><Trash2 size={16}/></button>
        </div>

        {open&&<div className="border-t border-[#e8efed]">
          {r.exercises.length?r.exercises.map(function(e,i){return <ExerciseCard key={e.id} exercise={e} index={i} onLog={function(){setLogExercise(e)}}/>}):<div className="p-8 text-center text-sm text-[#758783]">Nenhum exercício foi identificado automaticamente. Crie uma ficha manual para registrar os exercícios.</div>}
        </div>}
      </article>
    })}</section>:<section className="card grid place-items-center gap-3 p-10 text-center"><FileText size={32} className="text-[#78928c]"/><div><p className="font-black">Nenhuma ficha de musculação ainda</p><p className="mt-1 text-sm text-[#748683]">Importe o PDF da academia ou crie seu treino manualmente.</p></div></section>}

    {showManual&&<ManualRoutineModal
      busy={busy}
      name={manualName}
      setName={setManualName}
      exercises={manualExercises}
      setExercises={setManualExercises}
      close={function(){setShowManual(false)}}
      save={createManual}
    />}

    {logExercise&&<ProgressModal exercise={logExercise} close={function(){setLogExercise(null)}} done={async function(){setLogExercise(null);await load()}}/>}
  </div>;
}

function ExerciseCard({exercise,index,onLog}:{exercise:Exercise;index:number;onLog:()=>void}){
  const latest=exercise.progress[0];
  const previous=exercise.progress[1];
  const delta=latest?.weightKg&&previous?.weightKg?Number(latest.weightKg)-Number(previous.weightKg):null;
  return <div className="border-b border-[#edf2f0] p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><span className="text-xs font-black text-[#82928f]">{String(index+1).padStart(2,"0")}</span><p className="font-black">{exercise.name}</p></div>
        <p className="mt-1 text-xs text-[#748683]">{(exercise.sets?exercise.sets+" séries":"Séries livres")+(exercise.reps?" · "+exercise.reps+" reps":"")+(exercise.restSeconds?" · "+exercise.restSeconds+"s descanso":"")}</p>
        {exercise.notes&&<p className="mt-2 text-xs leading-5 text-[#697b77]">{exercise.notes}</p>}
      </div>
      <div className="flex items-center gap-3 sm:text-right">
        {latest?<div className="flex-1 sm:flex-none">
          <p className="text-xs font-bold text-[#7d8e8b]">Último registro</p>
          <p className="mt-1 font-black">{(latest.weightKg?Number(latest.weightKg).toLocaleString("pt-BR")+" kg":"sem carga")+(latest.repsCompleted?" · "+latest.repsCompleted+" reps":"")}</p>
          {delta!==null&&delta!==0&&<p className={"mt-1 text-xs font-black "+(delta>0?"text-[#2f7a61]":"text-[#966666]")}>{(delta>0?"+":"")+delta.toLocaleString("pt-BR")+" kg vs. anterior"}</p>}
        </div>:<p className="flex-1 text-xs text-[#82928f] sm:flex-none">Sem progresso registrado</p>}
        <button onClick={onLog} className="btn-secondary shrink-0">Registrar</button>
      </div>
    </div>
  </div>;
}

function ManualRoutineModal({busy,name,setName,exercises,setExercises,close,save}:{busy:boolean;name:string;setName:(v:string)=>void;exercises:any[];setExercises:(v:any)=>void;close:()=>void;save:()=>void}){
  return <div className="modal-backdrop"><div className="modal-sheet max-w-2xl">
    <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Musculação</p><h2 className="text-xl font-black">Criar ficha manualmente</h2></div><button onClick={close} className="icon-btn"><X size={18}/></button></div>
    <div className="grid gap-4">
      <label><span className="field-label">Nome da ficha</span><input className="input" value={name} onChange={function(e){setName(e.target.value)}} placeholder="Ex.: Treino A — inferiores"/></label>
      <div className="space-y-3">{exercises.map(function(ex,i){return <div key={i} className="rounded-2xl border border-[#e2ebe8] bg-[#fafcfb] p-4">
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-black">{"Exercício "+(i+1)}</p>{exercises.length>1&&<button className="text-xs font-bold text-[#966666]" onClick={function(){setExercises(exercises.filter(function(_:any,j:number){return j!==i}))}}>remover</button>}</div>
        <input className="input" value={ex.name} onChange={function(e){setExercises(exercises.map(function(x:any,j:number){return j===i?Object.assign({},x,{name:e.target.value}):x}))}} placeholder="Nome do exercício"/>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <input className="input" type="number" min="1" value={ex.sets} onChange={function(e){setExercises(exercises.map(function(x:any,j:number){return j===i?Object.assign({},x,{sets:e.target.value}):x}))}} placeholder="Séries"/>
          <input className="input" value={ex.reps} onChange={function(e){setExercises(exercises.map(function(x:any,j:number){return j===i?Object.assign({},x,{reps:e.target.value}):x}))}} placeholder="Reps"/>
          <input className="input" type="number" min="0" value={ex.restSeconds} onChange={function(e){setExercises(exercises.map(function(x:any,j:number){return j===i?Object.assign({},x,{restSeconds:e.target.value}):x}))}} placeholder="Descanso s"/>
        </div>
        <input className="input mt-3" value={ex.notes} onChange={function(e){setExercises(exercises.map(function(x:any,j:number){return j===i?Object.assign({},x,{notes:e.target.value}):x}))}} placeholder="Observação (opcional)"/>
      </div>})}</div>
      <button className="btn-secondary inline-flex items-center justify-center gap-2" onClick={function(){setExercises(exercises.concat([{name:"",sets:"3",reps:"10",restSeconds:"60",notes:""}]))}}><Plus size={16}/>Adicionar exercício</button>
      <button disabled={busy} onClick={save} className="btn-primary w-full">{busy?"Salvando...":"Salvar ficha"}</button>
    </div>
  </div></div>;
}

function ProgressModal({exercise,close,done}:{exercise:Exercise;close:()=>void;done:()=>void}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true);setError("");
    const body=Object.fromEntries(new FormData(e.currentTarget).entries());
    const r=await fetch("/api/strength/progress",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.assign({},body,{exerciseId:exercise.id}))});
    const d=await r.json().catch(function(){return {}});
    setBusy(false);
    if(!r.ok){setError(d.error||"Não consegui registrar o progresso.");return}
    done();
  }

  return <div className="modal-backdrop"><div className="modal-sheet">
    <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Progresso</p><h2 className="text-xl font-black">{exercise.name}</h2></div><button onClick={close} className="icon-btn"><X size={18}/></button></div>
    <form onSubmit={submit} className="grid gap-3">
      <label><span className="field-label">Data</span><input className="input" type="date" name="logDate" defaultValue={today()} required/></label>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="field-label">Séries feitas</span><input className="input" type="number" min="1" name="setsCompleted" defaultValue={exercise.sets||""}/></label>
        <label><span className="field-label">Repetições</span><input className="input" name="repsCompleted" placeholder="Ex.: 10, 10, 8"/></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="field-label">Carga (kg)</span><input className="input" type="number" min="0" step=".25" name="weightKg" placeholder="0"/></label>
        <label><span className="field-label">RPE (1–10)</span><input className="input" type="number" min="1" max="10" step=".5" name="rpe" placeholder="8"/></label>
      </div>
      <textarea className="input min-h-20" name="notes" placeholder="Como foi a execução? (opcional)"/>
      {error&&<div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      <button disabled={busy} className="btn-primary w-full">{busy?"Salvando...":"Salvar progresso"}</button>
    </form>
  </div></div>;
}
