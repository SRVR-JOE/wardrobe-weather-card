import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const bundle=readFileSync(new URL("../dist/wardrobe-weather-card.js",import.meta.url),"utf8");
function runtime(){
 const registry=new Map();
 class Element{
  attachShadow(){this.shadowRoot={innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};}
 }
 const context=vm.createContext({HTMLElement:Element,window:{},localStorage:{getItem:()=>null,setItem:()=>{}},customElements:{get:k=>registry.get(k),define:(k,c)=>registry.set(k,c),whenDefined:()=>Promise.resolve()},Intl,Date,setInterval,clearInterval,console});
 vm.runInContext(bundle,context);
 return {Card:registry.get("wardrobe-weather-card"),Plan:registry.get("wardrobe-outfit-plan"),context};
}
function render({temp=60,unit="°F",condition="sunny",style="trousers",top="auto",comfort="normal",wind=0}={}){
 const {Card}=runtime(),card=new Card();
 card.outfitStyle=style;card.topChoice=top;card.comfort=comfort;
 card.setConfig({entity:"weather.test",preview:true});
 card.hass={states:{"weather.test":{state:condition,attributes:{temperature:temp,temperature_unit:unit,wind_speed:wind,wind_speed_unit:"mph"},last_updated:new Date().toISOString()}}};
 return card.shadowRoot.innerHTML;
}
test("picker registration and configurable entity",()=>{
 const {Card,context}=runtime();
 assert.equal(context.window.customCards[0].type,"wardrobe-weather-card");
 assert.equal(Card.getStubConfig({states:{"weather.other":{}}}).entity,"weather.other");
 assert.throws(()=>new Card().setConfig({entity:"sensor.invalid"}));
 assert.match(render(),/Outside 60/);
 assert.doesNotMatch(bundle,/192\.168\.|mammas-home|weather\.forecast_home/);
});
test("layers match hot, mild, cold and wet outfits",()=>{
 for(const [temp,condition,count] of [[20,"sunny",3],[40,"sunny",2],[65,"sunny",2],[80,"sunny",1],[80,"rainy",2],[20,"snowy",3]]){
 assert.match(render({temp,condition}),new RegExp(count+" recommended layer"));
 }
});
test("Celsius matches Fahrenheit and displayed temperatures stay actual",()=>{
 assert.match(render({temp:20,unit:"°C"}),/Light layers/);
 assert.match(render({temp:63,comfort:"cold"}),/Bring a jacket/);
 assert.match(render({temp:63,comfort:"cold"}),/Outside 63/);
});
test("styles, weather overrides and preview render without recursion",()=>{
 for(const style of ["trousers","leggings","skirt","dress"])for(const temp of [20,40,60,80])for(const condition of ["sunny","rainy","snowy"]){
 const html=render({style,temp,condition});
 assert.doesNotMatch(html,/undefined|NaN|<wardrobe-outfit-plan>/);
 assert.match(html,/recommended layer/);
 if(condition==="rainy")assert.match(html,/Weatherproof boots/);
 }
 assert.match(render({style:"leggings",top:"jacket"}),/High-rise leggings/);
 assert.match(render({style:"dress",temp:55}),/Knit midi dress/);
});
test("missing current temperature never invents an outfit",()=>{
 const {Card}=runtime(),c=new Card();c.setConfig({entity:"weather.test"});c.hass={states:{}};
 assert.match(c.shadowRoot.innerHTML,/unavailable/);
 assert.doesNotMatch(c.shadowRoot.innerHTML,/recommended layer/);
});
test("forecast removes past, invalid and duplicate dates",()=>{
 const {Plan}=runtime();
 const rows=[{datetime:"2026-11-07T18:00:00Z",temperature:60},{datetime:"invalid",temperature:10},
 ...Array.from({length:6},(_,i)=>({datetime:"2026-11-"+String(i+8).padStart(2,"0")+"T18:00:00Z",temperature:60+i})),
 {datetime:"2026-11-08T21:00:00Z",temperature:99}];
 const days=Plan.days(rows,"America/Chicago",new Date("2026-11-08T23:00:00Z"));
 assert.equal(days.length,5);assert.equal(days[0].temperature,60);assert.equal(days.at(-1).temperature,64);
 assert.equal(Plan.days([],"UTC").length,0);
});
test("forecast uses configured entity and cancels pending subscription on disconnect",async()=>{
 const {Plan}=runtime();const p=new Plan();p.render=()=>{};p.isConnected=true;p.p={entity:"weather.custom"};
 let args,resolve,unsubscribed=0;
 p.h={connection:{subscribeMessage:(cb,message)=>{args=message;return new Promise(r=>resolve=r);}}};
 const start=p.start();assert.equal(args.entity_id,"weather.custom");
 p.disconnectedCallback();resolve(()=>{unsubscribed++});await start;
 assert.equal(unsubscribed,1);assert.equal(p.unsub,null);
});
test("public artifact metadata matches bundle filename",()=>{
 const h=JSON.parse(readFileSync(new URL("../hacs.json",import.meta.url),"utf8"));
 assert.equal(h.filename,"wardrobe-weather-card.js");
 assert.equal(h.render_readme,true);
});

