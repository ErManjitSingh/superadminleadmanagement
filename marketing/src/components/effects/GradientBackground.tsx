"use client";

export function GradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-glow" />
      <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: "4s" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
