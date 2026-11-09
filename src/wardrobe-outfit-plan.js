
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

