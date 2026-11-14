// Shared by solo rendering, client prediction and the authoritative server.
// Around one minute of driving; actual finish time depends on the racer.
export const TRACK_RULES = [
 {length:4000,grip:.78},
 {length:4200,grip:.56},
 {length:4400,grip:1}
];
export const HAZARD_DENSITIES = {off:0,low:.5,normal:1,high:1.7};
export function cleanDensity(value){return Object.hasOwn(HAZARD_DENSITIES,value)?value:'normal';}
