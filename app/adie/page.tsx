import type { Metadata } from "next";
import Clock from "@/components/adie/Clock";

export const metadata: Metadata = {
  title: { absolute: "Adie — cjhauser.me" },
};

export default function AdiePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Botanical background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2560&auto=format&fit=crop')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-950/70" />

      {/* Botanical tint gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-transparent to-slate-950/80" />

      {/* Soft glow orb behind card */}
      <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full blur-3xl bg-white/10 pointer-events-none" />

      {/* Glass card */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-14 py-16 md:px-20 md:py-20 bg-white/10 backdrop-blur-[40px] border border-white/20 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/10">
        <h1 className="text-8xl md:text-9xl font-bold text-white/80 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] tracking-tight">
          Adie
        </h1>
        <Clock />
      </div>
    </div>
  );
}
