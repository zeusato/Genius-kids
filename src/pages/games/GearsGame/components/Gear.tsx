import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export interface GearProps {
    x: number;
    y: number;
    teeth: number;
    radius: number;
    color?: string;
    speed: number;
    direction?: 1 | -1 | 0; // 1: CW, -1: CCW, 0: Stop
    isFixed?: boolean;
}

const Gear: React.FC<GearProps> = ({
    x,
    y,
    teeth,
    radius,
    color = '#4ade80', // Default green
    speed,
    direction = 0,
    isFixed = false,
}) => {
    const gearPath = useMemo(() => {
        const holeRadius = radius * 0.2;
        const teethHeight = radius * 0.25; // Increase teeth height (was 0.15) for better visuals
        const outerRadius = radius;
        const innerRadius = radius - teethHeight;
        const points: string[] = [];

        const angleStep = (Math.PI * 2) / teeth;

        for (let i = 0; i < teeth; i++) {
            const angle = i * angleStep;
            const nextAngle = (i + 1) * angleStep;

            // Tooth structure: Up - Flat - Down - Flat (Inner)
            const toothWidthAngle = angleStep * 0.5; // Width of a tooth cycle

            // 1. Inner point (Start of tooth)
            points.push(`${Math.cos(angle) * innerRadius},${Math.sin(angle) * innerRadius}`);

            // 2. Outer point (Go up)
            points.push(`${Math.cos(angle + toothWidthAngle * 0.2) * outerRadius},${Math.sin(angle + toothWidthAngle * 0.2) * outerRadius}`);

            // 3. Outer point (Flat top)
            points.push(`${Math.cos(angle + toothWidthAngle * 0.8) * outerRadius},${Math.sin(angle + toothWidthAngle * 0.8) * outerRadius}`);

            // 4. Inner point (Go down)
            points.push(`${Math.cos(nextAngle) * innerRadius},${Math.sin(nextAngle) * innerRadius}`);
        }

        // Close the loop
        return `M ${points.join(' L ')} Z`;
    }, [teeth, radius]);

    // Animation variants
    const variants = {
        animate: {
            rotate: direction === 0 ? 0 : 360 * direction,
            transition: {
                repeat: Infinity,
                ease: "linear" as any,
                // Speed = rotations per second. Duration = 1 / speed.
                // If speed is 0.5, duration is 2s. If speed is 2, duration is 0.5s.
                duration: speed > 0 ? 30 / Math.abs(speed) : 0, // Slower rotation (was 10)
            },
        },
        stop: {
            rotate: 0, // Or maintain current rotation? To keep it simple, we might reset or freeze.
            transition: { duration: 0 }
        }
    };

    // We wrap the gear in an SVG to ensure it renders correctly inside the DIV container.
    // The width/height of the SVG should be radius * 2.
    // The group <g> should be centered at (radius, radius).

    return (
        <svg
            width={radius * 2}
            height={radius * 2}
            style={{ overflow: 'visible' }}
        >
            <motion.g
                initial={false}
                animate={speed > 0 ? "animate" : "stop"}
                variants={variants}
                // Center the gear in the SVG. 
                // Note: The 'x' and 'y' props passed to this component were used for absolute positioning 
                // in the parent, but here we just want to center it in its own box.
                // WE IGNORE the passed 'x'/'y' for positioning the group, 
                // instead we fix it to the center of this SVG (which is radius, radius).
                style={{ originX: 0.5, originY: 0.5, x: radius, y: radius }}
            >
                {/* Gear Body */}
                <path
                    d={gearPath}
                    fill={color}
                    stroke="#1f2937"
                    strokeWidth="2"
                    filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.3))" // Add depth
                />

                {/* Center Hole */}
                <circle r={radius * 0.2} fill="#1f2937" />

                {/* Decorative inner circle for visual depth */}
                <circle r={radius * 0.6} fill="none" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />

                {/* Fixed Pin visual (only if fixed) */}
                {isFixed && (
                    <circle r={radius * 0.15} fill="#b45309" stroke="white" strokeWidth="2" />
                )}

                {/* Direction indicator (if moving) */}
                {speed !== 0 && (
                    <path
                        d={`M ${radius * 0.4} 0 L ${radius * 0.3} -${radius * 0.1} M ${radius * 0.4} 0 L ${radius * 0.3} ${radius * 0.1}`}
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="2"
                        transform={`rotate(${direction > 0 ? 0 : 180})`}
                    />
                )}
            </motion.g>
        </svg>
    );
};

export default Gear;
