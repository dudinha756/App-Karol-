import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function Page(){
  const id=await getSessionUserId();
  if(!id)redirect("/login");
  return <main className="soft-grid min-h-screen px-5 py-10">
    <div className="mx-auto max-w-2xl">
      <Logo/>
      <div className="card mt-7 overflow-hidden p-7 sm:p-9">
        <div className="-mx-9 -mt-9 mb-7 h-2 bg-gradient-to-r from-[#5641ff] via-[#aa6cff] to-[#ff6cd2]" />
        <p className="eyebrow">Seu ponto de partida</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#29154a]">Configure seu perfil</h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-[#7c718c]">Esses dados ajudam o Forma day a personalizar suas estimativas e sua experiência.</p>
        <OnboardingForm/>
      </div>
    </div>
  </main>;
}
