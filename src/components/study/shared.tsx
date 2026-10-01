// Mảnh dùng chung cho Ôn Luyện: icon topic, markdown đề, vòng %, hình câu hỏi.
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
    BarChart3, BookOpen, Box, Brackets, Calculator, CalendarDays, Clock, Coins, Compass, Dices, Divide, Hash, Keyboard,
    ListOrdered, Minus, Palette, Percent, PieChart, Plus, Ruler, Scale, Shapes, Sigma, Sparkles, Sun, Triangle, X, type LucideIcon,
} from 'lucide-react';
import type { Question } from '@/types';
import { visualOf } from '@/services/generators/svg/render';
import { parseValue } from '@/services/study/value';
import { remarkMathText } from '@/src/utils/mathText';

const ICONS: Record<string, LucideIcon> = {
    BarChart3, BookOpen, Box, Brackets, Calculator, CalendarDays, Clock, Coins, Compass, Dices, Divide, Hash, Keyboard,
    ListOrdered, Minus, Palette, Percent, PieChart, Plus, Ruler, Scale, Shapes, Sigma, Sparkles, Sun, Triangle, X,
};
export const TopicIcon = ({ name, size = 24 }: { name?: string; size?: number }) => {
    const I = (name && ICONS[name]) || Calculator;
    return <I size={size} />;
};

const mdComponents = { p: 'p' as const };
const remarkPlugins = [remarkMath, remarkGfm, remarkMathText];
/** Chữ inline (lựa chọn ">", "-", "1."…) không được thành khối Markdown: trích dẫn, danh sách, tiêu đề. */
const keepInline = (s: string) => s
    .replace(/^(\s*)([>#])/gm, '$1\\$2')
    .replace(/^(\s*)([-+*])(?=\s|$)/gm, '$1\\$2')
    .replace(/^(\s*)(\d+)([.)])(?=\s|$)/gm, '$1$2\\$3');
/** Markdown + KaTeX; phân số "a/b", hỗn số "2 3/4" hiện tử số trên, mẫu số dưới. */
export const Md = ({ children, inline = false }: { children: string; inline?: boolean }) => {
    const text = children.replace(/\\n/g, '\n');
    return (
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={[rehypeKatex]} components={inline ? { p: 'span' } : mdComponents}>
            {inline ? keepInline(text) : text}
        </ReactMarkdown>
    );
};

export const Ring = ({ value, done = false }: { value: number; done?: boolean }) => {
    const p = Math.round(Math.max(0, Math.min(1, value)) * 100);
    return <div className={`study-ring${done ? ' done' : ''}`} style={{ '--p': p } as React.CSSProperties} aria-label={`${p}% thành thạo`}><span>{p}%</span></div>;
};

export function QuestionVisual({ q, className = 'study-visual' }: { q: Question; className?: string }) {
    const svg = React.useMemo(() => visualOf(q), [q]);
    if (!svg) return null;
    return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export const hasVisual = (q: Question) => !!(q.visualSvg || q.visual);

/** Đặt tính trong lời giải, chỉ hiện sau khi chấm; không lưu chuỗi SVG vào lịch sử. */
export function SolutionVisual({ q }: { q: Question }) {
    let args: unknown[] | undefined;
    if (q.visual?.fn === 'columnArithSVG') args = [...q.visual.args.slice(0, 3), true];
    else {
        const match = q.questionText.match(/(?:^|:\s*)(\d[\d\s\u00a0]*)\s*([+×−-])\s*(\d[\d\s\u00a0]*)\s*(?:=|$)/);
        if (match) {
            const a = parseValue(match[1]), b = parseValue(match[3]);
            if (a !== null && b !== null && Number.isInteger(a) && Number.isInteger(b) && (a >= 10 || b >= 10)) args = [a, b, match[2] === '−' ? '-' : match[2], true];
        }
    }
    return args ? <QuestionVisual q={{ ...q, visualSvg: undefined, visual: { fn: 'columnArithSVG', args } }} className="study-solution-visual" /> : null;
}

export const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
