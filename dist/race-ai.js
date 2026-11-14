import {newVehicle,stepVehicle,roadCenter,roadHeading,angleDifference,obstacleContact} from './physics.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const RACERS=[{name:'Laz Kaptan',car:1,skill:.98,bravery:1.04,lane:-2.35},{name:'Çoruh Ali',car:3,skill:.95,bravery:1,lane:2.35},{name:'Yayla Efe',car:5,skill:.91,bravery:.96,lane:-1.4}];
export function resetRacer(r,index,track){r.v=newVehicle(track);r.v.s=3+index*3;r.v.x=roadCenter(r.v.s,track)+r.profile.lane;r.v.heading=r.v.travelHeading=roadHeading(r.v.s,track);r.v.lateral=r.profile.lane;r.s=r.v.s;r.off=r.v.lateral;r.speed=0;r.finishTime=null;r.hits=new Map();r.passSide=0;}
export function planRacer(r,{track,length,grip,cars,obstacles,traffic}){
 const v=r.v,car=cars[r.profile.car],ahead=12+v.speed*.34;let lane=r.profile.lane*.65;
 // Choose a passing lane only when traffic is close ahead; never teleport or add free speed.
 const slower=traffic.find(t=>t!==r&&t.s>v.s&&t.s-v.s<25+v.speed*.45&&Math.abs(t.off-v.lateral)<1.5);
 if(slower){r.passSide=slower.off>0?-1:1;lane=r.passSide*2.7;}else r.passSide=0;
 for(const o of obstacles){const d=o.s-v.s;if(d>2&&d<35+v.speed*.45&&Math.abs(lane-o.off)<o.radius+1.0)lane=o.off>=0?-2.65:2.65;}
 // A small lane preference makes each rival readable, without a scripted weave.
 lane=clamp(lane,-3.0,3.0);r.laneTarget=lane;
 const desired=Math.atan2(roadCenter(v.s+ahead,track)+lane-v.x,ahead),error=angleDifference(desired,v.heading);
 const headingChange=angleDifference(roadHeading(v.s+12,track),roadHeading(v.s,track))/12;
 const rate=1.18/(1+v.speed/105)*car.grip;
 const steer=clamp((error*3.3+headingChange*v.speed*.45)/rate,-1,1);
 let target=car.maxKmh/3.6*r.profile.bravery;
 for(const distance of[12,30,55,90]){const curve=Math.abs(angleDifference(roadHeading(v.s+distance+8,track),roadHeading(v.s+distance-8,track))/16);const safe=Math.sqrt(9.81*1.9*grip*car.grip/Math.max(curve,.00001))*r.profile.bravery;const available=Math.sqrt(safe*safe+2*20*Math.max(0,distance-10));target=Math.min(target,available);}
 if(v.wet>0)target*=.86;
 if(Math.abs(error)>.18)target*=clamp(1-Math.abs(error)*.8,.35,1);
 if(Math.abs(v.lateral)>3.7)target=Math.min(target,14);
 if(slower&&Math.abs(lane-slower.off)<1.5)target=Math.min(target,Math.max(10,slower.speed-2));
 return {steer,throttle:v.speed<target-1,brake:v.speed>target+1.7};
}
export function updateRacer(r,dt,environment){
 if(r.finishTime!==null)return;const oldS=r.v.s,control=planRacer(r,environment),car=environment.cars[r.profile.car];r.control=control;
 stepVehicle(r.v,control,dt,{track:environment.track,length:environment.length,grip:environment.grip,power:car.speed,handling:car.grip,maxKmh:car.maxKmh,durability:car.durability,minS:-20});
 for(const o of environment.obstacles){if(o.s+.8<Math.min(oldS,r.v.s)||o.s-2.5>Math.max(oldS,r.v.s)||Math.abs(r.v.lateral-o.off)>o.radius+.62)continue;if(environment.time-(r.hits.get(o)||-100)<1.5)continue;r.hits.set(o,environment.time);obstacleContact(r.v,o,car.durability);}
 r.s=r.v.s;r.off=r.v.lateral;r.speed=r.v.speed;
 if(r.s>=environment.length){const portion=clamp((environment.length-oldS)/Math.max(.001,r.s-oldS),0,1);r.finishTime=environment.time-dt+dt*portion;r.v.speed=0;r.speed=0;}
}
