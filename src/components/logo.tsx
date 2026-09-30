import { Activity } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 font-black tracking-tight text-[#103f3d]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#145c5a] text-white"><Activity size={19} /></span>
      {!compact && <span className="text-xl">Forma</span>}
    </div>
  );
}
