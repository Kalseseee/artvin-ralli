// Original synthesized game melody; no third-party recording or network request.
export function createFolkLoop(){
 const rate=22050,beat=.155;
 const melody=[0,2,3,7,5,3,2,3,5,3,2,0,0,2,3,7,8,7,5,3,2,3,2,0,7,8,10,8,7,5,7,5,3,5,3,2,5,7,5,3,2,0,2,3,2,0,-2,0];
 const length=Math.round(melody.length*beat*rate),data=new Float32Array(length);
 for(let n=0;n<melody.length;n++){
  const freq=293.665*Math.pow(2,melody[n]/12),start=Math.round(n*beat*rate);
  for(let k=0;k<Math.round(beat*1.2*rate);k++){
   const t=k/rate,env=Math.min(t/.009,1)*Math.exp(-t*10),phase=2*Math.PI*freq*t+.035*Math.sin(t*2*Math.PI*6);
   let tone=0;for(let h=1;h<=5;h++)tone+=Math.sin(phase*h)/(h*h*.8);
   const bassFreq=n%12<6?146.832:130.813;
   const bass=Math.sin(2*Math.PI*bassFreq*t)*Math.exp(-t*18)*(n%3===0?.14:.03);
   const drum=n%3===0?Math.sin(2*Math.PI*(90*t-90*t*t))*Math.exp(-t*40)*.16:0;
   const tick=(Math.random()*2-1)*Math.exp(-t*150)*.045;
   data[(start+k)%length]+=tone*env*.17+bass+drum+tick;
  }
 }
 const bytes=new ArrayBuffer(44+length*2),view=new DataView(bytes);
 const str=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,36+length*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,length*2,true);
 for(let i=0;i<length;i++)view.setInt16(44+i*2,Math.max(-1,Math.min(1,data[i]))*32767,true);
 return new Blob([bytes],{type:'audio/wav'});
}
