import React from 'react';

interface MarkdownTextProps {
    text: string;
    className?: string;
}

/**
 * Simple markdown renderer for Tell Me Why content
 * Supports:
 * - **bold text**
 * - $\text{LaTeX}$ formulas (kept as-is for now)
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ text, className = '' }) => {
    // Parse **bold** syntax
    const parseBold = (input: string): (string | React.ReactElement)[] => {
        const parts: (string | React.ReactElement)[] = [];
        const regex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;
        let keyCounter = 0;

        while ((match = regex.exec(input)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(input.substring(lastIndex, match.index));
            }

            // Add bold text
            parts.push(
                <strong key={`bold-${keyCounter++}`} className="font-bold text-slate-900">
                    {match[1]}
                </strong>
            );

            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < input.length) {
            parts.push(input.substring(lastIndex));
        }

        return parts;
    };

    const renderedContent = parseBold(text);

    return <span className={className}>{renderedContent}</span>;
};

/**
 * Helper function to render answer text with line breaks preserved
 */
export const renderAnswerText = (text: string): React.JSX.Element => {
    const lines = text.split('\n');

    return (
        <>
            {lines.map((line, index) => (
                <React.Fragment key={index}>
                    <MarkdownText text={line} />
                    {index < lines.length - 1 && <br />}
                </React.Fragment>
            ))}
        </>
    );
};
