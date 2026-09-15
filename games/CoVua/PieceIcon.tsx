/** Original, resolution-independent pieces shared by 2D, captures and promotion. */
export default function PieceIcon({code,className=''}:{code:number;className?:string}) {
  const type=code&7, white=code<9;
  return <svg viewBox='0 0 64 72' className={className} aria-hidden='true' fill={white?'#fff2d3':'#47372b'} stroke={white?'#67513b':'#d8bc91'} strokeWidth='1.7' strokeLinejoin='round' strokeLinecap='round'>
    {type===1&&<path d='M24 27a11 11 0 1 1 16 0c-5 5-4 10 1 16l4 6H19l4-6c5-6 6-11 1-16Z'/>}
    {type===2&&<><path d='M17 50c-2-14-1-27 6-33l1-10 7 7 7-8 2 13 10 10 1 8-9 3-10-5c-6 6-6 11 1 15Z'/><path d='m24 20-5 6m3 0-5 6m3 0-4 6M38 27h1'/><path d='m44 34 5 1'/></>}
    {type===3&&<><path d='M20 41c-8-12 1-23 12-31 9 8 20 20 12 31l-8 3 7 6H21l7-6Z'/><path d='m34 15-7 15 8-3'/><circle cx='32' cy='8' r='3'/></>}
    {type===4&&<><path d='M19 49l3-24-6-5V9h8v8h5V9h7v8h5V9h8v11l-7 5 3 24Z'/><path d='M22 26h20M22 31h20'/></>}
    {type===5&&<><path d='m17 19 7 10 8-15 8 15 7-10-6 24H23Z'/><circle cx='16' cy='15' r='3'/><circle cx='32' cy='10' r='3'/><circle cx='48' cy='15' r='3'/><path d='M23 43h18l3 7H20Z'/></>}
    {type===6&&<><path d='M28 23V15h-7V9h7V3h8v6h7v6h-7v8'/><path d='M20 25c-6-9-12 1-7 8l10 10h18l10-10c5-7-1-17-7-8-5-6-19-6-24 0Z'/><path d='M24 43h16l5 7H19Z'/></>}
    <path d='M20 50h24l3 5H17Zm-3 5h30l3 5H14Zm-3 5h36l3 7H11Z'/>
    <path d='M19 63h26' opacity='.45'/>
  </svg>;
}
