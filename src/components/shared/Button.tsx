import React, { ButtonHTMLAttributes } from 'react';
import { soundManager } from '@/utils/sound';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
    children: React.ReactNode;
}

export function Button({
    onClick,
    children,
    variant = 'primary',
    className = '',
    disabled = false,
    ...props
}: ButtonProps) {
    const baseStyle = "px-6 py-3 rounded-xl font-bold shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap";
    const variants = {
        primary: "bg-brand-500 hover:bg-brand-600 text-white border-b-4 border-brand-700",
        secondary: "bg-white hover:bg-gray-50 text-brand-600 border-b-4 border-gray-200",
        success: "bg-fun-green hover:bg-green-500 text-white border-b-4 border-green-700",
        danger: "bg-fun-red hover:bg-red-500 text-white border-b-4 border-red-700",
        outline: "border-2 border-brand-500 text-brand-500 hover:bg-brand-50",
        ghost: "bg-transparent hover:bg-gray-100 text-slate-500 border-transparent shadow-none px-3 py-2"
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        soundManager.playClick();
        onClick?.(e);
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            {...props}
        >
            {children}
        </button>
    );
}
