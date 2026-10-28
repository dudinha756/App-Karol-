import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const params = await searchParams;
  const inviteToken = params?.invite;

  return <main className="soft-grid grid min-h-screen place-items-center px-5 py-10">
    <div className="w-full max-w-md">
      <Link href="/"><Logo /></Link>
      <div className="card mt-7 overflow-hidden p-7 sm:p-8">
        <div className="-mx-8 -mt-8 mb-7 h-2 bg-gradient-to-r from-[#5641ff] via-[#aa6cff] to-[#ff6cd2]" />
        <p className="eyebrow">Comece sua jornada</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#29154a]">Crie sua conta</h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-[#7c718c]">Cadastre-se com seu e-mail e uma senha. Não é necessário convite para começar.</p>
        <AuthForm mode="register" inviteToken={inviteToken} />
      </div>
    </div>
  </main>;
}
