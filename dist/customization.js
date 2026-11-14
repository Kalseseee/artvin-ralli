const limit=(v,n)=>String(v??'').trim().slice(0,n);
export function cleanName(v,fallback='Sen'){return limit(v,20).replace(/[^\p{L}\p{N} ._'’-]/gu,'').trim()||fallback;}
export function cleanPlate(v){return limit(v,14).toLocaleUpperCase('tr-TR').replace(/[^A-ZÇĞİÖŞÜ0-9 ]/g,'').replace(/ +/g,' ').trim()||'08 ARTVIN';}
export function cleanCustom(v={}){return {nickname:cleanName(v.nickname,''),plate:cleanPlate(v.plate),paint:/^#[0-9a-f]{6}$/i.test(v.paint||'')?v.paint:null};}
export function customFor(save,id){return cleanCustom(save.customizations?.[id]||{});}
export function saveCustomization(save,id,input){if(!save.owned.includes(id))throw Error('Önce bu aracı garajına eklemelisin.');return {...save,driverName:cleanName(input.driverName),customizations:{...save.customizations,[id]:cleanCustom(input)}};}
