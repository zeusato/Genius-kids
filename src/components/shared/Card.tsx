import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
    return (
        <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 ${className}`} {...props}>
            {children}
        </div>
    );
}
