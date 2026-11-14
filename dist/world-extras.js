import * as THREE from './three.module.js';
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...extra});
const cube=(parent,w,h,d,m,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;};
function panel(title,subtitle,route,tourism=false){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=448;const c=canvas.getContext('2d');
 c.fillStyle=tourism?'#614a31':'#16543e';c.fillRect(0,0,1024,448);c.strokeStyle='#f0f0d9';c.lineWidth=12;c.strokeRect(18,18,988,412);c.fillStyle='#f7f7e9';c.fillRect(60,50,205,66);c.fillStyle=tourism?'#614a31':'#164c3d';c.font='bold 37px sans-serif';c.textAlign='center';c.fillText(route,162,96);
 c.fillStyle='#fffef1';c.textAlign='left';c.font='bold 70px sans-serif';c.fillText(title,59,206,910);c.font='36px sans-serif';c.fillText(subtitle,61,274,900);
 // Broad road arrows, legible at racing speed.
 for(const x of[220,750]){c.beginPath();c.moveTo(x,315);c.lineTo(x,388);c.moveTo(x-24,365);c.lineTo(x,389);c.lineTo(x+24,365);c.strokeStyle='#fffef1';c.lineWidth=14;c.lineJoin='round';c.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:texture,roughness:.65,emissive:0xb7d8c0,emissiveIntensity:.12});
}
export function makeGantry(title,subtitle){
 const g=new THREE.Group(),steel=material(0x79877f,{metalness:.65,roughness:.4});
 for(const x of[-6.4,6.4]){cube(g,.24,9.2,.24,steel,x,4.6,0);cube(g,.9,.26,.9,material(0x879182),x,.13,0);}
 for(const y of[8.45,9.05])cube(g,13.2,.15,.18,steel,0,y,0);
 for(let x=-6;x<6;x+=1.2){const brace=cube(g,1.38,.065,.065,steel,x+.5,8.75,0);brace.rotation.z=.45;}
 const left=cube(g,6.05,2.65,.13,panel(title,subtitle,'D 010'),-3.12,7.65,.16);
 const right=cube(g,6.05,2.65,.13,panel('ARTVİN','DAĞLARIN YARIŞI','YAYLA',true),3.12,7.65,.16);
 for(const x of[-5,-1.4,1.4,5]){cube(g,.8,.07,.32,steel,x,9.2,.35);cube(g,.6,.035,.2,new THREE.MeshBasicMaterial({color:0xe6f0ce}),x,9.15,.35);}
 return g;
}
export function makeChevron(text){const g=new THREE.Group(),c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#e8ad42';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#25372e';ctx.lineWidth=17;ctx.strokeRect(12,12,488,232);ctx.fillStyle='#1d3028';ctx.font='bold 120px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,168);cube(g,2.8,1.4,.09,new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(c)}),0,2,0);cube(g,.12,2.3,.12,material(0x849181),0,1.1,0);return g;}
export function makeRoadObstacle(kind,seed){
 const g=new THREE.Group();if(kind==='rock'){const m=material(0x8a8975);for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.36+i*.04,0),m);r.position.set((i-1)*.3,.18,(i%2)*.25);r.rotation.set(seed+i*.5,seed*.7,seed*.4);r.scale.set(1,.65+(i%2)*.35,1);r.castShadow=true;g.add(r);}}
 else{const water=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshPhysicalMaterial({color:0x497c87,roughness:.09,metalness:.25,clearcoat:1,transparent:true,opacity:.78,depthWrite:false}));water.rotation.x=-Math.PI/2;water.scale.set(1.55,2.8,1);water.position.y=.015;g.add(water);const ringMat=new THREE.MeshBasicMaterial({color:0xc2e3df,transparent:true,opacity:.28,depthWrite:false});for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.RingGeometry(.3+i*.3,.315+i*.3,40),ringMat);r.rotation.x=-Math.PI/2;r.position.y=.025;r.scale.y=1.6;g.add(r);}}
 return g;
}
