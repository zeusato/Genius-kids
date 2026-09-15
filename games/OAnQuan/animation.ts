import type {EventKind,TurnEvent} from './model';

// Each step includes time to notice the source, follow the move, and see it land.
const STEP_MS:Record<EventKind,number>={pickup:1000,drop:650,capture:1700,refill:700,sweep:1000,end:1200};
export function eventDuration(event:TurnEvent|undefined,fast:boolean){
  const normal=event?.kind==='capture'&&event.quan?2200:STEP_MS[event?.kind??'end'];
  return Math.round(normal*(fast?.65:1));
}
export function movementProgress(elapsed:number,duration:number){
  // Hold at the source for 15%, move for 65%, then rest at the destination.
  return Math.max(0,Math.min(1,(elapsed/duration-.15)/.65));
}
