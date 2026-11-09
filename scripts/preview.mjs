import vm from "node:vm";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
const registry=new Map();
vm.runInNewContext(readFileSync(new URL("../dist/wardrobe-weather-card.js",import.meta.url),"utf8"),{
HTMLElement:class{},customElements:{get:k=>registry.get(k),define:(k,c)=>registry.set(k,c)},
window:{},Intl,Date});
const C=registry.get("wardrobe-weather-card");
const outfits=[
["Light layers","Cardigan + tee","cardigan","tee","trousers","shoes"],
["A dress day","Jacket + knit dress","jacket","knitdress","tights","ankleboots"],
["Cozy & casual","Sweater + leggings","knit","tee","leggings","shoes"]];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="620" viewBox="0 0 1080 620"><rect width="1080" height="620" rx="24" fill="#282431"/><g font-family="Arial,sans-serif"><text x="40" y="57" fill="#f5eaf1" font-size="30" font-weight="bold">Wardrobe Weather Card</text><text x="40" y="91" fill="#d8c5d6" font-size="17">Weather-aware outfits, layers and a five-day clothing plan</text>';
outfits.forEach((o,i)=>{const x=40+i*340;svg+='<g transform="translate('+x+' 125)"><rect width="320" height="450" rx="22" fill="#352f3e" stroke="#706071"/><text x="20" y="38" fill="#f5eaf1" font-size="21">'+o[0]+'</text><text x="20" y="65" fill="#e1bfd0" font-size="15">'+o[1]+'</text><rect x="20" y="85" width="280" height="320" rx="22" fill="#eee8e2"/>';
o.slice(2).forEach((k,j)=>svg+='<g transform="translate('+(34+(j%2)*137)+' '+(98+Math.floor(j/2)*147)+') scale(1.15)">'+C.garment(k)+'</g>');
svg+='</g>';});
svg+='<text x="40" y="604" fill="#c0afc5" font-size="13">Illustrated preview with example outfits; no household data</text></g></svg>';
mkdirSync(new URL("../docs/",import.meta.url),{recursive:true});
writeFileSync(new URL("../docs/preview.svg",import.meta.url),svg);

