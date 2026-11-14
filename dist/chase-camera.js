import {angleDifference} from './physics.js';
export function chasePose(anchor,heading,previousHeading,dt,mode=0){
 const yaw=previousHeading+angleDifference(heading,previousHeading)*(1-Math.exp(-dt*11));
 const back=mode===1?.18:mode===2?12.5:6.2,height=mode===1?1.48:mode===2?6.7:2.75;
 const lookAhead=mode===1?18:mode===2?3.5:2.8;
 const dx=Math.sin(yaw),dz=-Math.cos(yaw);
 // Anchor translation is immediate. Only heading is damped, so speed cannot leave the car behind.
 return {yaw,position:{x:anchor.x-dx*back,y:anchor.y+height,z:anchor.z-dz*back},target:{x:anchor.x+dx*lookAhead,y:anchor.y+.85,z:anchor.z+dz*lookAhead},fov:mode===1?65:mode===2?53:51};
}
