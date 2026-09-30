import Link from "next/link";
import { ArrowRight, BarChart3, Dumbbell, Salad, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  { icon: Salad, title: "Alimentação sem planilha", text: "Registre refeições, calorias e macros em poucos segundos." },
  { icon: Dumbbell, title: "Treinos no mesmo lugar", text: "Musculação, lutas, corrida e qualquer outra atividade." },
  { icon: BarChart3, title: "Saldo energético claro", text: "Compare ingestão e gasto estimado sem confundir um único treino com seu gasto total." },
  { icon: ShieldCheck, title: "Estimativas responsáveis", text: "O app mostra tendências e faixas úteis, sem vender falsa precisão." }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f7]">
      <section className="soft-grid border-b border-[#e5ecea] bg-[#fbfdfc]">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
          <nav className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-[#234a48] hover:bg-white">Entrar</Link>
              <Link href="/register" className="btn-primary text-sm">Criar conta</Link>
            </div>
          </nav>
          <div className="grid gap-10 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4e8df] bg-white px-3 py-1.5 text-sm font-bold text-[#145c5a]">
                <Sparkles size={15} /> Nutrição + treino + evolução
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-[-.05em] text-[#102a2a] sm:text-6xl">
                Entenda o que seu corpo recebe, gasta e constrói.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#607477]">
                O Forma organiza suas refeições, treinos, peso e estimativas de gasto energético para você enxergar a tendência que realmente importa ao longo das semanas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-5 py-3">Começar agora <ArrowRight size={18} /></Link>
                <a href="#recursos" className="btn-secondary px-5 py-3">Ver recursos</a>
              </div>
              <p className="mt-4 text-xs text-[#829391]">Cálculos energéticos são estimativas e devem ser ajustados pela evolução real.</p>
            </div>
            <div className="relative">
              <div className="card overflow-hidden p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#7a8f8c]">Hoje</p><h2 className="mt-1 text-2xl font-black tracking-tight">Seu dia em uma tela</h2></div>
                  <span className="rounded-full bg-[#dff4ea] px-3 py-1 text-xs font-black text-[#145c5a]">META +180 kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[["1.980","ingeridas"],["2.170","gasto est."],["-190","saldo"]].map(([v,l]) => (
                    <div key={l} className="rounded-2xl bg-[#f5f8f7] p-4"><div className="kpi-number text-2xl font-black">{v}</div><div className="mt-1 text-xs text-[#728481]">kcal {l}</div></div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-[#e6efec] p-4">
                  <div className="mb-3 flex justify-between text-sm font-bold"><span>Proteína</span><span>83 / 93 g</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e8efed]"><div className="h-full w-[89%] rounded-full bg-[#145c5a]" /></div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#fffaf0] p-3"><p className="text-xs font-bold text-[#8d6f32]">PRÓXIMO TREINO</p><p className="mt-1 font-black">Jiu-jitsu · 1h30</p></div>
                    <div className="rounded-xl bg-[#f0f7f5] p-3"><p className="text-xs font-bold text-[#52736f]">PESO</p><p className="mt-1 font-black">51,5 kg <span className="text-xs font-medium text-[#7d908d]">tendência estável</span></p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-10 max-w-2xl"><p className="text-sm font-black uppercase tracking-[.18em] text-[#145c5a]">Feito para acompanhar</p><h2 className="mt-2 text-4xl font-black tracking-[-.04em]">Menos conta manual. Mais visão do processo.</h2></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => <div key={title} className="card p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e5f4ed] text-[#145c5a]"><Icon size={20}/></span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6a7f7c]">{text}</p></div>)}
        </div>
      </section>
    </main>
  );
}
