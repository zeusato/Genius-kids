import {
    NucleusSvg,
    MitochondriaSvg,
    ChloroplastSvg,
    VacuoleSvg,
    NucleoidSvg,
    ParticleSvg,
    FlagellumSvg,
    ERSvg,
    GolgiSvg,
    LysosomeSvg,
    CentrosomeSvg,
    PiliSvg,
    RibosomeSvg,
    CytoplasmBacSvg,
    CapsuleSvg,
    CellWallBacSvg,
    PlasmaMembraneSvg
} from './CellAssets';
import { Organelle as OrganelleType } from '@/src/data/cellData';

interface OrganelleProps {
    data: OrganelleType;
    onClick: (organelle: OrganelleType) => void;
    style?: React.CSSProperties;
    className?: string;
    rotation?: number;
}

export const Organelle: React.FC<OrganelleProps> = ({ data, onClick, style, className, rotation = 0 }) => {

    const renderIcon = () => {
        switch (data.id) {
            case 'nucleus': return <NucleusSvg className="w-full h-full" color={data.color} animate />;
            case 'mitochondria': return <MitochondriaSvg className="w-full h-full" color={data.color} animate />;
            case 'chloroplast': return <ChloroplastSvg className="w-full h-full" color={data.color} />;
            case 'vacuole': return <VacuoleSvg className="w-full h-full" color={data.color} />;
            case 'nucleoid': return <NucleoidSvg className="w-full h-full" color={data.color} />;
            case 'flagellum': return <FlagellumSvg className="w-full h-full" color={data.color} animate />;
            case 'er': return <ERSvg className="w-full h-full" color={data.color} />;
            case 'golgi': return <GolgiSvg className="w-full h-full" color={data.color} />;
            case 'lysosome': return <LysosomeSvg className="w-full h-full" color={data.color} />;
            case 'centrosome': return <CentrosomeSvg className="w-full h-full" color={data.color} />;
            // Bacteria specific
            case 'pili': return <PiliSvg className="w-full h-full" color={data.color} />;
            case 'ribosome': return <RibosomeSvg className="w-full h-full" color={data.color} />;
            case 'cytoplasm_bac': return <CytoplasmBacSvg className="w-full h-full" color={data.color} />;
            case 'capsule': return <CapsuleSvg className="w-full h-full" color={data.color} />;
            case 'cell_wall_bac': return <CellWallBacSvg className="w-full h-full" color={data.color} />;
            case 'plasma_membrane': return <PlasmaMembraneSvg className="w-full h-full" color={data.color} />;
            default: return <ParticleSvg className="w-full h-full" color={data.color} />;
        }
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick(data);
            }}
            className={`absolute transition-transform hover:scale-110 active:scale-95 group ${className}`}
            style={style}
        >
            {/* Icon Wrapper - Handles Rotation */}
            {/* We apply rotation filter here if needed, or simple transform */}
            <div
                className="relative w-full h-full filter drop-shadow-md group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {renderIcon()}
            </div>

            {/* Name Label - Clickable, Always on top */}
            <span
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-[100] border border-white/30 shadow-2xl scale-0 group-hover:scale-100 origin-top cursor-pointer hover:bg-white/20"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(data);
                }}
            >
                {data.name}
            </span>
        </button>
    );
};
