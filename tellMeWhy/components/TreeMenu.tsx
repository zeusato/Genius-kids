import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Lock, Star, ArrowUp, Minimize2 } from 'lucide-react';
import { TreeNode } from '../types';

interface TreeMenuProps {
    treeData: TreeNode[];
    selectedQuestionId: number | null;
    onSelectQuestion: (questionData: any) => void;
    onUnlockSubCategory: (categoryId: number, subCategory: string) => void;
    currentStars: number;
}

export const TreeMenu: React.FC<TreeMenuProps> = ({
    treeData,
    selectedQuestionId,
    onSelectQuestion,
    onUnlockSubCategory,
    currentStars
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const toggleNode = (nodeId: string, node: TreeNode) => {
        const newExpanded = new Set(expandedNodes);

        // Auto-collapse other subcategories in the same category when expanding a subcategory
        if (node.type === 'subcategory' && !newExpanded.has(nodeId)) {
            // Find parent category and collapse all its subcategory children except this one
            treeData.forEach(cat => {
                if (cat.children) {
                    cat.children.forEach(subCat => {
                        if (subCat.id !== nodeId && subCat.type === 'subcategory') {
                            newExpanded.delete(subCat.id);
                        }
                    });
                }
            });
        }

        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    // Collapse all nodes
    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    // Scroll to top
    const scrollToTop = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderNode = (node: TreeNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const canExpand = hasChildren && !node.isLocked;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`
                        flex items-center gap-2 px-3 py-2 cursor-pointer
                        hover:bg-brand-50 rounded-lg transition-colors
                        ${node.type === 'question' && selectedQuestionId === node.questionData?.id
                            ? 'bg-brand-100 text-brand-700 font-semibold'
                            : ''
                        }
                        ${level === 0 ? 'font-bold text-lg' : ''}
                        ${level === 1 ? 'font-semibold text-base' : ''}
                        ${level === 2 ? 'text-sm' : ''}
                    `}
                    style={{ paddingLeft: `${level * 20 + 12}px` }}
                    onClick={() => {
                        if (node.type === 'question' && node.questionData) {
                            onSelectQuestion(node.questionData);
                        } else if (node.type === 'subcategory' && node.isLocked) {
                            // Trigger unlock request - parent will show modal
                            onUnlockSubCategory(node.categoryId!, node.subCategory!);
                        } else if (canExpand) {
                            toggleNode(node.id, node);
                        }
                    }}
                >
                    {/* Expand/Collapse Icon */}
                    {hasChildren && !node.isLocked && (
                        <span className="flex-shrink-0">
                            {isExpanded ? (
                                <ChevronDown size={18} className="text-slate-600" />
                            ) : (
                                <ChevronRight size={18} className="text-slate-600" />
                            )}
                        </span>
                    )}

                    {/* Lock Icon */}
                    {node.isLocked && (
                        <span className="flex-shrink-0">
                            <Lock size={16} className="text-yellow-600" />
                        </span>
                    )}

                    {/* Icon for node types */}
                    {!hasChildren && !node.isLocked && node.type === 'question' && (
                        <span className="flex-shrink-0 text-brand-500">❓</span>
                    )}

                    {/* Node Label */}
                    <span
                        className="flex-1"
                        style={{
                            whiteSpace: node.type === 'question' ? 'normal' : 'nowrap',
                            overflow: node.type === 'question' ? 'visible' : 'hidden',
                            textOverflow: node.type === 'question' ? 'clip' : 'ellipsis'
                        }}
                        title={node.label}
                    >
                        {node.label}
                    </span>

                    {/* Unlock cost badge */}
                    {node.isLocked && node.unlockCost && (
                        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                            <Star size={12} fill="currentColor" />
                            {node.unlockCost}
                        </span>
                    )}
                </div>

                {/* Render children */}
                {isExpanded && hasChildren && (
                    <div className="ml-2">
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200">
            {/* Sticky Header */}
            <div className="bg-gradient-to-r from-brand-500 to-purple-500 px-4 py-3 border-b border-white/20 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-bold text-sm flex-1">Danh mục</h3>

                    <div className="flex gap-2">
                        {/* Scroll to top button */}
                        <button
                            onClick={scrollToTop}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            title="Về đầu trang"
                        >
                            <ArrowUp size={16} className="text-white" />
                        </button>

                        {/* Collapse all button */}
                        <button
                            onClick={collapseAll}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            title="Thu gọn tất cả"
                        >
                            <Minimize2 size={16} className="text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-2">
                <div className="space-y-1">
                    {treeData.map(node => renderNode(node, 0))}
                </div>

                {treeData.length === 0 && (
                    <div className="text-center text-slate-400 py-12">
                        <p>Chưa có nội dung 📚</p>
                    </div>
                )}
            </div>
        </div>
    );
};
