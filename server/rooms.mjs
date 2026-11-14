import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {CARS} from '../dist/catalog.js';
import {cleanName,cleanCustom} from '../dist/customization.js';
import {newVehicle,stepVehicle,roadCenter,roadHeading,obstacleContact} from '../dist/physics.js';
import {initialHazards,createHazardSchedule,timedHazard} from '../dist/hazards.js';
export const TRACKS=[{length:1600,grip:.78,name:'Borçka'},{length:1800,grip:.56,name:'Şavşat'},{length:2000,grip:1,name:'Hatila'}];
const blank=()=>({throttle:false,brake:false,handbrake:false,steer:0});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=v=>createHash('sha256').update(v).digest();
export function safeProfile(p={}){const car=CARS.findIndex(c=>c.id===p.carId);return {name:cleanName(p.name,'Yarışçı'),car:car<0?0:car,custom:cleanCustom(p.custom||{})};}
export class Rooms{
 constructor({now=Date.now,rng=Math.random}={}){this.now=now;this.rng=rng;this.rooms=new Map();}
 get(code){const r=this.rooms.get(String(code).toUpperCase());if(!r)throw Error('Oda bulunamadı. Kodu kontrol et veya yeni oda aç.');return r;}
 create(profile,track=0){if(this.rooms.size>=80)throw Error('Sunucu dolu. Biraz sonra tekrar dene.');let code;do{code=randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);}while(code.length!==6||this.rooms.has(code));const r={code,track:Number.isInteger(track)&&TRACKS[track]?track:0,host:null,players:[],phase:'lobby',raceId:null,startAt:null,simAt:null,elapsed:0,createdAt:this.now(),updatedAt:this.now(),hazards:[],eventId:0,nextSlot:0};this.rooms.set(code,r);return this.join(code,profile);}
 join(code,profile){const r=this.get(code);if(r.phase!=='lobby')throw Error('Yarış başlamış. Oda sahibinden yeni yarış açmasını iste.');if(r.players.length>=4)throw Error('Bu oda dolu; en fazla 4 kişi katılabilir.');const token=randomBytes(24).toString('hex'),p={id:randomBytes(12).toString('hex'),tokenHash:hash(token),profile:safeProfile(profile),slot:r.nextSlot++,connected:true,disconnectedAt:null,ready:false,input:blank(),seq:0,lastInputAt:0,v:null,finishTime:null,dnf:false,hits:new Map(),lastEvent:null,crashes:0,topSpeed:0};r.players.push(p);r.host??=p.id;r.updatedAt=this.now();return {room:r,player:p,token};}
 resume(code,id,token){const r=this.get(code),p=r.players.find(p=>p.id===id);if(!p||typeof token!=='string'||token.length!==48||!timingSafeEqual(p.tokenHash,hash(token)))throw Error('Odaya dönüş bilgisi geçersiz. Davet bağlantısıyla yeniden katıl.');p.connected=true;p.disconnectedAt=null;r.updatedAt=this.now();return {room:r,player:p};}
 disconnect(r,p){p.connected=false;p.disconnectedAt=this.now();p.input={...blank(),brake:true};if(r.phase==='lobby'){p.ready=false;this.transferHost(r);}r.updatedAt=this.now();}
 leave(r,p){if(r.phase==='lobby'){r.players=r.players.filter(x=>x!==p);if(r.host===p.id)r.host=null;this.transferHost(r);}else{p.connected=false;p.disconnectedAt=this.now()-31000;p.dnf=p.finishTime===null;p.input={...blank(),brake:true};}r.updatedAt=this.now();}
 transferHost(r){if(!r.players.some(p=>p.id===r.host&&p.connected))r.host=r.players.find(p=>p.connected)?.id||null;}
 ready(r,p,value){if(r.phase!=='lobby')throw Error('Hazır durumu yalnızca bekleme odasında değişir.');p.ready=!!value;}
 canStart(r){return r.phase==='lobby'&&r.players.length>=2&&r.players.every(p=>p.connected&&p.ready);}
 start(r,p){if(p.id!==r.host)throw Error('Yarışı yalnızca oda sahibi başlatabilir.');if(!this.canStart(r))throw Error('En az 2 oyuncu katılmalı ve herkes hazır olmalı.');r.phase='countdown';r.raceId=randomBytes(12).toString('hex');r.startAt=this.now()+3500;r.simAt=r.startAt;r.elapsed=0;r.eventId=0;r.hazards=initialHazards(TRACKS[r.track].length,this.rng).map((o,i)=>({...o,id:i+1,radius:o.kind==='water'?1.55:.55}));r.schedule=createHazardSchedule(this.rng);r.players.forEach((x,i)=>{x.v=newVehicle(r.track);x.v.s=Math.floor(i/2)*-3;x.v.lateral=i%2===0?-1.55:1.55;x.v.x=roadCenter(x.v.s,r.track)+x.v.lateral;x.v.heading=x.v.travelHeading=roadHeading(x.v.s,r.track);x.input=blank();x.seq=0;x.lastInputAt=this.now();x.finishTime=null;x.dnf=false;x.hits=new Map();x.lastEvent=null;x.crashes=0;x.topSpeed=0;});}
 rematch(r,p){if(p.id!==r.host)throw Error('Yeni yarışı oda sahibi açabilir.');if(!['finished','lobby'].includes(r.phase))throw Error('Önce mevcut yarışın bitmesini bekle.');r.players=r.players.filter(p=>p.connected);r.phase='lobby';r.raceId=null;r.startAt=null;r.elapsed=0;r.players.forEach(x=>{x.ready=false;x.finishTime=null;x.dnf=false;x.v=null;});this.transferHost(r);}
 input(r,p,m){if(!['countdown','racing'].includes(r.phase)||p.dnf||p.finishTime!==null)return;if(!Number.isSafeInteger(m.seq)||m.seq<=p.seq||m.seq>1e10)return;p.seq=m.seq;p.lastInputAt=this.now();p.input={throttle:m.throttle===true,brake:m.brake===true,handbrake:m.handbrake===true,steer:typeof m.steer==='number'&&Number.isFinite(m.steer)?clamp(m.steer,-1,1):0};}
 event(r,p,kind,strength){p.lastEvent={id:++r.eventId,kind,strength};}
 tick(r,now=this.now()){
  for(const p of r.players)if(!p.connected&&p.disconnectedAt!==null&&now-p.disconnectedAt>30000){if(r.phase==='lobby'){r.players=r.players.filter(x=>x!==p);this.transferHost(r);}else if(p.finishTime===null)p.dnf=true;}
  if(r.phase==='countdown'&&now>=r.startAt)r.phase='racing';if(r.phase!=='racing')return;
  const track=TRACKS[r.track],dt=1/60;
  for(let steps=0;r.simAt+1000/60<=now&&steps<30;steps++){
   r.simAt+=1000/60;r.elapsed=(r.simAt-r.startAt)/1000;
   const first=r.players.filter(p=>p.v&&!p.dnf).sort((a,b)=>b.v.s-a.v.s)[0];
   const hazard=timedHazard(r.schedule,{time:r.elapsed,s:first?.v.s||0,speed:first?.v.speed||0,length:track.length,traffic:r.players.filter(p=>p.v).map(p=>p.v),existing:r.hazards},this.rng);if(hazard)r.hazards.push({...hazard,id:r.hazards.length+1,radius:hazard.kind==='water'?1.55:.55});
   for(const p of r.players){if(p.dnf||p.finishTime!==null)continue;const v=p.v,old=v.s,c=CARS[p.profile.car],input=now-p.lastInputAt>550?{...blank(),brake:true}:p.input;
    stepVehicle(v,input,dt,{track:r.track,length:track.length,grip:track.grip,power:c.speed,handling:c.grip,maxKmh:c.maxKmh,durability:c.durability,minS:-20});
    if(v.impact>0){p.crashes++;this.event(r,p,'barrier',v.impact/83);}
    for(const o of r.hazards){if(v.speed<1.5||o.s+3<Math.min(old,v.s)||o.s-3>Math.max(old,v.s)||Math.abs(o.off-v.lateral)>o.radius+.63||r.elapsed-(p.hits.get(o.id)??-100)<1.4)continue;p.hits.set(o.id,r.elapsed);obstacleContact(v,o,c.durability);this.event(r,p,o.kind,v.speed);}
    p.topSpeed=Math.max(p.topSpeed,v.speed);if(v.s>=track.length){p.finishTime=r.elapsed;v.speed=0;p.input=blank();}
    if(r.elapsed>=180&&p.finishTime===null){p.dnf=true;v.speed=0;}
   }
   for(let i=0;i<r.players.length;i++)for(let j=i+1;j<r.players.length;j++){const a=r.players[i],b=r.players[j];if(a.dnf||b.dnf||a.finishTime!==null||b.finishTime!==null)continue;if(Math.abs(a.v.s-b.v.s)<1.7&&Math.abs(a.v.lateral-b.v.lateral)<1.2){const sign=a.v.lateral>=b.v.lateral?1:-1,move=(1.2-Math.abs(a.v.lateral-b.v.lateral))*.25;for(const [p,dir]of [[a,sign],[b,-sign]]){p.v.lateral=clamp(p.v.lateral+move*dir,-4.4,4.4);p.v.x=roadCenter(p.v.s,r.track)+p.v.lateral;p.v.speed*=.995;}}}
   if(r.players.every(p=>p.dnf||p.finishTime!==null)){r.phase='finished';this.transferHost(r);break;}
  }
 }
 snapshot(r){const ordered=[...r.players].sort((a,b)=>a.finishTime!==null&&b.finishTime!==null?a.finishTime-b.finishTime||a.slot-b.slot:a.finishTime!==null?-1:b.finishTime!==null?1:(b.v?.s||0)-(a.v?.s||0)||a.slot-b.slot);return {code:r.code,host:r.host,track:r.track,phase:r.phase,raceId:r.raceId,startAt:r.startAt,elapsed:r.elapsed,serverNow:this.now(),canStart:this.canStart(r),capacity:4,hazards:r.hazards,players:r.players.map(p=>({id:p.id,profile:p.profile,connected:p.connected,ready:p.ready,seq:p.seq,v:p.v?{...p.v}:null,finishTime:p.finishTime,dnf:p.dnf,rank:ordered.indexOf(p)+1,event:p.lastEvent,crashes:p.crashes,topSpeed:p.topSpeed}))};}
 cleanup(){const now=this.now();for(const [code,r]of this.rooms){if((!r.players.some(p=>p.connected)&&now-r.updatedAt>600000)||now-r.createdAt>7200000)this.rooms.delete(code);}}
}
