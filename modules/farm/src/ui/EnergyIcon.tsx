/** A shared vector symbol: consistent silhouette on every font and screen. */
export function EnergyIcon({ size = 28 }: { size?: number }) {
    return <svg className="farm-energy-icon" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path d="M19.8 3.5 6.2 18.4h8.5l-2.9 11.1 14-16.7h-8.5l2.5-9.3Z" fill="#a7732c" stroke="#a7732c" strokeWidth="2.6" strokeLinejoin="round"/>
        <path d="M19.8 2.5 6.2 17.4h8.5l-2.9 11.1 14-16.7h-8.5l2.5-9.3Z" fill="#efbd4f" stroke="#9b722f" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="m19.8 2.5-9.6 13h6.5l-4.9 13 14-16.7h-8.5l2.5-9.3Z" fill="#f7ce69"/>
        <path d="m18.1 5.2-9.3 10.6h4.3" stroke="#fff0b9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
}
