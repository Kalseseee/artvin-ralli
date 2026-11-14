export function parseMusicLink(value){
 const url=new URL(value.trim());
 if(!['https:','http:'].includes(url.protocol))throw new Error('HTTP veya HTTPS bağlantısı kullan.');
 const host=url.hostname.toLowerCase().replace(/^www\./,'');
 let id;
 if(host==='youtu.be')id=url.pathname.split('/')[1];
 else if(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com'].includes(host))id=url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
 else return {kind:'audio',url:url.href};
 if(!/^[\w-]{11}$/.test(id||''))throw new Error('Geçerli bir YouTube video bağlantısı yapıştır.');
 return {kind:'youtube',id,url:'https://www.youtube.com/watch?v='+id};
}
