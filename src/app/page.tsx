import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Dumbbell, Salad, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  { icon: Salad, title: "Nutrição sem complicação", text: "Registre alimentos pela TACO, acompanhe calorias e veja seus macros em tempo real.", tone:"pink" },
  { icon: Dumbbell, title: "Treino que evolui com você", text: "Ficha de musculação, cargas, repetições e progresso reunidos em um só lugar.", tone:"violet" },
  { icon: CalendarDays, title: "Sua rotina organizada", text: "Treinos, reuniões e compromissos com horários, duração e recorrência.", tone:"blue" },
  { icon: BarChart3, title: "Progresso visível", text: "Peso, alimentação, atividade e consistência apresentados de forma clara e leve.", tone:"violet" }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="soft-grid min-h-[92vh] overflow-hidden border-b border-[#f0eaf8]">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
          <nav className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-[#5f5272] hover:bg-white/80">Entrar</Link>
              <Link href="/register" className="btn-primary text-sm">Criar conta</Link>
            </div>
          </nav>

          <div className="grid gap-12 py-16 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#eadff9] bg-white/80 px-3 py-1.5 text-sm font-bold text-[#654cff] shadow-sm">
                <Sparkles size={15} /> Pequenos passos. Dias mais leves.
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] text-[#29154a] sm:text-6xl lg:text-7xl">
                Sua rotina de bem-estar, <span className="bg-gradient-to-r from-[#654cff] via-[#9c63ff] to-[#ff6cd2] bg-clip-text text-transparent">mais clara todos os dias.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#786d89]">
                O Forma day reúne nutrição, treino, agenda e evolução em uma experiência simples para você acompanhar hábitos e enxergar seu progresso sem complicação.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-5 py-3">Começar agora <ArrowRight size={18} /></Link>
                <a href="#recursos" className="btn-secondary px-5 py-3">Conhecer recursos</a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-[#ff6cd2]/20 blur-3xl" />
              <div className="absolute -right-8 bottom-8 h-64 w-64 rounded-full bg-[#8fc7ff]/30 blur-3xl" />
              <div className="glow-card relative overflow-hidden p-5 sm:p-7">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#acd0ff]/45 to-transparent blur-2xl" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow">Hoje</p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#29154a]">Seu dia, em equilíbrio.</h2>
                    </div>
                    <span className="rounded-full bg-[#fff0fa] px-3 py-1.5 text-xs font-black text-[#df4db0]">Forma day</span>
                  </div>

                  <div className="mt-7 grid grid-cols-3 gap-3">
                    {[["1.280","kcal"],["82 g","proteína"],["4/5","hábitos"]].map(([v,l],i) => (
                      <div key={l} className="rounded-2xl border border-[#eee7f7] bg-white/90 p-4 shadow-sm">
                        <div className={"text-2xl font-black "+(i===0?"text-[#ff5fc9]":i===1?"text-[#654cff]":"text-[#6daff5]")}>{v}</div>
                        <div className="mt-1 text-xs font-bold text-[#958aa5]">{l}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#6c54ff] via-[#8b62ff] to-[#f072cb] p-5 text-white shadow-[0_20px_45px_rgba(101,76,255,.24)]">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-white/70">Foco de hoje</p>
                    <p className="mt-2 max-w-xs text-2xl font-black leading-tight">Consistência hoje cria dias mais leves amanhã.</p>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[76%] rounded-full bg-white" /></div>
                    <p className="mt-2 text-xs font-bold text-white/75">76% da rotina concluída</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#eee7f7] bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[.12em] text-[#9a8fa9]">Treino</p>
                      <p className="mt-2 font-black text-[#352354]">Força · 45 min</p>
                    </div>
                    <div className="rounded-2xl border border-[#eee7f7] bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[.12em] text-[#9a8fa9]">Nutrição</p>
                      <p className="mt-2 font-black text-[#352354]">Plano do dia · 5/6</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">Tudo em um só lugar</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-.045em] text-[#29154a]">Menos esforço para registrar. Mais clareza para evoluir.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text, tone }) => <div key={title} className="card p-6">
            <span className={"grid h-12 w-12 place-items-center rounded-2xl "+(tone==="pink"?"bg-[#fff0fa] text-[#ed58be]":tone==="blue"?"bg-[#eef7ff] text-[#629fe8]":"bg-[#f0ecff] text-[#654cff]")}><Icon size={21}/></span>
            <h3 className="mt-5 text-lg font-black text-[#342250]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#7c718c]">{text}</p>
          </div>)}
        </div>
      </section>
    </main>
  );
}
