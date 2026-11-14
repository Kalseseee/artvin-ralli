import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {Rooms} from '../server/rooms.mjs';
import {createGameServer} from '../server/index.mjs';
import {roadCenter,roadHeading} from '../dist/physics.js';
const profile=name=>({name,carId:'yayla',custom:{plate:'08 LAZ 08',nickname:name}});
test('rooms enforce host, readiness, capacity, resume identity, isolation and input authority',()=>{
 let now=100000;const engine=new Rooms({now:()=>now}),a=engine.create(profile('Ali'),0),b=engine.join(a.room.code,profile('Efe'));
 assert.throws(()=>engine.start(a.room,b.player),/oda sahibi/);assert.throws(()=>engine.start(a.room,a.player),/hazır/);
 engine.ready(a.room,a.player,true);engine.ready(a.room,b.player,true);engine.start(a.room,a.player);
 const startAt=a.room.startAt;assert.equal(startAt,now+3500);assert.equal(engine.snapshot(a.room).players.length,2);
 now=startAt-1;engine.tick(a.room);assert.equal(a.room.phase,'countdown');assert.equal(a.player.v.speed,0);
 now=startAt+100;engine.input(a.room,a.player,{seq:1,throttle:false,steer:Infinity,s:1600,speed:9999,finishTime:-100});engine.tick(a.room);
 assert.equal(a.player.v.speed,0);assert.equal(a.player.finishTime,null);assert.ok(a.player.v.s<10);
 assert.throws(()=>engine.resume(a.room.code,a.player.id,'0'.repeat(48)),/geçersiz/);engine.disconnect(a.room,a.player);engine.resume(a.room.code,a.player.id,a.token);assert.equal(a.player.connected,true);
 const other=engine.create(profile('Başka'),1);assert.equal(other.room.players.length,1);assert.equal(a.room.players.length,2);
 engine.join(other.room.code,profile('2'));engine.join(other.room.code,profile('3'));engine.join(other.room.code,profile('4'));assert.throws(()=>engine.join(other.room.code,profile('5')),/dolu/);
 assert.ok(!JSON.stringify(engine.snapshot(a.room)).includes('tokenHash'));assert.ok(!JSON.stringify(engine.snapshot(a.room)).includes(a.token));
});
function peer(url){return new Promise((resolve,reject)=>{const ws=new WebSocket(url),messages=[],waiting=[];const receive=m=>{messages.push(m);for(const w of [...waiting])if(w.predicate(m)){clearTimeout(w.timer);waiting.splice(waiting.indexOf(w),1);w.resolve(m);}};ws.on('error',reject);ws.on('message',b=>receive(JSON.parse(b.toString())));ws.once('open',()=>resolve({ws,messages,send:m=>ws.send(JSON.stringify(m)),wait(predicate,timeout=7000){const old=messages.findLast(predicate);if(old)return Promise.resolve(old);return new Promise((resolve,reject)=>{const w={predicate,resolve,timer:setTimeout(()=>{waiting.splice(waiting.indexOf(w),1);reject(Error('Timed out waiting for websocket state'));},timeout)};waiting.push(w);});}}));});}
test('two real websocket clients share a room, countdown, authoritative results and rematch',{timeout:15000},async t=>{
 const app=createGameServer({port:0}),address=await app.listen(),url=`ws://127.0.0.1:${address.port}/ws`,http=`http://127.0.0.1:${address.port}`;t.after(()=>app.close());
 assert.equal((await (await fetch(http+'/api/health')).json()).online,true);
 assert.equal((await fetch(http+'/.openai/hosting.json')).status,404);
 const a=await peer(url),b=await peer(url);t.after(()=>{a.ws.close();b.ws.close();});a.send({type:'create',profile:profile('Ali'),track:0});const welcomeA=await a.wait(m=>m.type==='welcome');b.send({type:'join',code:welcomeA.room.code,profile:profile('Efe')});const welcomeB=await b.wait(m=>m.type==='welcome');assert.notEqual(welcomeA.yourId,welcomeB.yourId);
 await a.wait(m=>m.type==='room'&&m.room.players.length===2);a.send({type:'ready',value:true});b.send({type:'ready',value:true});await a.wait(m=>m.type==='room'&&m.room.canStart);a.send({type:'start'});
 const countdownA=await a.wait(m=>m.type==='room'&&m.room.phase==='countdown'),countdownB=await b.wait(m=>m.type==='room'&&m.room.phase==='countdown');assert.equal(countdownA.room.startAt,countdownB.room.startAt);assert.equal(countdownA.room.raceId,countdownB.room.raceId);
 await a.wait(m=>m.type==='room'&&m.room.phase==='racing');a.send({type:'input',seq:1,throttle:true,brake:false,steer:0});const moved=await a.wait(m=>m.type==='room'&&m.room.phase==='racing'&&m.room.players.find(p=>p.id===welcomeA.yourId)?.v?.speed>.7);assert.ok(moved.room.players.find(p=>p.id===welcomeA.yourId).v.s>0);assert.equal(moved.room.players.find(p=>p.id===welcomeB.yourId).v.speed,0);await b.wait(m=>m.type==='room'&&m.room.players.find(p=>p.id===welcomeA.yourId)?.v?.speed>.7);const r=app.rooms.get(welcomeA.room.code);const now=Date.now();for(let i=0;i<r.players.length;i++){const p=r.players[i];p.v.s=1599.9;p.v.x=roadCenter(p.v.s,0)+(i?1.5:-1.5);p.v.lateral=i?1.5:-1.5;p.v.heading=p.v.travelHeading=roadHeading(p.v.s,0);p.v.speed=i?12:24;p.lastInputAt=now;p.input={throttle:true,brake:false,handbrake:false,steer:0};}
 const finalA=await a.wait(m=>m.type==='room'&&m.room.phase==='finished'),finalB=await b.wait(m=>m.type==='room'&&m.room.phase==='finished');const scores=x=>x.room.players.map(p=>({id:p.id,time:p.finishTime,rank:p.rank}));assert.deepEqual(scores(finalA),scores(finalB));assert.ok(finalA.room.players.every(p=>Number.isFinite(p.finishTime)));
 a.send({type:'rematch'});const lobby=await b.wait(m=>m.type==='room'&&m.room.phase==='lobby'&&m.room.raceId===null&&m.room.players.every(p=>!p.ready));assert.equal(lobby.room.players.length,2);
 b.ws.close();await new Promise(resolve=>setTimeout(resolve,40));const reconnected=await peer(url);t.after(()=>reconnected.ws.close());reconnected.send({type:'resume',code:r.code,id:welcomeB.yourId,token:welcomeB.token});const resumed=await reconnected.wait(m=>m.type==='welcome');assert.equal(resumed.yourId,welcomeB.yourId);assert.equal(resumed.room.players.length,2);
});
