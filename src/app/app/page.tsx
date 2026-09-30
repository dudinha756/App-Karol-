import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function Page(){const id=await getSessionUserId();if(!id)redirect('/login');return <AppShell/>}
