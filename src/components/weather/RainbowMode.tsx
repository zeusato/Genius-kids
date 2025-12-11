import React, { useState, useRef } from 'react';
import { CloudRain, Info } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// --- 3D COMPONENTS ---
const Sun3D = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.z += 0.002;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
            <Sphere ref={meshRef} args={[1.3, 64, 64]} scale={1}>
                <MeshDistortMaterial
                    color="#f59e0b"
                    emissive="#fbbf24"
                    emissiveIntensity={0.8}
                    roughness={0.4}
                    metalness={0.2}
                    distort={0.05}
                    speed={2}
                />
            </Sphere>
            <Sparkles count={20} scale={3.5} size={3} speed={0.4} opacity={0.6} color="#fbbf24" />
        </Float>
    );
};

// --- CLOUD DATA for natural movement ---
const CLOUDS = [
    { id: 1, size: 'w-24 h-12', top: '8%', delay: 0, duration: 35, fadeDelay: 5 },
    { id: 2, size: 'w-32 h-16', top: '12%', delay: 8, duration: 40, fadeDelay: 15 },
    { id: 3, size: 'w-20 h-10', top: '5%', delay: 15, duration: 30, fadeDelay: 8 },
    { id: 4, size: 'w-40 h-20', top: '18%', delay: 3, duration: 50, fadeDelay: 20 },
    { id: 5, size: 'w-28 h-14', top: '15%', delay: 20, duration: 38, fadeDelay: 12 },
    { id: 6, size: 'w-36 h-18', top: '10%', delay: 12, duration: 45, fadeDelay: 25 },
];


