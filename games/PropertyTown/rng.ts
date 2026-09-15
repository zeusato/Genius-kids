export function next(seed:number):[number,number]{let x=(seed+0x6D2B79F5)>>>0,t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return[((t^t>>>14)>>>0)/4294967296,x];}
export function shuffle<T>(values:T[],seed:number):[T[],number]{const a=[...values];for(let i=a.length-1;i>0;i--){const [r,n]=next(seed);seed=n;const j=Math.floor(r*(i+1));[a[i],a[j]]=[a[j],a[i]];}return[a,seed];}
