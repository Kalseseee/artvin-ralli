export const roadCenter=(s,track=0)=>Math.sin(s*.0055)*37+Math.sin(s*.0105+track)*9;
export const roadHeading=(s,track=0)=>Math.atan(Math.cos(s*.0055)*37*.0055+Math.cos(s*.0105+track)*9*.0105);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const roadHeight=(s,off=0)=>24-s*.065+Math.sin(s*.009)*4+.09+Math.sin(s*.37)*.006+Math.sin(s*.91+off*.4)*.003;
export const angleDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function newVehicle(track=0){return {travelHeading:roadHeading(0,track),slip:0,drift:0,isDrifting:false,lateralAccel:0,acceleration:0,s:0,x:roadCenter(0,track),heading:roadHeading(0,track),speed:0,lateral:0,impact:0,contact:false,steering:0,wet:0,damage:0};}
export function stepVehicle(v,input,dt,{track=0,length=1600,grip=1,power=1,handling=1,maxKmh=300,durability=1,minS=0}={}){
 const beforeSpeed=v.speed;v.impact=0;v.wet=Math.max(0,(v.wet||0)-dt);
 const throttle=input.throttle&&!input.brake;
 const wantsDrift=!!input.handbrake&&Math.abs(input.steer)>.08&&v.speed>9&&!input.brake;v.drift=clamp((v.drift||0)+(wantsDrift?3.3:-4.5)*dt,0,1);
 const acceleration=throttle?12.5*power:-(1.9+v.speed*.025);
 v.speed=clamp(v.speed+(acceleration-(input.brake?24:0)-v.drift*(3.0+v.speed*.025)-v.speed*v.speed*.00065)*dt,0,Math.min(300,maxKmh)/3.6);
 const gripNow=grip*(v.wet>0?.66:1);
 v.steering+=(input.steer-v.steering)*(1-Math.exp(-dt*(16+handling*2)*Math.max(.72,gripNow)));
 // World heading is independent of the road. Steering at standstill allows recovery after a hit.
 const requestedYaw=v.steering*(1.18/(1+v.speed/105))*handling*(1+v.drift*.38);
 const maxYaw=v.speed>3?9.81*4.4*gripNow*(1+v.drift*.18)/v.speed:1.5;
 const yaw=clamp(requestedYaw,-maxYaw,maxYaw);v.heading+=yaw*dt;
 const previousTravel=v.travelHeading??v.heading,slipTime=.05+v.speed*.00075+Math.max(0,1-gripNow)*.09+v.drift*.23;
 v.travelHeading=previousTravel+angleDifference(v.heading,previousTravel)*(1-Math.exp(-dt/slipTime));
 if(v.speed<.6)v.travelHeading=v.heading;
 v.slip=angleDifference(v.heading,v.travelHeading);const slipLimit=.17+v.drift*.25;if(Math.abs(v.slip)>slipLimit){v.travelHeading=v.heading-Math.sign(v.slip)*slipLimit;v.slip=angleDifference(v.heading,v.travelHeading);}v.isDrifting=v.drift>.2&&v.speed>9&&Math.abs(v.slip)>.035;v.lateralAccel=(v.travelHeading-previousTravel)/dt*v.speed;
 v.speed=Math.max(0,v.speed-Math.abs(v.slip)*v.speed*.11*dt);
 v.acceleration+=( (v.speed-beforeSpeed)/dt-v.acceleration)*(1-Math.exp(-dt*8));
 const oldX=v.x,oldS=v.s;v.x+=Math.sin(v.travelHeading)*v.speed*dt;v.s=clamp(v.s+Math.cos(v.travelHeading)*v.speed*dt,minS,length);
 const center=roadCenter(v.s,track),offset=v.x-center;
 if(Math.abs(offset)>4.42){const side=Math.sign(offset),roadDx=roadCenter(v.s,track)-roadCenter(oldS,track),outward=(v.x-oldX-roadDx)*side>0;v.x=center+side*4.42;
  if(outward){if(!v.contact&&v.speed>1.5){v.impact=v.speed;v.damage=clamp(v.damage+v.speed*.14/durability,0,100);v.speed*=clamp(.38+.13*durability,.4,.68);}else v.speed*=Math.exp(-dt*10);}v.contact=true;
 }else v.contact=false;
 v.lateral=v.x-roadCenter(v.s,track);return v;
}
export function obstacleContact(v,obstacle,durability=1){if(obstacle.kind==='water'){v.wet=1.35;v.speed*=.91;return 'water';}const before=v.speed;v.speed*=clamp(.60+.12*durability,.65,.84);v.damage=clamp(v.damage+before*.09/durability,0,100);v.heading+=(obstacle.off>=v.lateral?-.035:.035)/durability;return 'rock';}