export const RainbowMode: React.FC = () => {
    const [sunPosition, setSunPosition] = useState(20);
    const [isRaining, setIsRaining] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const TARGET_MIN = 30;
    const TARGET_MAX = 45;

    const getRainbowIntensity = () => {
        if (!isRaining) return 0;
        if (sunPosition >= TARGET_MIN && sunPosition <= TARGET_MAX) return 1;

        const FADE = 12;
        if (sunPosition < TARGET_MIN && sunPosition > TARGET_MIN - FADE) {
            return (sunPosition - (TARGET_MIN - FADE)) / FADE;
        }
        if (sunPosition > TARGET_MAX && sunPosition < TARGET_MAX + FADE) {
            return ((TARGET_MAX + FADE) - sunPosition) / FADE;
        }
        return 0;
    };

    const intensity = getRainbowIntensity();
    const isSuccess = intensity > 0.8;
    const sunBottomPercent = Math.sin((sunPosition / 100) * Math.PI) * 60 + 10;

    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-blue-200 transition-colors duration-1000">

            {/* Rain Darkening */}
            <div className={`absolute inset-0 bg-slate-900/30 pointer-events-none transition-opacity duration-1000 ${isRaining ? 'opacity-100' : 'opacity-0'}`} />

            {/* Dynamic Clouds */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {CLOUDS.map((cloud) => (
                    <div
                        key={cloud.id}
                        className={`absolute text-white/50 ${cloud.size}`}
                        style={{
                            top: cloud.top,
                            animation: `
                                cloudDrift ${cloud.duration}s linear infinite,
                                cloudFade ${cloud.duration / 2}s ease-in-out infinite
                            `,
                            animationDelay: `${cloud.delay}s, ${cloud.fadeDelay}s`
                        }}
                    >
                        <CloudSVG className="w-full h-full" />
                    </div>
                ))}
            </div>

            {/* Rain Particles */}
            <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${isRaining ? 'opacity-100' : 'opacity-0'}`}>
                <div className="rain-container">
                    {[...Array(60)].map((_, i) => (
                        <div key={i} className="rain-drop" style={{
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${0.4 + Math.random() * 0.4}s`,
                            animationDelay: `${Math.random()}s`
                        }} />
                    ))}
                </div>
            </div>

            {/* Rainbow */}
            <div
                className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[200vw] h-[100vw] md:w-[150vh] md:h-[75vh] opacity-0 transition-opacity duration-1000 ease-in-out z-10 pointer-events-none mix-blend-screen filter blur-xl"
                style={{
                    opacity: intensity * 0.9,
                    background: `
                        radial-gradient(circle at 50% 100%, 
                            transparent 48%, 
                            rgba(148, 0, 211, 0.8) 50%, 
                            rgba(75, 0, 130, 0.8) 52%, 
                            rgba(0, 0, 255, 0.8) 54%, 
                            rgba(0, 255, 0, 0.8) 56%, 
                            rgba(255, 255, 0, 0.8) 58%, 
                            rgba(255, 127, 0, 0.8) 60%, 
                            rgba(255, 0, 0, 0.8) 62%, 
                            transparent 65%
                        )
                    `
                }}
            />
            <div
                className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[200vw] h-[100vw] md:w-[150vh] md:h-[75vh] opacity-0 transition-opacity duration-1000 ease-in-out z-0 pointer-events-none mix-blend-overlay filter blur-3xl"
                style={{
                    opacity: intensity * 0.6,
                    background: `radial-gradient(circle at 50% 100%, transparent 45%, rgba(255,255,255,0.4) 55%, transparent 70%)`
                }}
            />

            {/* 3D Sun */}
            <div className="absolute inset-0 pointer-events-none">
                {/* CSS Glow */}
                <div
                    className="absolute w-40 h-40 rounded-full"
                    style={{
                        left: `${sunPosition}%`,
                        bottom: `${sunBottomPercent}%`,
                        transform: 'translate(-50%, 50%)',
                        background: 'radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(251,191,36,0.5) 40%, rgba(251,191,36,0) 70%)',
                        filter: 'blur(20px)',
                        pointerEvents: 'none'
                    }}
                />

                {/* 3D Canvas */}
                <div
                    className="absolute w-40 h-40 cursor-grab active:cursor-grabbing pointer-events-auto transition-transform duration-75 ease-out z-20 flex items-center justify-center"
                    style={{
                        left: `${sunPosition}%`,
                        bottom: `${sunBottomPercent}%`,
                        transform: 'translate(-50%, 50%)'
                    }}
                >
                    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true }}>
                        <ambientLight intensity={0.8} />
                        <pointLight position={[5, 10, 5]} intensity={1.5} />
                        <Sun3D />
                    </Canvas>
                </div>
            </div>

            {/* Educational Info Panel */}
            <div className={`absolute top-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 transition-all duration-500 ${showInfo ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 text-slate-800">
                    <h3 className="font-bold text-lg mb-2 text-purple-600">🌈 Vì sao có Cầu Vồng?</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="font-bold">1.</span> Cần có <span className="text-blue-500 font-bold">giọt nước</span> trong không khí (mưa, sương).</p>
                        <p><span className="font-bold">2.</span> Cần có <span className="text-yellow-500 font-bold">ánh nắng mặt trời</span> chiếu từ phía sau bạn.</p>
                        <p><span className="font-bold">3.</span> Mặt trời phải ở <span className="text-orange-500 font-bold">góc thấp</span> (khoảng 42° so với đường chân trời).</p>
                        <div className="mt-3 p-2 bg-purple-100 rounded-lg text-purple-700 text-xs">
                            💡 <strong>Thử ngay:</strong> Bật mưa, rồi kéo mặt trời về phía "Sáng" hoặc "Chiều"!
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50 flex flex-col items-center gap-4">

                <div className={`text-2xl font-bold transition-all duration-700 text-center drop-shadow-md
                    ${isSuccess ? 'text-white opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                 `}>
                    🌈 Cầu vồng rực rỡ!
                </div>

                <div className="flex items-center gap-3 w-full bg-black/30 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-xl">
                    {/* Info Button */}
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${showInfo ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}
                        `}
                    >
                        <Info size={18} />
                    </button>

                    {/* Rain Button */}
                    <button
                        onClick={() => setIsRaining(!isRaining)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${isRaining ? 'bg-sky-500 text-white shadow-lg scale-110' : 'bg-white/10 text-white/50 hover:bg-white/20'}
                        `}
                    >
                        <CloudRain size={18} className={isRaining ? 'animate-bounce' : ''} />
                    </button>

                    {/* Sun Slider */}
                    <div className="flex-1 pr-3">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sunPosition}
                            onChange={(e) => setSunPosition(parseFloat(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-400"
                        />
                        <div className="flex justify-between px-1 mt-1">
                            <span className="text-[8px] font-bold text-white/40 uppercase">Sáng</span>
                            <span className="text-[8px] font-bold text-white/40 uppercase">Trưa</span>
                            <span className="text-[8px] font-bold text-white/40 uppercase">Chiều</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .rain-container { position: absolute; width: 100%; height: 100%; transform: rotate(15deg); }
                .rain-drop {
                    position: absolute; top: -20px; width: 1px; height: 50px;
                    background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.5));
                    animation: fall linear infinite;
                }
                @keyframes fall { to { transform: translateY(110vh); } }
                
                @keyframes cloudDrift {
                    0% { left: 110%; }
                    100% { left: -30%; }
                }
                
                @keyframes cloudFade {
                    0%, 100% { opacity: 0.3; }
                    20% { opacity: 0.7; }
                    50% { opacity: 0.5; }
                    80% { opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

const CloudSVG = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
        <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-1.45,0.563-2.78,1.484-3.793C12.871,6.883,10.636,5,8,5c-3.313,0-6,2.687-6,6c0,2.946,2.127,5.405,4.934,5.886C6.911,16.923,6.953,17,7,17h10.5c2.485,0,4.5-2.015,4.5-4.5S19.985,8,17.5,8c-0.23,0-0.455,0.019-0.676,0.051C16.48,6.864,15.111,6,13.5,6c-2.485,0-4.5,2.015-4.5,4.5c0,0.519,0.09,1.018,0.252,1.484C7.309,12.551,6,14.12,6,16c0,2.209,1.791,4,4,4h7.5c1.933,0,3.5-1.567,3.5-3.5S19.433,13,17.5,13z" />
    </svg>
);
