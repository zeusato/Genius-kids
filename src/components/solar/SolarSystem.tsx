import React, { useEffect, useState } from 'react';
import { PlanetData, SOLAR_SYSTEM_DATA } from '../../data/solarData';
import { Planet } from './Planet';

interface SolarSystemProps {
    selectedPlanet: PlanetData | null;
    onPlanetSelect: (id: string) => void;
    zoomLevel: number;
    viewOffset: { x: number; y: number };
}

export const SolarSystem: React.FC<SolarSystemProps> = ({ selectedPlanet, onPlanetSelect, zoomLevel, viewOffset }) => {
    const [rotationOffset, setRotationOffset] = useState(0);
    const TILT = 0.4; // Tilt factor (0.4 = viewed from ~66 degrees)

    // Generate random initial offsets for planets once on mount
    const initialOffsets = React.useMemo(() => {
        const offsets: Record<string, number> = {};
        SOLAR_SYSTEM_DATA.forEach(p => {
            offsets[p.id] = Math.random() * 360;
        });
        return offsets;
    }, []);

    // Generate Asteroid Belt particles
    const asteroids = React.useMemo(() => {
        const items = [];
        const count = 200;
        const beltRadius = 320; // Center of belt
        const beltWidth = 40;   // Width variance

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * 360;
            const distance = beltRadius + (Math.random() - 0.5) * beltWidth;
            const size = 2 + Math.random() * 3; // 2px to 5px
            const opacity = 0.4 + Math.random() * 0.4;
            const speedOffset = (Math.random() - 0.5) * 0.05; // Slight speed variance

            items.push({ id: i, angle, distance, size, opacity, speedOffset });
        }
        return items;
    }, []);

    // Animation loop for orbits
    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            setRotationOffset(prev => prev + 0.0015); // Reduced speed by 25% (was 0.002)
            animationFrameId = requestAnimationFrame(animate);
        };

        if (!selectedPlanet) {
            animate();
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [selectedPlanet]);

    // Calculate container transform based on selection
    const getContainerStyle = () => {
        if (selectedPlanet) {
            // Calculate current position of selected planet to center it
            const planet = selectedPlanet;
            const baseAngle = (rotationOffset * 10 / planet.orbitSpeed) * 360;
            const angleDeg = (baseAngle + initialOffsets[planet.id]) % 360;
            const angleRad = angleDeg * (Math.PI / 180);

            const x = Math.cos(angleRad) * planet.orbitDistance;
            const y = Math.sin(angleRad) * planet.orbitDistance * TILT;

            return {
                transform: `scale(${zoomLevel}) translate(${-x}px, ${-y}px)`,
                transition: 'transform 1s ease-in-out'
            };
        }
        return {
            transform: `scale(${zoomLevel}) translate(${viewOffset.x}px, ${viewOffset.y}px)`,
            transition: 'none' // No transition for pan, immediate feedback
        };
    };

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-black/0">
            <div
                className="relative w-0 h-0 transition-transform duration-700 ease-in-out"
                style={getContainerStyle()}
            >
                {/* Orbits Layer (SVG) */}
                <svg
                    className="absolute overflow-visible pointer-events-none"
                    style={{
                        width: '2000px',
                        height: '2000px',
                        zIndex: 0,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                    viewBox="-1000 -1000 2000 2000"
                >
                    {SOLAR_SYSTEM_DATA.map((planet) => (
                        <ellipse
                            key={planet.id}
                            cx="0"
                            cy="0"
                            rx={planet.orbitDistance}
                            ry={planet.orbitDistance * TILT}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1"
                        />
                    ))}
                </svg>

                {/* Sun */}
                <div
                    className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full bg-yellow-400 shadow-[0_0_60px_#ff9800] z-20 cursor-pointer hover:scale-110 transition-transform"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, #FFF176, #FF9800, #E65100)',
                        transform: 'translate(-50%, -80%)'
                    }}
                    onClick={() => onPlanetSelect('sun')}
                />

                {/* Asteroid Belt (Particles) */}
                <div className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 15 }}>
                    {asteroids.map((asteroid) => {
                        // Calculate position based on current rotation
                        // Asteroids move slowly together, with slight individual variance if desired
                        // For simplicity, they rotate with the main system but we can add their speedOffset
                        const currentAngle = asteroid.angle + (rotationOffset * 10) * (1 + asteroid.speedOffset);
                        const rad = currentAngle * (Math.PI / 180);
                        const x = Math.cos(rad) * asteroid.distance;
                        const y = Math.sin(rad) * asteroid.distance * TILT;

                        // Simple z-index logic for asteroids
                        const zIndex = y > 0 ? 25 : 15; // Behind or in front of Sun (Z=20)

                        return (
                            <div
                                key={asteroid.id}
                                className="absolute rounded-full bg-slate-400"
                                style={{
                                    width: `${asteroid.size}px`,
                                    height: `${asteroid.size}px`,
                                    opacity: asteroid.opacity,
                                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                    boxShadow: '0 0 2px rgba(255,255,255,0.3)',
                                    zIndex: zIndex
                                }}
                            />
                        );
                    })}
                </div>

                {/* Planets */}
                {SOLAR_SYSTEM_DATA.map((planet) => {
                    // Calculate position
                    const baseAngle = (rotationOffset * 10 / planet.orbitSpeed) * 360;
                    const angleDeg = (baseAngle + initialOffsets[planet.id]) % 360;
                    const angleRad = angleDeg * (Math.PI / 180);

                    const x = Math.cos(angleRad) * planet.orbitDistance;
                    const y = Math.sin(angleRad) * planet.orbitDistance * TILT;

                    // Z-Index logic: 
                    // Y > 0 means "bottom" of screen (closer to viewer in this tilt) -> Higher Z
                    // Y < 0 means "top" of screen (behind sun) -> Lower Z
                    // Sun is Z=20.
                    const zIndex = y > 0 ? 30 : 10;

                    return (
                        <div
                            key={planet.id}
                            className="absolute pointer-events-auto"
                            style={{
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                zIndex: zIndex
                            }}
                        >
                            <Planet
                                data={planet}
                                isSelected={selectedPlanet?.id === planet.id}
                                onSelect={onPlanetSelect}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
