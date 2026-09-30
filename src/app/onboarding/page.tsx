import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "@/components/onboarding-form";
export default async function Page(){const id=await getSessionUserId();if(!id)redirect('/login');return <main className="min-h-screen bg-[#f6f8f7] px-5 py-10"><div className="mx-auto max-w-2xl"><Logo/><div className="card mt-7 p-7 sm:p-9"><p className="text-sm font-black uppercase tracking-[.18em] text-[#145c5a]">Seu ponto de partida</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em]">Configure seu perfil</h1><p className="mb-7 mt-2 text-sm leading-6 text-[#6d807d]">Esses dados alimentam as estimativas iniciais. Você poderá alterá-los quando quiser.</p><OnboardingForm/></div></div></main>}
