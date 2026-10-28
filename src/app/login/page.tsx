import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return <main className="soft-grid grid min-h-screen place-items-center px-5 py-10">
    <div className="w-full max-w-md">
      <Link href="/"><Logo /></Link>
      <div className="card mt-7 overflow-hidden p-7 sm:p-8">
        <div className="-mx-8 -mt-8 mb-7 h-2 bg-gradient-to-r from-[#5641ff] via-[#aa6cff] to-[#ff6cd2]" />
        <p className="eyebrow">Bem-vinda de volta</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#29154a]">Entre no Forma day</h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-[#7c718c]">Continue sua rotina de onde parou.</p>
        <AuthForm mode="login" />
      </div>
    </div>
  </main>;
}
