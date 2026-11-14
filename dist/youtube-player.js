let loading;
function loadAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const old=window.onYouTubeIframeAPIReady;
  const timer=setTimeout(()=>{loading=null;reject(new Error('YouTube bu tarayıcıda yüklenemedi. Oyunu Chrome/Edge’de açmayı dene veya müzik dosyası seç.'));},12000);
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);old?.();resolve(window.YT);};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.referrerPolicy='strict-origin-when-cross-origin';
  script.onerror=()=>{clearTimeout(timer);loading=null;script.remove();reject(new Error('YouTube bağlantısı engellendi. MP3 bağlantısı veya Dosya aç seçeneğini kullanabilirsin.'));};
  document.head.appendChild(script);
 });return loading;
}
export async function bindYouTube(iframe,events){
 const YT=await loadAPI();
 if(!iframe.isConnected)return {destroy(){}};
 return new YT.Player(iframe,{events:{onReady:()=>events.ready(),onError:e=>events.error(Number(e.data)),onStateChange:e=>{if(e.data===1)events.playing();},onAutoplayBlocked:()=>events.ready()}});
}
export function videoErrorMessage(code){
 const suffix=' Oyun içinde çalmak için MP3/OGG bağlantısı veya Dosya aç seçeneğini kullanabilirsin.';
 if(code===153)return 'YouTube hatası 153: tarayıcı, oynatıcı için gereken site bilgisini iletmiyor. Oyunu normal Chrome/Edge penceresinde açmayı dene.'+suffix;
 if(code===101||code===150)return 'YouTube hatası '+code+': bu videonun sahibi başka sitelerde oynatmayı kapatmış. YouTube’da açabilir veya başka bir video seçebilirsin.'+suffix;
 if(code===100)return 'YouTube hatası 100: video kaldırılmış, özel veya erişilemiyor. Başka bir bağlantı dene.';
 if(code===2)return 'YouTube hatası 2: video bağlantısı geçersiz. Tam video bağlantısını yapıştır.';
 return 'YouTube oynatma hatası ('+code+'). Video veya bu tarayıcıdaki oynatma kısıtlaması nedeniyle açılamıyor.'+suffix;
}
