const between=(rng,a,b)=>a+(b-a)*rng();
export function initialHazards(length,rng=Math.random){
 const result=[];let s=between(rng,105,165);
 while(s<length-85){result.push({s,off:between(rng,-2.9,2.9),kind:rng()<.43?'water':'rock',seed:rng()*100});s+=between(rng,120,205);}
 return result;
}
export function createHazardSchedule(rng=Math.random){return {nextAt:between(rng,3.5,6.5)};}
export function timedHazard(schedule,{time,s,speed,length,traffic=[],existing=[]},rng=Math.random){
 if(time<schedule.nextAt)return null;schedule.nextAt=time+between(rng,4.5,8.5);
 let at=s+Math.max(105,speed*2.7+45)+between(rng,10,60);
 // Only appear well ahead, never beneath any racer or on top of another obstacle.
 for(let tries=0;tries<12;tries++){
  if(at>length-85)return null;
  if(traffic.some(v=>Math.abs(v.s-at)<65)||existing.some(o=>Math.abs(o.s-at)<34)){at+=between(rng,40,65);continue;}
  return {s:at,off:between(rng,-2.9,2.9),kind:rng()<.46?'water':'rock',seed:rng()*100};
 }
 return null;
}
