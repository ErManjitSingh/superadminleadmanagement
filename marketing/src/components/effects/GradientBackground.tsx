"use client";

export function GradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[hsl(224,71%,3%)]">
      {/* Aurora orbs */}
      <div className="absolute -left-[10%] top-[-20%] h-[700px] w-[700px] rounded-full bg-emerald-500/20 blur-[130px] animate-aurora" />
      <div className="absolute -right-[15%] top-[5%] h-[600px] w-[600px] rounded-full bg-cyan-500/15 blur-[120px] animate-aurora" style={{ animationDelay: "-7s" }} />
      <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-violet-600/12 blur-[110px] animate-aurora" style={{ animationDelay: "-14s" }} />
      <div className="absolute right-[25%] top-[45%] h-[350px] w-[350px] rounded-full bg-teal-400/10 blur-[90px] animate-pulse-glow" />

      {/* Top spotlight */}
      <div className="absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(168_76%_42%_/_0.14),transparent_65%)]" />

      {/* Grid */}
      <div className="absolute inset-0 hero-grid opacity-60" />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(224_71%_3%_/_0.4)_100%)]" />
    </div>
  );
}
