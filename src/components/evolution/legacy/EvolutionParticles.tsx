import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    r: number;
    vx: number;
    vy: number;
    opacity: number;
    hue: number;
    phase: number;
}

interface EvolutionParticlesProps {
    /** Era of the current root — controls color palette */
    era?: string;
}

const ERA_PALETTES: Record<string, { bg: string; hueRange: [number, number] }> = {
    'Hadean / Archean': { bg: 'radial-gradient(ellipse at 40% 60%, #0c1445 0%, #050a1a 70%)', hueRange: [200, 260] },
    'Archean': { bg: 'radial-gradient(ellipse at 40% 60%, #0c1445 0%, #050a1a 70%)', hueRange: [200, 260] },
    'Proterozoic': { bg: 'radial-gradient(ellipse at 50% 50%, #0a1e2e 0%, #050a1a 70%)', hueRange: [180, 240] },
    'Precambrian': { bg: 'radial-gradient(ellipse at 50% 50%, #0e1a2e 0%, #050a1a 70%)', hueRange: [190, 250] },
    'Cambrian': { bg: 'radial-gradient(ellipse at 50% 50%, #0a1e30 0%, #060d1f 70%)', hueRange: [170, 230] },
    'Paleozoic': { bg: 'radial-gradient(ellipse at 40% 40%, #0a2218 0%, #060d1f 70%)', hueRange: [120, 200] },
    'Mesozoic': { bg: 'radial-gradient(ellipse at 60% 40%, #1a1e0a 0%, #0a0d05 70%)', hueRange: [60, 140] },
    'Cenozoic': { bg: 'radial-gradient(ellipse at 50% 40%, #0e1e12 0%, #060d08 70%)', hueRange: [80, 160] },
};

const DEFAULT_PALETTE = { bg: 'radial-gradient(ellipse at 40% 60%, #0c1445 0%, #050a1a 70%)', hueRange: [200, 280] as [number, number] };

function getEraPalette(era?: string) {
    if (!era) return DEFAULT_PALETTE;
    // Try exact match, then partial
    if (ERA_PALETTES[era]) return ERA_PALETTES[era];
    const key = Object.keys(ERA_PALETTES).find(k => era.toLowerCase().includes(k.toLowerCase()));
    return key ? ERA_PALETTES[key] : DEFAULT_PALETTE;
}

export const EvolutionParticles: React.FC<EvolutionParticlesProps> = ({ era }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const palette = getEraPalette(era);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Init particles
        const count = Math.min(60, Math.floor(window.innerWidth * window.innerHeight / 25000));
        const [hueMin, hueMax] = palette.hueRange;
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 1 + Math.random() * 3,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.1 - Math.random() * 0.25, // float upward
            opacity: 0.15 + Math.random() * 0.35,
            hue: hueMin + Math.random() * (hueMax - hueMin),
            phase: Math.random() * Math.PI * 2,
        }));

        const animate = (t: number) => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of particlesRef.current) {
                p.x += p.vx + Math.sin(t * 0.0005 + p.phase) * 0.1;
                p.y += p.vy;

                // Wrap around
                if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;

                const pulseOpacity = p.opacity * (0.7 + 0.3 * Math.sin(t * 0.001 + p.phase));

                // Glow
                ctx.beginPath();
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                grad.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${pulseOpacity * 0.6})`);
                grad.addColorStop(1, `hsla(${p.hue}, 80%, 70%, 0)`);
                ctx.fillStyle = grad;
                ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.fillStyle = `hsla(${p.hue}, 80%, 80%, ${pulseOpacity})`;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [palette.hueRange]);

    return (
        <>
            {/* Gradient background based on era */}
            <div
                className="absolute inset-0 transition-all duration-[2000ms]"
                style={{ background: palette.bg }}
            />
            {/* Canvas particles */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: 0.7 }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }}
            />
        </>
    );
};
