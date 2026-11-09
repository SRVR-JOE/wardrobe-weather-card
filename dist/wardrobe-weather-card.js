// Wardrobe Weather Card v0.1.0
// Community dashboard card; not an official Home Assistant product.

class WardrobeOutfitPlan extends HTMLElement{
constructor(){super();this.attachShadow({mode:"open"});this.epoch=0;this.rows=null;this.failure=false;}
set hass(h){this.h=h;this.start();this.render();}
set preferences(p){this.p=p;this.render();}
connectedCallback(){this.start();this.timer=setInterval(()=>this.render(),60000);}
disconnectedCallback(){clearInterval(this.timer);this.epoch++;if(this.unsub)this.unsub();this.unsub=null;this.pending=false;}
async start(){
if(!this.isConnected||!this.h||!this.p?.entity||this.unsub||this.pending)return;
this.pending=true;let epoch=this.epoch;
try{let unsub=await this.h.connection.subscribeMessage(e=>{if(epoch!==this.epoch)return;this.rows=e.forecast||[];this.failure=false;this.render();},{type:"weather/subscribe_forecast",forecast_type:"daily",entity_id:this.p.entity});if(epoch!==this.epoch){unsub();return;}this.unsub=unsub;}
catch(e){if(epoch===this.epoch){this.failure=true;this.render();}}
finally{if(epoch===this.epoch)this.pending=false;}
}
esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
static days(rows,zone,now=new Date()){
const key=d=>new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(d));
let seen=new Set(),today=key(now);
return [...(rows||[])].filter(r=>Number.isFinite(r.temperature)&&!isNaN(Date.parse(r.datetime))).sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime)).filter(r=>{let k=key(r.datetime);if(k<today||seen.has(k))return false;seen.add(k);return true;}).slice(0,5);
}
render(){
if(!this.h)return;
const C=customElements.get("wardrobe-weather-card");
if(!C){customElements.whenDefined("wardrobe-weather-card").then(()=>this.render());return;}
let a=this.h.states[this.p?.entity]?.attributes||{},unit=a.temperature_unit,zone=this.h.config?.time_zone;
let rows=WardrobeOutfitPlan.days(this.rows,zone);
const css=":host{display:block;color:#eee6ed;font-family:var(--primary-font-family,Arial,sans-serif)}*{box-sizing:border-box}.plan{padding:18px 22px;border-top:1px solid #514958;margin-top:12px}h3{font-size:19px;margin:0 0 6px;font-weight:600}.intro,.note{font-size:12px;line-height:1.5;color:#c9bdcc;margin:4px 0 12px}.rail{display:grid;grid-auto-flow:column;grid-auto-columns:190px;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:12px;scrollbar-color:#a68c9e #282431;scrollbar-width:thin}.day{scroll-snap-align:start;padding:13px;border:1px solid #665869;border-radius:18px;background:#312b38;min-width:0}.date{font-size:15px;font-weight:600}.range{font-size:12px;color:#e2c5b8;margin:6px 0 10px}.art svg{width:100%;height:auto;display:block}.title{font-size:15px;line-height:1.3;font-weight:600;margin:12px 0 6px}.layers{font-size:13px;color:#e9c7d6}.outfit{font-size:12px;color:#d4c9d7;line-height:1.5;margin:8px 0}.cool{border-top:1px solid #5c4e60;padding-top:8px;font-size:12px;line-height:1.5;color:#e4d4bf}.condition{font-size:12px;margin-top:8px;color:#c9bdcc}.extras{font-size:12px;line-height:1.4;margin-top:8px;color:#e4d4bf}.extras svg{display:none}.rail:focus-visible{outline:2px solid #e4cec5;outline-offset:4px}@media(max-width:400px){.plan{padding:16px}.rail{grid-auto-columns:175px}}";
let body="";
if(!["\u00b0F","\u00b0C"].includes(unit))body="<p class='note'>Forecast temperature units unavailable.</p>";
else if(this.failure)body="<p class='note'>Forecast unavailable. The five-day plan cannot be generated right now.</p>";
else if(!rows.length)body="<p class='note'>"+(this.rows?"No upcoming daily forecast available.":"Loading the daily forecast...")+"</p>";
else body='<div class="rail" tabindex="0" aria-label="Five-day clothing plan; scroll horizontally for more days">'+rows.map(r=>{
const card=new C();card.outfitStyle=this.p?.style||"trousers";card.comfort=this.p?.comfort||"normal";card.topChoice="auto";
card.setConfig({entity:this.p.entity,preview:true});
const attrs={temperature:r.temperature,temperature_unit:unit,wind_speed:r.wind_speed,wind_speed_unit:a.wind_speed_unit};
let condition=r.condition||"unknown";
if(Number.isFinite(r.precipitation_probability)&&r.precipitation_probability>=50&&!["snowy","snowy-rainy","hail","lightning-rainy"].includes(condition))condition="rainy";
card.hass={states:{[this.p.entity]:{state:condition==="unknown"?"cloudy":condition,attributes:attrs,last_updated:new Date().toISOString()}}};
const root=card.shadowRoot,art=root.querySelector(".figure")?.innerHTML||"",title=root.querySelector("h3")?.textContent||"Outfit unavailable",layers=root.querySelector(".layers strong")?.textContent||"",items=[...root.querySelectorAll(".outfit .item")].map(x=>x.textContent.trim()).join(", "),extra=root.querySelector(".extras")?.textContent?.trim()||"";
let low=Number.isFinite(r.templow)?r.templow:null;
let f=low===null?null:unit==="\u00b0C"?low*9/5+32:low;
let cool=f===null?"Overnight low unavailable.":C.advice(f+(card.comfort==="cold"?-7:card.comfort==="warm"?7:0))[0]+": "+C.advice(f+(card.comfort==="cold"?-7:card.comfort==="warm"?7:0))[1].toLowerCase()+".";
let date=new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",timeZone:zone}).format(new Date(r.datetime));
return '<article class="day"><div class="date">'+this.esc(date)+'</div><div class="range">High '+Math.round(r.temperature)+this.esc(unit)+' / Low '+(low===null?'unavailable':Math.round(low)+this.esc(unit))+'</div><div class="art">'+art+'</div><div class="title">'+this.esc(title)+'</div><div class="layers">'+this.esc(layers)+'</div><p class="outfit">'+this.esc(items)+'</p><div class="cool">Cooler hours: '+this.esc(cool)+'</div><div class="condition">'+this.esc((r.condition||"Conditions unavailable").replace(/-/g," "))+(Number.isFinite(r.precipitation_probability)?' / '+Math.round(r.precipitation_probability)+'% precipitation':'')+'</div><div class="extras">'+this.esc(extra)+'</div></article>';
}).join("")+'</div>';
this.shadowRoot.innerHTML='<style>'+css+'</style><section class="plan"><h3>Your next five days</h3><p class="intro">Outfits for the daytime high, with cooler-hour guidance. Uses your style and comfort choice; layers follow the forecast. Swipe for more days.</p>'+body+'<p class="note">Daily weather forecast. '+(rows.length&&rows.length<5?'Only '+rows.length+' days available. ':'')+'Forecasts can change; review before heading out.</p></section>';
}
}
if(!customElements.get("wardrobe-outfit-plan"))customElements.define("wardrobe-outfit-plan",WardrobeOutfitPlan);



