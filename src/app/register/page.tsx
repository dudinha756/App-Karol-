import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export default function RegisterPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f6f8f7] px-5 py-10"><div className="w-full max-w-md"><Link href="/"><Logo /></Link><div className="card mt-7 p-7 sm:p-8"><p className="text-sm font-black uppercase tracking-[.18em] text-[#145c5a]">Primeiro passo</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em]">Crie sua conta</h1><p className="mb-7 mt-2 text-sm leading-6 text-[#6d807d]">Depois você configura seus dados corporais, objetivo e rotina.</p><AuthForm mode="register" /></div></div></main>;
}
