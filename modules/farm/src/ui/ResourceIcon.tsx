import { Icon } from './Icon';

/** Small inventory illustrations; silhouettes remain distinct without text labels. */
export function ResourceIcon({ id }: { id: string }) {
    if (id === 'tools') return <Icon name="hammer" size={28}/>;
    return <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        {id === 'coins' && <><ellipse cx="19" cy="29" rx="13" ry="5" fill="#b18436"/><path d="M6 24v5c0 6 26 6 26 0v-5" fill="#d6a442"/><ellipse cx="19" cy="24" rx="13" ry="5" fill="#f3ce6a"/><circle cx="24" cy="15" r="11" fill="#ce9b39"/><circle cx="24" cy="14" r="9" fill="#f5d371" stroke="#e6b349" strokeWidth="2"/><path d="m24 8 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#c99639"/></>}
        {id === 'wood' && <><path d="M7 19 23 8l10 8-17 12Z" fill="#886044"/><path d="m11 27 16-11 9 9-16 10Z" fill="#71503a"/><path d="m12 18 13-8m-6 16 13-8" stroke="#b18153" strokeWidth="2"/><ellipse cx="11" cy="24" rx="7" ry="8" fill="#d6ac72" stroke="#866144" strokeWidth="2"/><ellipse cx="20" cy="31" rx="6" ry="6" fill="#e2bd82" stroke="#866144" strokeWidth="2"/><ellipse cx="11" cy="24" rx="3" ry="4" stroke="#a97c4c"/><circle cx="20" cy="31" r="2.5" stroke="#a97c4c"/></>}
        {id === 'stone' && <><path d="m4 29 5-16 11-6 13 7 4 17-19 6Z" fill="#858b85"/><path d="m9 13 11-6 13 7-10 9-12-2Z" fill="#b2b5a8"/><path d="m4 29 7-8 12 2-5 14Z" fill="#999f92"/><path d="m23 23 10-9 4 17-19 6Z" fill="#707b76"/></>}
        {id === 'plank' && <><path d="m4 22 25-13 8 7-25 14Z" fill="#bd8c50"/><path d="m4 22 8 8v5l-8-7Zm8 8 25-14v5L12 35Z" fill="#916139"/><path d="m4 12 25-10 8 7-25 13Z" fill="#d9af72"/><path d="m4 12 8 10v5L4 17Zm8 10L37 9v5L12 27Z" fill="#b17e48"/><path d="m13 13 14-6m-8 15 11-6" stroke="#a67946" strokeWidth="1.5"/></>}
        {id === 'iron' && <><path d="m4 26 6-10 17-4 9 8-2 10-20 6Z" fill="#72868c"/><path d="m10 16 17-4 9 8-21 6Z" fill="#c0ced0"/><path d="m4 26 6-10 5 10-1 10Z" fill="#95aaaf"/><path d="m15 26 21-6-2 10-20 6Z" fill="#60777f"/></>}
        {id === 'brick' && <><path d="m3 25 22-10 12 8-23 11Z" fill="#a75e41"/><path d="M3 25v6l11 7v-4Zm11 9v4l23-11v-4Z" fill="#8d503b"/><path d="m4 13 22-9 10 7-22 10Z" fill="#d59066"/><path d="M4 13v7l10 7v-6Zm10 8v6l22-10v-6Z" fill="#b77350"/><path d="m14 9 11 7" stroke="#9d5d40" strokeWidth="2"/></>}
        {id === 'glass' && <><path d="m10 9 19-5 6 23-19 8Z" fill="#b7deda" stroke="#759e9f" strokeWidth="2"/><path d="m5 15 20-5 6 23-20 5Z" fill="#d9efdf" fillOpacity=".8" stroke="#86b4b2" strokeWidth="2"/><path d="m10 19 8-3m-6 11 10-4" stroke="#fffbea" strokeWidth="2"/></>}
        {id === 'cloth' && <><path d="m5 12 22-5 8 20-24 10Z" fill="#a4b9b6"/><path d="m5 12 8 18 22-8v8l-24 8-6-9Z" fill="#718f90"/><path d="m9 15 17-4m-14 9 16-5m-14 9 16-5" stroke="#d5dfcd" strokeWidth="2"/></>}
    </svg>;
}
