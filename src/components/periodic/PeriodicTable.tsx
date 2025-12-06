import React, { useState, useMemo } from 'react';
import { ElementData, ELEMENTS_DATA, CATEGORY_COLORS } from '@/src/data/elementsData';
import { ElementCell } from './ElementCell';

interface PeriodicTableProps {
    onSelectElement: (element: ElementData) => void;
}

// Periodic table layout: [period][position in period] = atomicNumber
// Note: Lanthanides (57-71) and Actinides (89-103) are placed separately
const getElementPosition = (element: ElementData): { row: number; col: number } | null => {
    const { atomicNumber, period, group } = element;

    // Lanthanides (57-71) - row 8
    if (atomicNumber >= 57 && atomicNumber <= 71) {
        return { row: 8, col: atomicNumber - 54 }; // cols 3-17
    }

    // Actinides (89-103) - row 9
    if (atomicNumber >= 89 && atomicNumber <= 103) {
        return { row: 9, col: atomicNumber - 86 }; // cols 3-17
    }

    // Regular elements
    if (group === 0) return null; // Lanthanides/Actinides handled above

    return { row: period, col: group };
};

export const PeriodicTable: React.FC<PeriodicTableProps> = ({ onSelectElement }) => {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // Create grid layout
    const grid = useMemo(() => {
        const gridMap: Map<string, ElementData> = new Map();

        ELEMENTS_DATA.forEach(element => {
            const pos = getElementPosition(element);
            if (pos) {
                gridMap.set(`${pos.row}-${pos.col}`, element);
            }
        });

        return gridMap;
    }, []);

    // Generate grid cells
    const renderGrid = () => {
        const rows: React.ReactNode[] = [];

        // Main table (periods 1-7, groups 1-18)
        for (let row = 1; row <= 7; row++) {
            const cells: React.ReactNode[] = [];
            for (let col = 1; col <= 18; col++) {
                const element = grid.get(`${row}-${col}`);
                if (element) {
                    cells.push(
                        <div key={`${row}-${col}`} className="flex items-center justify-center">
                            <ElementCell
                                element={element}
                                onClick={onSelectElement}
                                size="md"
                            />
                        </div>
                    );
                } else {
                    // Empty cell
                    cells.push(<div key={`${row}-${col}`} className="w-14 h-14 sm:w-16 sm:h-16" />);
                }
            }
            rows.push(
                <div key={`row-${row}`} className="flex gap-0.5 sm:gap-1 justify-center">
                    {cells}
                </div>
            );
        }

        // Add separator
        rows.push(
            <div key="separator" className="h-4 sm:h-6" />
        );

        // Lanthanides row (row 8)
        const lanthanides: React.ReactNode[] = [];
        lanthanides.push(<div key="spacer-left" className="w-14 h-14 sm:w-16 sm:h-16" />);
        lanthanides.push(<div key="spacer-left-2" className="w-14 h-14 sm:w-16 sm:h-16" />);
        for (let col = 3; col <= 17; col++) {
            const element = grid.get(`8-${col}`);
            if (element) {
                lanthanides.push(
                    <div key={`8-${col}`} className="flex items-center justify-center">
                        <ElementCell
                            element={element}
                            onClick={onSelectElement}
                            size="md"
                        />
                    </div>
                );
            } else {
                lanthanides.push(<div key={`8-${col}`} className="w-14 h-14 sm:w-16 sm:h-16" />);
            }
        }
        lanthanides.push(<div key="spacer-right" className="w-14 h-14 sm:w-16 sm:h-16" />);
        rows.push(
            <div key="lanthanides" className="flex gap-0.5 sm:gap-1 justify-center">
                {lanthanides}
            </div>
        );

        // Actinides row (row 9)
        const actinides: React.ReactNode[] = [];
        actinides.push(<div key="spacer-left" className="w-14 h-14 sm:w-16 sm:h-16" />);
        actinides.push(<div key="spacer-left-2" className="w-14 h-14 sm:w-16 sm:h-16" />);
        for (let col = 3; col <= 17; col++) {
            const element = grid.get(`9-${col}`);
            if (element) {
                actinides.push(
                    <div key={`9-${col}`} className="flex items-center justify-center">
                        <ElementCell
                            element={element}
                            onClick={onSelectElement}
                            size="md"
                        />
                    </div>
                );
            } else {
                actinides.push(<div key={`9-${col}`} className="w-14 h-14 sm:w-16 sm:h-16" />);
            }
        }
        actinides.push(<div key="spacer-right" className="w-14 h-14 sm:w-16 sm:h-16" />);
        rows.push(
            <div key="actinides" className="flex gap-0.5 sm:gap-1 justify-center">
                {actinides}
            </div>
        );

        return rows;
    };

    // Category legend
    const categories = Object.entries(CATEGORY_COLORS).filter(([key]) => key !== 'unknown');

    const categoryNames: Record<string, string> = {
        'alkali-metal': 'Kim loại kiềm',
        'alkaline-earth': 'Kim loại kiềm thổ',
        'transition-metal': 'Kim loại chuyển tiếp',
        'post-transition': 'Kim loại sau chuyển tiếp',
        'metalloid': 'Á kim',
        'nonmetal': 'Phi kim',
        'halogen': 'Halogen',
        'noble-gas': 'Khí hiếm',
        'lanthanide': 'Lanthanide',
        'actinide': 'Actinide',
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* Legend */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 px-2">
                {categories.map(([key, value]) => (
                    <div
                        key={key}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs sm:text-sm transition-all"
                        style={{
                            backgroundColor: `${value.color}20`,
                            border: `1px solid ${value.color}`,
                            color: value.color,
                        }}
                    >
                        <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                            style={{
                                backgroundColor: value.color,
                                boxShadow: `0 0 6px ${value.glow}`
                            }}
                        />
                        <span className="hidden sm:inline">{categoryNames[key] || key}</span>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-fit px-2">
                {renderGrid()}
            </div>
        </div>
    );
};
