"use client";

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface AvatarProps {
    state: AvatarState;
}

const STATE_RING: Record<AvatarState, string> = {
    idle: "ring-indigo-500/30 shadow-indigo-500/25",
    listening: "ring-emerald-400/70 shadow-emerald-400/40 animate-pulse",
    thinking: "ring-amber-400/70 shadow-amber-400/40",
    speaking: "ring-purple-500/80 shadow-purple-500/50 animate-pulse",
};

export default function Avatar3D({ state }: AvatarProps) {
    const ring = STATE_RING[state];

    return (
        <div className="w-[320px] h-[320px] flex items-center justify-center">
            <div
                className={`
                    relative group rounded-full overflow-hidden w-[260px] h-[260px]
                    border border-indigo-500/25 bg-slate-900/60 backdrop-blur-xl
                    shadow-2xl transition-all duration-700
                    ${ring}
                `}
            >
                {/* Lớp gradient nhẹ theo style Lumina */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent" />

                {/* Ảnh avatar giống người thật */}
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYdd8ZG27fInpgL0KkDNPCUjJC5zztOgPsA2EAGdMMwjyFNM_4blYbJBLn8oCH1_3ScotWvp1CJ_TxyWvkg6ZF3KowNtotfvfkL655cuRBtUdQuqEcjM_9alYHQ-TMrX0u5vEZdydzpPzyMsSJXPOYABQ6uAEk38tOT5xMKqqHLLnN5VYYz6KP_UrD4_R4LDaA7Jx5k3Y7oQM4_Bdg4xSnv3VnoExEgphjAcdIZvy9sImM9n7XvdwB1AjcnN2GJeajIhUysSkT-Vo"
                    alt="AI speaking partner"
                    className="relative z-10 w-full h-full object-cover object-top scale-110 translate-y-4 group-hover:scale-[1.05] group-hover:translate-y-2 transition-all duration-700 ease-out"
                />

                

                {/* Vòng viền mỏng bên trong */}
                <div className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute inset-5 rounded-full border border-white/5" />
            </div>
        </div>
    );
}
