import React, { useMemo } from 'react';
import { CellMembrane } from './CellMembrane';
import { Organelle } from './Organelle';
import { CellType, Organelle as OrganelleData } from '@/src/data/cellData';

interface CellCanvasProps {
    cellType: CellType;
    onOrganelleClick: (organelle: OrganelleData) => void;
}

export const CellCanvas: React.FC<CellCanvasProps> = ({ cellType, onOrganelleClick }) => {

    // Define positions for organelles based on cell type
    const organelleLayout: { id: string; style: React.CSSProperties; rotation?: number }[] = useMemo(() => {
        if (cellType.id === 'animal') {
            return [
                // Nucleus (Center)
                { id: 'nucleus', style: { top: '50%', left: '50%', width: '35%', height: '35%', transform: 'translate(-50%, -50%)', zIndex: 30 } },
                // Golgi Apparatus (Bottom Right)
                { id: 'golgi', style: { bottom: '8%', right: '10%', width: '22%', height: '18%', zIndex: 20 } },
                // Mitochondria (Scattered)
                { id: 'mitochondria', style: { top: '18%', left: '20%', width: '16%', height: '10%', transform: 'rotate(-30deg)', zIndex: 20 } },
                { id: 'mitochondria', style: { bottom: '20%', left: '15%', width: '15%', height: '10%', transform: 'rotate(15deg)', zIndex: 20 } },
                { id: 'mitochondria', style: { top: '25%', right: '15%', width: '14%', height: '9%', transform: 'rotate(50deg)', zIndex: 20 } },
                // Lysosome (Small)
                { id: 'lysosome', style: { top: '40%', left: '12%', width: '7%', height: '7%', zIndex: 25 } },
                { id: 'lysosome', style: { top: '60%', right: '12%', width: '6%', height: '6%', zIndex: 25 } },
                // Centrosome (Top center, visible)
                { id: 'centrosome', style: { top: '15%', left: '45%', width: '10%', height: '10%', zIndex: 35 } },
                // ER as subtle background
                { id: 'er', style: { top: '50%', left: '50%', width: '65%', height: '65%', transform: 'translate(-50%, -50%)', zIndex: 5 } }
            ];
        }
        if (cellType.id === 'plant') {
            return [
                // LAYER 1: Large Central Vacuole - Shifted to right to make room for Nucleus
                { id: 'vacuole', style: { top: '50%', left: '55%', width: '65%', height: '70%', transform: 'translate(-50%, -50%)', zIndex: 1 } },
                // LAYER 2: Golgi (Left side)
                { id: 'golgi', style: { top: '60%', left: '8%', width: '14%', height: '12%', zIndex: 10 } },
                // LAYER 3: Mitochondria (Edges)
                { id: 'mitochondria', style: { top: '15%', right: '20%', width: '11%', height: '7%', transform: 'rotate(-20deg)', zIndex: 15 } },
                { id: 'mitochondria', style: { bottom: '15%', right: '25%', width: '10%', height: '6%', transform: 'rotate(30deg)', zIndex: 15 } },
                // LAYER 4: Chloroplasts (Scattered around edges)
                { id: 'chloroplast', style: { top: '12%', right: '8%', width: '14%', height: '9%', transform: 'rotate(15deg)', zIndex: 20 } },
                { id: 'chloroplast', style: { bottom: '8%', left: '30%', width: '15%', height: '10%', transform: 'rotate(-10deg)', zIndex: 20 } },
                { id: 'chloroplast', style: { top: '50%', right: '5%', width: '12%', height: '8%', transform: 'rotate(60deg)', zIndex: 20 } },
                { id: 'chloroplast', style: { bottom: '35%', left: '8%', width: '13%', height: '8%', transform: 'rotate(-30deg)', zIndex: 20 } },
                // LAYER 5: Nucleus (Pushed to left side BY vacuole, INSIDE the cell)
                { id: 'nucleus', style: { top: '25%', left: '18%', width: '22%', height: '22%', zIndex: 30 } }
            ];
        }
        // Bacteria - Complete with all organelles from infographic
        return [
            // OUTER LAYERS (Background, clickable for info)
            // Capsule - Outermost slimy layer (top edge of cell)
            { id: 'capsule', style: { top: '2%', left: '50%', width: '40%', height: '8%', transform: 'translateX(-50%)', zIndex: 2 } },
            // Cell Wall - Hard shell (left edge)
            { id: 'cell_wall_bac', style: { top: '50%', left: '2%', width: '10%', height: '30%', transform: 'translateY(-50%)', zIndex: 3 } },
            // Plasma Membrane - Inner boundary (right edge)
            { id: 'plasma_membrane', style: { top: '50%', right: '2%', width: '10%', height: '30%', transform: 'translateY(-50%)', zIndex: 3 } },

            // INTERIOR
            // Cytoplasm - Background (center bottom)
            { id: 'cytoplasm_bac', style: { bottom: '15%', left: '50%', width: '50%', height: '15%', transform: 'translateX(-50%)', zIndex: 4 } },
            // Nucleoid - DNA region (Center)
            { id: 'nucleoid', style: { top: '38%', left: '50%', width: '50%', height: '30%', transform: 'translate(-50%, -50%)', zIndex: 10 }, rotation: 0 },
            // Ribosome dots (scattered)
            { id: 'ribosome', style: { top: '55%', left: '30%', width: '6%', height: '6%', zIndex: 15 } },
            { id: 'ribosome', style: { top: '50%', right: '28%', width: '5%', height: '5%', zIndex: 15 } },

            // EXTERIOR APPENDAGES
            // Pili (Hair-like, OUTSIDE at top)
            { id: 'pili', style: { top: '-10%', left: '25%', width: '10%', height: '15%', transform: 'rotate(-45deg)', zIndex: 30 } },
            { id: 'pili', style: { top: '-10%', right: '25%', width: '10%', height: '15%', transform: 'rotate(45deg)', zIndex: 30 } },
            // Flagellum (Tail at bottom)
            { id: 'flagellum', style: { top: '90%', left: '50%', width: '45px', height: '110px', transform: 'translateX(-50%)', zIndex: 25 } }
        ];
    }, [cellType.id]);

    return (
        <div className="relative flex items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
            <CellMembrane type={cellType.id} color={cellType.id === 'plant' ? '#22C55E' : cellType.id === 'bacteria' ? '#F59E0B' : '#A855F7'}>
                {organelleLayout.map((item, index) => {
                    const organelleData = cellType.organelles.find(o => o.id === item.id);
                    if (!organelleData) return null;

                    return (
                        <Organelle
                            key={`${item.id}-${index}`}
                            data={organelleData}
                            onClick={onOrganelleClick}
                            style={item.style}
                            rotation={item.rotation}
                        />
                    );
                })}

                <button
                    className="absolute inset-0 w-full h-full cursor-default -z-10"
                    onClick={() => {
                        const cyto = cellType.organelles.find(o => o.id === 'cytoplasms');
                        if (cyto) onOrganelleClick(cyto);
                    }}
                    aria-label="Cytoplasm"
                />
            </CellMembrane>
        </div>
    );
};
