"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Repeat2, Trash2, X } from "lucide-react";

type CalendarEvent = {
  id:string; title:string; eventType:string; startDate:string; startTime:string;
  durationMinutes:number; recurrence:string; recurrenceUntil?:string|null; notes?:string|null;
  occurrenceDate:string; occurrenceId:string;
};

const typeLabel:Record<string,string> = {treino:"Treino",compromisso:"Compromisso",reuniao:"Reunião",outro:"Outro"};
const recurrenceLabel:Record<string,string> = {none:"Não se repete",daily:"Todos os dias",weekly:"Toda semana",monthly:"Todo mês"};

function localIso(d:Date){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return y+"-"+m+"-"+day;
}
function monthTitle(d:Date){ return d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}); }

export function CalendarPanel(){
  const [month,setMonth]=useState(function(){return new Date()});
  const [events,setEvents]=useState<CalendarEvent[]>([]);
  const [showForm,setShowForm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const first=new Date(month.getFullYear(),month.getMonth(),1);
  const last=new Date(month.getFullYear(),month.getMonth()+1,0);
  const from=localIso(first);
  const to=localIso(last);

  async function load(){
    const r=await fetch("/api/calendar?from="+from+"&to="+to,{cache:"no-store"});
    if(r.ok){
      const data=await r.json();
      setEvents(data.events||[]);
    }
  }
  useEffect(function(){load()},[from,to]);

  const days=useMemo(function(){
    const offset=(first.getDay()+6)%7;
    const items:(Date|null)[]=Array(offset).fill(null);
    for(let i=1;i<=last.getDate();i++)items.push(new Date(month.getFullYear(),month.getMonth(),i));
    while(items.length%7)items.push(null);
    return items;
  },[month.getFullYear(),month.getMonth()]);

  const grouped=useMemo(function(){
    const map=new Map<string,CalendarEvent[]>();
    for(const e of events){
      if(!map.has(e.occurrenceDate))map.set(e.occurrenceDate,[]);
      map.get(e.occurrenceDate)!.push(e);
    }
    return map;
  },[events]);

  async function createEvent(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd=new FormData(e.currentTarget);
    const body=Object.fromEntries(fd.entries());
    if(String(body.recurrence||"none")==="none")body.recurrenceUntil="";
    const r=await fetch("/api/calendar",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const data=await r.json().catch(function(){return {}});
    setBusy(false);
    if(!r.ok){setError(data.error||"Não consegui criar o evento.");return}
    setShowForm(false);
    await load();
  }

  async function removeEvent(id:string){
    if(!confirm("Excluir este evento e todas as repetições dele?"))return;
    const r=await fetch("/api/calendar?id="+encodeURIComponent(id),{method:"DELETE"});
    if(r.ok)await load();
  }

  const today=localIso(new Date());
  const upcoming=events.filter(function(e){return e.occurrenceDate>=today}).slice(0,12);

  return <div className="space-y-5">
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Agenda</p>
          <h2 className="page-title">Organize treino, trabalho e compromissos</h2>
          <p className="page-copy">Crie eventos com horário, duração e recorrência. Reuniões e treinos ficam no mesmo calendário.</p>
        </div>
        <button onClick={function(){setShowForm(true)}} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17}/>Novo evento</button>
      </div>
    </section>

    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e6eeeb] p-4 sm:p-5">
        <button className="icon-btn" onClick={function(){setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}} aria-label="Mês anterior"><ChevronLeft size={19}/></button>
        <div className="text-center">
          <p className="text-lg font-black capitalize">{monthTitle(month)}</p>
          <button className="mt-1 text-xs font-bold text-[#397469]" onClick={function(){setMonth(new Date())}}>Voltar para hoje</button>
        </div>
        <button className="icon-btn" onClick={function(){setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}} aria-label="Próximo mês"><ChevronRight size={19}/></button>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-[#edf2f0] bg-[#fafcfb]">
          {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(function(d){return <div key={d} className="px-3 py-2 text-center text-xs font-black uppercase tracking-[.12em] text-[#7c8d89]">{d}</div>})}
        </div>
        <div className="grid grid-cols-7">
          {days.map(function(d,i){
            if(!d)return <div key={"blank-"+i} className="min-h-32 border-b border-r border-[#edf2f0] bg-[#fbfcfc]"/>;
            const key=localIso(d);
            const list=grouped.get(key)||[];
            const isToday=key===today;
            return <div key={key} className="min-h-32 border-b border-r border-[#edf2f0] p-2.5">
              <div className={"mb-2 grid h-7 w-7 place-items-center rounded-full text-xs font-black "+(isToday?"bg-[#145c5a] text-white":"text-[#4f625e]")}>{d.getDate()}</div>
              <div className="space-y-1.5">
                {list.slice(0,3).map(function(e){return <button key={e.occurrenceId} onClick={function(){removeEvent(e.id)}} title="Clique para excluir" className="w-full rounded-lg bg-[#eef6f2] px-2 py-1.5 text-left hover:bg-[#e2f0ea]">
                  <p className="truncate text-[11px] font-black text-[#244e49]">{e.startTime+" · "+e.title}</p>
                  <p className="truncate text-[10px] text-[#6f817d]">{typeLabel[e.eventType]||e.eventType}</p>
                </button>})}
                {list.length>3&&<p className="px-1 text-[10px] font-bold text-[#6e817d]">{"+"+(list.length-3)+" eventos"}</p>}
              </div>
            </div>;
          })}
        </div>
      </div>

      <div className="md:hidden">
        <div className="divide-y divide-[#edf2f0]">
          {events.length?Array.from(grouped.entries()).map(function(entry){
            const date=entry[0], list=entry[1];
            return <div key={date} className="p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[.12em] text-[#6e817d]">{new Date(date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"short"})}</p>
              <div className="space-y-2">
                {list.map(function(e){return <div key={e.occurrenceId} className="flex gap-3 rounded-2xl bg-[#f7faf9] p-3">
                  <div className="w-14 shrink-0 text-sm font-black text-[#145c5a]">{e.startTime}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{e.title}</p>
                    <p className="mt-1 text-xs text-[#758783]">{(typeLabel[e.eventType]||e.eventType)+" · "+e.durationMinutes+" min"+(e.recurrence!=="none"?" · "+recurrenceLabel[e.recurrence]:"")}</p>
                    {e.notes&&<p className="mt-2 text-xs leading-5 text-[#697b77]">{e.notes}</p>}
                  </div>
                  <button onClick={function(){removeEvent(e.id)}} className="icon-btn h-9 w-9 shrink-0 text-[#966666]" aria-label="Excluir evento"><Trash2 size={16}/></button>
                </div>})}
              </div>
            </div>
          }):<div className="grid place-items-center gap-2 p-10 text-center text-[#748683]"><CalendarDays size={28}/><p className="text-sm">Nenhum evento neste mês.</p></div>}
        </div>
      </div>
    </section>

    <section className="card p-5">
      <h3 className="text-lg font-black">Próximos eventos</h3>
      <div className="mt-4 grid gap-2">
        {upcoming.length?upcoming.map(function(e){return <div key={"up-"+e.occurrenceId} className="flex items-center gap-3 rounded-2xl border border-[#e6eeeb] px-4 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf6f2] text-[#145c5a]"><Clock3 size={17}/></span>
          <div className="min-w-0 flex-1"><p className="truncate font-black">{e.title}</p><p className="mt-1 text-xs text-[#768885]">{new Date(e.occurrenceDate+"T12:00:00").toLocaleDateString("pt-BR")+" · "+e.startTime+" · "+e.durationMinutes+" min"}</p></div>
          {e.recurrence!=="none"&&<Repeat2 size={16} className="shrink-0 text-[#78908a]"/>}
        </div>}):<p className="text-sm text-[#758783]">Nenhum evento futuro neste mês.</p>}
      </div>
    </section>

    {showForm&&<EventForm close={function(){setShowForm(false)}} busy={busy} error={error} onSubmit={createEvent}/>}
  </div>;
}

