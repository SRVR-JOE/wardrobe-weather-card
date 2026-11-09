import {readFile,mkdir,writeFile} from "node:fs/promises";
const root=new URL("../",import.meta.url);
const pkg=JSON.parse(await readFile(new URL("package.json",root),"utf8"));
const sources=await Promise.all(["src/wardrobe-outfit-plan.js","src/wardrobe-weather-card.js"].map(p=>readFile(new URL(p,root),"utf8")));
const bundle="// Wardrobe Weather Card v"+pkg.version+"\n// Community dashboard card; not an official Home Assistant product.\n"+sources.join("\n");
new Function(bundle);
await mkdir(new URL("dist/",root),{recursive:true});
await writeFile(new URL("dist/wardrobe-weather-card.js",root),bundle);
console.log("Built dist/wardrobe-weather-card.js ("+Buffer.byteLength(bundle)+" bytes)");

