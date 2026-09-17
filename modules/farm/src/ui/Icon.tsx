import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Check, ChevronRight, Coins, Droplets, Expand, Flower2, Hammer, Home, Leaf, Move, Package, Plus, RotateCw, Settings2, ShoppingBasket, Shovel, Sparkles, Sprout, Store, Sun, Target, Tractor, Wheat, X, ZoomIn, BookOpen, Milk, Cookie, CircleHelp, Eye, RefreshCw } from 'lucide-react';
const icons = { download: ArrowDownToLine, upload: ArrowUpFromLine, external: ArrowUpRight, left: ArrowLeft, right: ArrowRight, up: ArrowUp, down: ArrowDown, check: Check, next: ChevronRight, coins: Coins, water: Droplets, expand: Expand, flower: Flower2, hammer: Hammer, home: Home, leaf: Leaf, move: Move, package: Package, plus: Plus, rotate: RotateCw, settings: Settings2, basket: ShoppingBasket, shovel: Shovel, sparkles: Sparkles, sprout: Sprout, store: Store, sun: Sun, target: Target, tractor: Tractor, wheat: Wheat, close: X, zoom: ZoomIn, book: BookOpen, milk: Milk, bread: Cookie, help: CircleHelp, eye: Eye, refresh: RefreshCw };
export type IconName = keyof typeof icons;
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) { const I = icons[name]; return <I size={size} strokeWidth={1.7} aria-hidden="true" />; }
export function CropIcon({ id, size = 40 }: { id: string; size?: number }) {
  const crop = id === 'carrot' || id === 'corn' || id === 'pumpkin';
  if (!crop) return <Icon name={id === 'milk' ? 'milk' : id === 'bread' || id === 'cake' ? 'bread' : id === 'wheat' ? 'wheat' : 'package'} size={size} />;
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    {id === 'carrot' && <><path d="M14 17Q22 10 31 19L14 43Q7 43 14 17Z" fill="#dd8a49" /><path d="M22 15Q15 6 20 3M25 14Q24 3 30 3M27 16Q38 4 39 10" stroke="#6b914f" strokeWidth="4" strokeLinecap="round" /><path d="m14 24 7 3m-9 5 6 2" stroke="#b66337" strokeWidth="2" /></>}
    {id === 'corn' && <><ellipse cx="25" cy="21" rx="10" ry="17" fill="#e3b848" /><path d="M24 41Q5 33 10 18Q21 25 24 41M24 41Q42 33 39 19Q29 24 24 41" fill="#7f9b58" /><path d="M22 8v23m6-23v23m-10-16h14m-15 5h16m-16 5h16" stroke="#c99537" strokeWidth="1.5" /></>}
    {id === 'pumpkin' && <><path d="m24 15 3-10-7-2" stroke="#71834b" strokeWidth="4" strokeLinecap="round" /><ellipse cx="16" cy="29" rx="11" ry="13" fill="#c77736" /><ellipse cx="32" cy="29" rx="11" ry="13" fill="#c77736" /><ellipse cx="24" cy="29" rx="11" ry="15" fill="#e29b45" /><path d="M24 16v27" stroke="#c67a33" strokeWidth="2" /></>}
  </svg>;
}