function EventForm({close,busy,error,onSubmit}:{close:()=>void;busy:boolean;error:string;onSubmit:(e:React.FormEvent<HTMLFormElement>)=>void}){
  const [recurrence,setRecurrence]=useState("none");
  return <div className="modal-backdrop">
    <div className="modal-sheet">
      <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Agenda</p><h2 className="text-xl font-black">Novo evento</h2></div><button onClick={close} className="icon-btn"><X size={18}/></button></div>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input className="input" name="title" placeholder="Título do evento" required autoFocus/>
        <select className="input" name="eventType" defaultValue="compromisso">
          <option value="treino">Treino</option><option value="compromisso">Compromisso</option><option value="reuniao">Reunião</option><option value="outro">Outro</option>
        </select>
        <div className="grid grid-cols-2 gap-3"><input className="input" type="date" name="startDate" defaultValue={localIso(new Date())} required/><input className="input" type="time" name="startTime" required/></div>
        <label className="block"><span className="field-label">Duração (minutos)</span><input className="input" type="number" name="durationMinutes" min="5" max="1440" step="5" defaultValue="60" required/></label>
        <label className="block"><span className="field-label">Recorrência</span><select className="input" name="recurrence" value={recurrence} onChange={function(e){setRecurrence(e.target.value)}}><option value="none">Não se repete</option><option value="daily">Todos os dias</option><option value="weekly">Toda semana</option><option value="monthly">Todo mês</option></select></label>
        {recurrence!=="none"&&<label className="block"><span className="field-label">Repetir até</span><input className="input" type="date" name="recurrenceUntil" required/></label>}
        <textarea className="input min-h-24 resize-y" name="notes" placeholder="Observações (opcional)"/>
        {error&&<div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
        <button disabled={busy} className="btn-primary mt-1 w-full">{busy?"Salvando...":"Criar evento"}</button>
      </form>
    </div>
  </div>;
}