class WardrobeWeatherCard extends HTMLElement {
constructor(){super();this.attachShadow({mode:"open"});this.comfort="normal";this.outfitStyle="trousers";this.topChoice="auto";this.designerOpen=false;try{let st=localStorage.getItem("wardrobe-weather-style");if(["trousers","leggings","skirt","dress"].includes(st))this.outfitStyle=st;}catch(e){}try{let v=localStorage.getItem("wardrobe-weather-comfort");if(["cold","normal","warm"].includes(v))this.comfort=v;}catch(e){}}
setConfig(c){
if(!c||typeof c.entity!=="string"||!c.entity.startsWith("weather."))throw new Error("Select a weather entity.");
this.config={show_forecast:true,show_designer:false,...c};
this.render();
}
static getStubConfig(hass){return {entity:Object.keys(hass.states).find(id=>id.startsWith("weather."))||"weather.home"};} set hass(h){this.h=h;this.render();}
getCardSize(){return 7;} getGridOptions(){return {columns:12,rows:"auto",min_columns:6};}
static advice(f){return f<32?["Bundle up","Warm coat","Thermal + knit top","Warm trousers","Boots","Hat and gloves",3,"coat","layeredtop","trousers","boots"]:f<45?["Coat weather","Belted coat","Knit sweater","Trousers","Closed shoes","A warm scarf",3,"coat","longtop","trousers","shoes"]:f<60?["Bring a jacket","Light jacket","Long-sleeve top","Trousers","Blush sneakers","Wear the jacket over your top",2,"jacket","longtop","trousers","shoes"]:f<70?["Light layers","Rose cardigan","Ivory tee","Trousers","Blush sneakers","Remove the cardigan if you get warm",1,"cardigan","tee","trousers","shoes"]:f<80?["Keep it light","Floral blouse","Sunglasses","Light trousers","Blush sneakers","Light, breathable fabrics",0,"blouse","glasses","trousers","shoes"]:["Dress for the heat","Floral blouse","Sun hat","Light trousers","Blush sneakers","Light, breathable fabrics",0,"blouse","hat","trousers","shoes"];}
static garment(k){
if(k==="layeredtop")return '<g transform="translate(-4 -2) scale(.86)">'+WardrobeWeatherCard.garment("longtop")+'</g><g transform="translate(20 16) scale(.78)">'+WardrobeWeatherCard.garment("knit")+'</g>';
const p=(d,fill="#b39baf")=>'<path d="'+d+'" fill="'+fill+'" stroke="#5a485c" stroke-width="1.4" stroke-linejoin="round"/>';
const line=d=>'<path d="'+d+'" fill="none" stroke="#776477" stroke-width="1.2"/>';

if(["dress","knitdress"].includes(k)){
let winter=k==="knitdress";
return p(winter?'M36 9 L23 17 L12 48 L23 53 L35 28 L38 42 L23 91 Q50 100 77 91 L62 42 L65 28 L77 53 L88 48 L77 17 L64 9 Q50 20 36 9 Z':'M36 9 L23 18 L16 34 L29 42 L37 30 L39 42 L20 91 Q50 101 80 91 L61 42 L63 30 L71 42 L84 34 L77 18 L64 9 L50 24 Z',winter?"#b39baf":"#e2c7c1")+line('M39 42 Q50 47 61 42 M50 24 L40 42 L56 45 M51 46 L46 62 M52 46 L61 58 M32 69 L28 88 M41 55 L38 92 M59 55 L64 91')+(winter?line('M38 15 Q50 25 62 15 M40 20 V35 M46 25 V38 M57 22 V38'): [[36,68],[61,74],[47,84],[57,57]].map(([x,y])=>'<g transform="translate('+x+' '+y+')"><path d="M0 -3 Q4 -5 2 0 Q6 3 1 3 Q-3 6 -3 1 Q-6 0 -2 -2 Z" fill="#a67891"/><circle r="1" fill="#fff3cf"/></g>').join(''));
}
if(k==="skirt"||k==="skirttights")return (k==="skirttights"?p('M35 42 H65 L67 96 H55 L50 65 L45 96 H33 Z',"#817987"):'')+p('M30 12 H70 L84 78 Q50 89 16 78 Z',"#b39baf")+line('M30 20 H70 M34 22 L26 77 M43 22 L39 81 M53 22 L53 82 M63 22 L70 79');
if(k==="leggings")return p('M30 8 H70 L65 92 H54 L50 37 L46 92 H35 Z',"#574f65")+line('M30 20 H70 M37 23 L40 87 M63 23 L60 87');
if(k==="tights")return p('M32 8 H68 L65 76 L72 90 Q70 97 58 94 L53 79 L50 37 L47 79 L42 94 Q30 97 28 90 L35 76 Z',"#817987")+line('M28 16 H72');
if(k==="bag")return p('M24 39 Q50 31 76 39 L83 82 Q50 92 17 82 Z',"#b6a59c")+line('M34 39 V25 Q50 4 66 25 V39 M22 53 Q50 66 78 53')+'<circle cx="50" cy="57" r="3" fill="#d5b583" stroke="#806b59"/>';
if(k==="ankleboots")return p('M17 43 H36 L36 62 L47 74 Q48 82 40 83 H9 Q5 75 17 67 Z',"#8c776e")+p('M61 43 H80 L80 62 L91 74 Q92 82 84 83 H53 Q49 75 61 67 Z',"#8c776e")+line('M10 78 H44 M54 78 H88 M29 48 V67 M73 48 V67');
if(k==="flats")return p('M17 16 Q29 9 36 23 L42 68 Q39 86 24 84 Q10 82 12 66 Z',"#e2c7c1")+p('M61 16 Q73 9 80 23 L86 68 Q83 86 68 84 Q54 82 56 66 Z',"#e2c7c1")+p('M21 28 Q28 23 32 31 L36 58 Q26 65 17 57 Z',"#f4e8dc")+p('M65 28 Q72 23 76 31 L80 58 Q70 65 61 57 Z',"#f4e8dc")+line('M18 66 L31 74 M31 66 L18 74 M62 66 L75 74 M75 66 L62 74');

if(["coat","jacket","cardigan","raincoat","windbreaker"].includes(k)){
let long=k==="coat",bottom=long?94:76;
return p('M30 17 L18 24 L7 61 L18 66 L29 38 L'+(long?'24':'29')+' '+bottom+' L70 '+bottom+' L71 38 L82 66 L93 61 L82 24 L70 17 L60 13 L40 13 Z',k==="raincoat"?"#b4c3c1":k==="cardigan"?"#cda1b2":"#b6a59c")+p('M42 14 L50 24 L58 14 L61 '+bottom+' L39 '+bottom+' Z',"#f3e9df")+line('M40 14 L34 30 L45 37 L50 24 L55 37 L66 30 L60 14')+(k==="cardigan"?line('M39 38 L39 76 M61 38 L61 76'):line('M50 38 V'+bottom+' M30 55 H42 M58 55 H70'))+(long?line('M27 60 H73 M46 57 L54 64 M54 57 L46 64'):'')+(k==='cardigan'?'<g fill="#f1dfc9" stroke="#9b7686" stroke-width=".6"><circle cx="62" cy="43" r="2"/><circle cx="62" cy="55" r="2"/><circle cx="62" cy="67" r="2"/></g>':'')+(k==="raincoat"?line('M34 18 Q30 0 50 2 Q70 0 66 18'):'');
}
if(["longtop","tee","blouse","knit"].includes(k)){let lng=k==="longtop"||k==="knit";return p(lng?'M33 17 L17 24 L5 64 L18 68 L30 39 L29 79 L71 79 L70 39 L82 68 L95 64 L83 24 L67 17 L61 14 Q50 25 39 14 Z':'M33 17 L16 27 L7 46 L23 54 L31 40 L28 79 L72 79 L69 40 L77 54 L93 46 L84 27 L67 17 L61 14 Q50 25 39 14 Z',k==="blouse"?"#ead1d4":k==="knit"?"#c8a6b5":"#f4e8dc")+line(k==="blouse"?'M41 16 L50 33 L59 16 M50 34 V70':'M39 17 Q50 30 61 17')+line('M30 73 H70')+(k==='knit'?line('M35 38 V68 M42 35 V68 M50 35 V68 M58 35 V68 M65 38 V68'):k==='blouse'?[[39,43],[61,48],[44,61],[62,65]].map(([x,y])=>'<g transform="translate('+x+' '+y+')"><path d="M0 -4 Q5 -6 3 0 Q7 4 1 3 Q-3 8 -3 2 Q-8 0 -3 -2 Z" fill="#b48d9f"/><circle r="1.5" fill="#f8efce"/></g>').join(''):'');}
if(k==="trousers")return p('M27 8 H73 L82 91 H56 L50 36 L44 91 H18 Z',"#817987")+line('M27 17 H73 M50 9 V32 M35 20 L32 85 M65 20 L68 85');
if(k==="boots")return p('M18 20 H37 L36 62 L46 73 Q48 82 40 83 H9 Q5 75 18 68 Z',"#8c776e")+p('M62 20 H81 L80 62 L90 73 Q92 82 84 83 H53 Q49 75 62 68 Z',"#8c776e")+line('M10 78 H43 M54 78 H87 M20 27 H35 M64 27 H79');
if(k==="shoes")return p('M10 40 Q22 28 36 40 L40 55 L48 62 Q53 72 40 74 H9 Q3 67 10 40 Z',"#e2bec8")+p('M54 40 Q66 28 80 40 L84 55 L92 62 Q97 72 84 74 H53 Q47 67 54 40 Z',"#e2bec8")+line('M9 67 H46 M53 67 H90 M22 44 L34 47 M22 50 L36 53 M66 44 L78 47 M66 50 L80 53');
if(k==="glasses")return p('M10 37 Q25 30 41 37 L39 56 Q25 66 13 55 Z',"#706374")+p('M59 37 Q75 30 90 37 L87 55 Q75 66 61 56 Z',"#706374")+line('M41 41 Q50 36 59 41 M5 35 L12 43 M88 43 L95 35');
if(k==="hat")return p('M25 51 Q27 17 50 17 Q73 17 75 51 Z',"#d4be98")+p('M8 51 Q50 39 92 51 Q100 68 50 72 Q0 68 8 51 Z',"#d4be98")+line('M28 43 Q50 49 72 43');
return "";
}

esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
num(v){return v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));}
render(){
if(!this.config||!this.h)return;
let s=this.h.states[this.config.entity],a=s?.attributes??{},valid=s&&!["unknown","unavailable"].includes(s.state)&&this.num(a.temperature)&&["\u00b0F","\u00b0C"].includes(a.temperature_unit);
let css=":host{display:block;color:#eef6ff;font-family:var(--primary-font-family,Arial,sans-serif)}*{box-sizing:border-box}ha-card{display:block;overflow:hidden;border-radius:24px;border:1px solid #536b89;background:#111d30;color:#eef6ff;box-shadow:0 12px 30px #0003}header{padding:20px 22px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #34465f;gap:12px}h2{font-size:21px;line-height:1.2;margin:0;font-weight:650}.now{font-size:12px;color:#b4dded}.dot{display:inline-block;width:6px;height:6px;background:#7de3ed;border-radius:50%;margin-right:6px}.hero{display:grid;grid-template-columns:130px 1fr;gap:18px;padding:20px 22px 16px;align-items:center;background:radial-gradient(ellipse at 14% 50%,#24466a99,transparent 65%)}.figure{display:flex;align-items:center;justify-content:center;min-height:186px;background:repeating-linear-gradient(0deg,transparent 0 23px,#75cced12 24px),repeating-linear-gradient(90deg,transparent 0 23px,#75cced12 24px);border-radius:50%}svg{width:118px;height:186px;overflow:visible;filter:drop-shadow(0 0 9px #6dc8fa50)}h3{font-size:27px;line-height:1.12;margin:0 0 10px;font-weight:600;letter-spacing:-.6px}.temp{font-size:16px;color:#a9ddea;margin-bottom:10px}.reason{color:#c5d1e2;font-size:14px;line-height:1.5;margin:0}.outfit{margin:0 22px 16px;display:grid;grid-template-columns:1fr 1fr;gap:0 20px}.item{padding:9px 0;border-bottom:1px solid #34465f;display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.3}ha-icon{--mdc-icon-size:20px;color:#8bd8f3;flex:none}.extras{margin:0 22px 16px;padding:11px 13px;border-left:2px solid #e7bc85;background:#e7bc8509;color:#e7d8bf;font-size:14px;line-height:1.5}.metrics{display:flex;gap:16px;padding:0 22px 16px;color:#becddd;font-size:13px;flex-wrap:wrap}.metrics span{display:flex;gap:6px;align-items:center}.prefs{padding:15px 22px 20px;background:#0c1626;border-top:1px solid #34465f}.label{font-size:13px;color:#bbcadd;margin:0 0 9px}.buttons{display:flex;gap:6px}button{min-height:44px;padding:9px 8px;border:1px solid #52627a;border-radius:11px;background:transparent;color:#d1ddeb;font:inherit;font-size:13px;flex:1;cursor:pointer}button[aria-pressed=true]{background:#b0e9f5;color:#102133;border-color:#b0e9f5;font-weight:650}button:focus-visible,a:focus-visible{outline:3px solid #f5c579;outline-offset:3px}footer{padding:12px 22px 16px;color:#9faec3;font-size:12px;line-height:1.5;display:flex;justify-content:space-between;gap:12px}a{color:#a9ddea;white-space:nowrap;text-decoration:underline;text-underline-offset:3px}.empty{padding:25px;font-size:16px;line-height:1.5}@media(max-width:360px){.hero{grid-template-columns:90px 1fr;gap:12px;padding:16px}.figure svg{width:88px}h3{font-size:23px}.outfit,.extras{margin-left:16px;margin-right:16px}.prefs{padding:14px 16px}.buttons{gap:4px}button{font-size:12px}header{padding:18px 16px}.metrics{padding-left:16px}}";
css+=".hero{grid-template-columns:minmax(150px,46%) 1fr;gap:18px;background:none;align-items:center}.figure{background:none;border-radius:0;min-height:0}.figure svg{width:100%;height:auto;filter:drop-shadow(0 6px 12px #0002)}ha-card{background:#282431;border-color:#625865;box-shadow:0 10px 24px #0002}header,.prefs{border-color:#514958}.prefs{background:#211e29}.temp,.now,a,ha-icon{color:#e2c5b8}.dot{background:#e2c5b8}.reason,.metrics,.label{color:#d3cad5}h3{font-size:25px}button[aria-pressed=true]{background:#e4cec5;border-color:#e4cec5;color:#302633}.item{border-color:#514958}.extras{border-color:#dbc2a4;background:#dbc2a408}footer{color:#c0b4c3}@media(max-width:400px){.hero{grid-template-columns:minmax(130px,45%) 1fr;gap:12px;padding:16px}h3{font-size:22px}.figure svg{width:100%}.reason{font-size:13px}.temp{font-size:14px}}";
if(!valid){this.shadowRoot.innerHTML='<style>'+css+'</style><ha-card><header><h2>'+this.esc(this.config.title||'What to wear')+'</h2></header><div class="empty">Weather data is unavailable. Check the forecast before heading out.</div></ha-card>';return;}
let unit=a.temperature_unit,ap=this.num(a.apparent_temperature),t=Number(ap?a.apparent_temperature:a.temperature),f=unit==="\u00b0C"?t*9/5+32:t;
let d=WardrobeWeatherCard.advice(f+(this.comfort==="cold"?-7:this.comfort==="warm"?7:0)),cond=s.state,wind=this.num(a.wind_speed)?Number(a.wind_speed):null;
let mph=wind!==null?wind*({"mph":1,"km/h":.621371,"m/s":2.23694,"kn":1.15078}[a.wind_speed_unit]??NaN):NaN;
let effective=f+(this.comfort==="cold"?-7:this.comfort==="warm"?7:0);
let styleNote="";
if(["skirt","dress"].includes(this.outfitStyle)&&effective<32){styleNote="Very cold: warm trousers are suggested for this outfit.";}
else if(this.outfitStyle==="skirt"){
d=[...d];d[3]=effective<60?"Midi skirt + tights":"Pleated midi skirt";d[9]=effective<60?"skirttights":"skirt";
d[4]=effective<60?"Ankle boots":"Bow flats";d[10]=effective<60?"ankleboots":"flats";
}
else if(this.outfitStyle==="dress"){
d=[...d];
if(effective<70){d[2]=effective<60?"Knit midi dress":"Floral wrap dress";d[8]=effective<60?"knitdress":"dress";}
else{d[1]="Floral wrap dress";d[7]="dress";}
d[3]=effective<60?"Opaque tights":"Crossbody bag";d[9]=effective<60?"tights":"bag";
d[4]=effective<60?"Ankle boots":"Bow flats";d[10]=effective<60?"boots":"flats";
d[5]=effective<60?"A warm scarf":effective<70?"Remove the cardigan if you get warm":"Light, breathable fabrics";
}

if(this.outfitStyle==="leggings"){
d=[...d];d[3]=effective<45?"Warm-lined leggings":"High-rise leggings";d[9]="leggings";
if(effective>=32&&effective<60){d[2]="Cozy knit sweater";d[8]="knit";}
}
if(this.outfitStyle!=="dress"&&this.topChoice!=="auto"){
d=[...d];
if(effective<32){styleNote="Very cold: keep the thermal base and outerwear.";}
else if(this.topChoice==="sweater"){d[1]="Cozy knit sweater";d[7]="knit";d[2]="Soft base tee";d[8]="tee";d[5]="Sweater over a soft base tee";}
else{d[1]="Light jacket";d[7]="jacket";d[2]="Cozy knit sweater";d[8]="knit";d[5]="Jacket over your sweater";}
}
let extras=[],wet=["rainy","pouring","lightning-rainy"].includes(cond),snow=["snowy","snowy-rainy","hail"].includes(cond);
if(wet||snow){d=[...d];d[1]=snow?"Weatherproof coat":"Rain jacket";d[7]="raincoat";d[4]="Weatherproof boots";d[10]="boots";extras.push(snow?"Choose boots with good grip.":"Weatherproof layers for the rain.");}
else if(mph>=15){d=[...d];d[1]="Wind-resistant jacket";d[7]="windbreaker";if(d[8]==="hat"||d[8]==="glasses"){d[2]=this.outfitStyle==="dress"?"Floral wrap dress":"Floral blouse";d[8]=this.outfitStyle==="dress"?"dress":"blouse";}extras.push("An outer layer to keep the wind out.");}
if(wet||snow){if(["hat","glasses"].includes(d[8])){d[2]="Floral blouse";d[8]="blouse";}}
if(!extras.length)extras.push(d[5]+".");if(styleNote)extras.push(styleNote);
let accessory=f+(this.comfort==="cold"?-7:this.comfort==="warm"?7:0)<32?"winter":f+(this.comfort==="cold"?-7:this.comfort==="warm"?7:0)<45?"scarf":"";
if(accessory&&!extras.join(" ").includes(d[5]))extras.push(d[5]+".");
let layers=(["coat","jacket","cardigan","raincoat","windbreaker"].includes(d[7])?1:0)+(d[8]==="layeredtop"?2:["longtop","knit","tee","blouse","dress","knitdress"].includes(d[8])?1:0)+(["tee","blouse","longtop","knit","dress","knitdress"].includes(d[7])?1:0);
let layerText=d[8]==="layeredtop"?"Thermal base + knit top + outerwear":layers===2?d[2]+" + "+d[1]:d[1]+" on its own";
css+=".layers{margin-top:14px;padding-top:12px;border-top:1px solid #6a586b}.layers strong{display:block;font-size:16px;color:#f1d4df}.layers small{display:block;font-size:12px;line-height:1.5;color:#cfc2d2;margin-top:4px}.layers .layerdots{display:flex;gap:4px;margin-bottom:7px}.layerdots i{width:23px;height:5px;background:#dfb7c9;border-radius:4px}";
css+=".stylepick{padding:16px 22px 0}.hero{grid-template-columns:minmax(160px,51%) 1fr;gap:14px}.figure svg{filter:drop-shadow(0 8px 10px #0002)}@media(max-width:400px){.hero{grid-template-columns:minmax(140px,48%) 1fr;gap:10px}.stylepick{padding:14px 16px 0}h3{font-size:21px}}";
if(!accessory&&d[5]==="A warm scarf")accessory="scarf";
const products=[{"title":"Fair Isle Wool Sweater","url":"https://www.toryburch.com/en-us/clothing/sweaters/fair-isle-wool-sweater/183785.html?color=243","img":"https://s7.toryburch.com/is/image/ToryBurch/style/fair-isle-wool-sweater-front.TB_183785_243_SLFRO.pdp-767x872.jpg"},{"title":"Colorblock Fleece Jacket","url":"https://www.toryburch.com/en-us/clothing/coats/colorblock-fleece-jacket/181511.html?color=920","img":"https://s7.toryburch.com/is/image/ToryBurch/style/colorblock-fleece-jacket-front.TB_181511_920_SLFRO.pdp-767x872.jpg"},{"title":"Compression Logo Trim Legging","url":"https://www.toryburch.com/en-us/clothing/bottoms/compression-logo-trim-legging/184195.html?color=405"}];
css+=".topchoice{padding:12px 22px 0}.stylepick .buttons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.stylepick button{padding:8px 4px;font-size:12px}.designer{margin:0 22px 16px;border-top:1px solid #514958;padding-top:14px}.designer summary{cursor:pointer;min-height:40px;color:#e2c5b8;font-size:14px}.designer p{font-size:12px;color:#cfc2d2;line-height:1.5}.products{display:grid;grid-template-columns:1fr 1fr;gap:12px}.product{display:block;white-space:normal;font-size:12px;line-height:1.4}.product img{width:100%;aspect-ratio:1;object-fit:contain;background:#f5f3f0;border-radius:12px;margin-bottom:7px}.product:last-child{grid-column:1/-1}.product small{display:block;color:#cfc2d2}.topchoice button{font-size:12px}";
let stale=Date.now()-Date.parse(s.last_updated)>10800000;
let svg='<svg viewBox="0 0 240 282" role="img" aria-label="'+this.esc(d.slice(1,5).join(', '))+'"><rect x="1" y="1" width="238" height="280" rx="26" fill="#eee8e2"/>'+d.slice(7,11).map((k,i)=>{let x=10+(i%2)*116,y=8+Math.floor(i/2)*136;return '<g data-garment="'+k+'" transform="translate('+x+' '+y+')">'+WardrobeWeatherCard.garment(k)+'<text x="50" y="113" text-anchor="middle" fill="#59485b" font-size="9.5" font-family="Arial,sans-serif">'+this.esc(d[i+1])+'</text></g>';}).join('')+'</svg>';
this.shadowRoot.innerHTML='<style>'+css+'</style><ha-card><header><h2>'+this.esc(this.config.title||'What to wear')+'</h2><span class="now"><span class="dot"></span>'+(stale?'Older weather reading':'Heading out now')+'</span></header><div class="stylepick"><p class="label">Choose your outfit</p><div class="buttons">'+[['trousers','Trousers'],['leggings','Leggings'],['skirt','Skirt'],['dress','Dress']].map(x=>'<button data-style="'+x[0]+'" aria-pressed="'+(this.outfitStyle===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+(this.outfitStyle==='dress'?'':'<div class="topchoice"><p class="label">Top layers</p><div class="buttons">'+[['auto','Weather pick'],['sweater','Sweater'],['jacket','Sweater + jacket']].map(x=>'<button data-top="'+x[0]+'" aria-pressed="'+(this.topChoice===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>')+'<div class="hero"><div class="figure">'+svg+'</div><div><div class="temp">'+(ap?'Feels like ':'Outside ')+Math.round(t)+this.esc(unit)+'</div><h3>'+d[0]+'</h3><p class="reason">'+(this.comfort==="cold"?"A warmer outfit for your comfort.":this.comfort==="warm"?"Lighter layers for your comfort.":"An easy outfit for the current weather.")+'</p><div class="layers"><div class="layerdots" aria-hidden="true">'+Array(layers).fill('<i></i>').join('')+'</div><strong>'+layers+' recommended '+(layers===1?'layer':'layers')+'</strong><small>'+this.esc(layerText)+'. Upper body; accessories excluded.</small></div></div></div><div class="outfit">'+[[d[1],"tshirt-crew-outline"],[d[2],"layers-outline"],[d[3],"hanger"],[d[4],"shoe-sneaker"]].map(x=>'<div class="item"><ha-icon icon="mdi:'+x[1]+'"></ha-icon>'+x[0]+'</div>').join("")+'</div><div class="extras">'+(accessory?'<svg viewBox="0 0 100 50" style="width:74px;height:38px;vertical-align:middle;margin-right:8px;filter:none" role="img" aria-label="'+(accessory==='winter'?'Hat and gloves':'Warm scarf')+'">'+(accessory==='winter'?'<path d="M8 35 Q8 8 25 8 Q42 8 42 35 Z M7 35 H43 V42 H7 Z" fill="#cdb5bc" stroke="#685268"/><path d="M60 42 V20 Q60 14 65 20 V13 Q68 8 71 14 V12 Q75 8 77 14 V17 Q82 12 83 19 V28 Q91 20 92 26 L84 42 Z" fill="#d8c7be" stroke="#685268"/>':'<path d="M18 8 Q48 0 65 12 L58 23 L45 19 L42 44 H29 L32 19 L18 21 Z M45 19 L60 23 L66 44 H53 Z" fill="#cdb5bc" stroke="#685268"/>')+'</svg>':'')+extras.join(" ")+'</div><div class="metrics"><span><ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>'+this.esc(cond.replace(/-/g," "))+'</span>'+(wind===null?'':'<span><ha-icon icon="mdi:weather-windy"></ha-icon>'+Math.round(wind)+' '+this.esc(a.wind_speed_unit)+'</span>')+'</div>'+((this.config.preview||!this.config.show_forecast)?'':'<wardrobe-outfit-plan></wardrobe-outfit-plan>')+(this.config.show_designer?'<details class="designer" '+(this.designerOpen?'open':'')+'><summary>Real designer pieces</summary><p>Tory Burch product examples. The outfit above is an illustration; these links show real pieces. Match warmth and fit to your needs.</p><div class="products">'+products.map(p=>'<a class="product" href="'+p.url+'" target="_blank" rel="noopener noreferrer">'+(p.img?'<img loading="lazy" referrerpolicy="no-referrer" src="'+p.img+'" alt="Tory Burch '+p.title+'">':'')+p.title+'<small>View at Tory Burch</small></a>').join('')+'</div></details>':'')+'<div class="prefs"><p class="label">How do you usually feel?</p><div class="buttons">'+[["cold","I run cold"],["normal","Comfortable"],["warm","I run warm"]].map(x=>'<button data-value="'+x[0]+'" aria-pressed="'+(this.comfort===x[0])+'">'+x[1]+'</button>').join("")+'</div></div><footer><span>Current conditions'+(stale?' may be out of date':'')+'. Preference saved on this device.</span><a href="#weather-details">Full forecast</a></footer></ha-card>';
this.shadowRoot.querySelectorAll("button[data-value]").forEach(b=>b.addEventListener("click",()=>{this.comfort=b.dataset.value;try{localStorage.setItem("wardrobe-weather-comfort",this.comfort);}catch(e){}this.render();}));
this.shadowRoot.querySelectorAll("button[data-style]").forEach(b=>b.addEventListener("click",()=>{this.outfitStyle=b.dataset.style;try{localStorage.setItem("wardrobe-weather-style",this.outfitStyle);}catch(e){}this.render();}));
this.shadowRoot.querySelectorAll("button[data-top]").forEach(b=>b.addEventListener("click",()=>{this.topChoice=b.dataset.top;this.render();}));
const details=this.shadowRoot.querySelector(".designer");if(details&&!this.config.show_designer)details.remove();if(details)this.config.show_designer&&details.addEventListener("toggle",()=>{this.designerOpen=details.open;});
this.shadowRoot.querySelectorAll(".product img").forEach(img=>img.addEventListener("error",()=>{img.style.display="none";}));
const plan=this.shadowRoot.querySelector("wardrobe-outfit-plan");if(plan&&!this.config.preview){customElements.whenDefined("wardrobe-outfit-plan").then(()=>{if(!plan.isConnected)return;plan.preferences={style:this.outfitStyle,comfort:this.comfort,entity:this.config.entity};plan.hass=this.h;});}
const weatherLink=this.shadowRoot.querySelector('a[href="#weather-details"]');if(weatherLink)weatherLink.addEventListener("click",e=>{e.preventDefault();this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:this.config.entity},bubbles:true,composed:true}));});
}}
if(!customElements.get("wardrobe-weather-card"))customElements.define("wardrobe-weather-card",WardrobeWeatherCard);

window.customCards=window.customCards||[];
window.customCards.push({type:"wardrobe-weather-card",name:"Wardrobe Weather Card",description:"Weather-aware outfits, layers, and a five-day clothing planner",preview:true});

