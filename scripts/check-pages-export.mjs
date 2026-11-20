import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'web/dist/client');
const papers=JSON.parse(fs.readFileSync(path.join(root,'content-licenses.json'),'utf8'));
const prefix='/paper-reader';
const collectionRoutes=fs.readdirSync(path.join(root,'web/app/collections'),{withFileTypes:true})
  .filter(entry=>entry.isDirectory()&&fs.existsSync(path.join(root,'web/app/collections',entry.name,'page.tsx')))
  .map(entry=>`/collections/${entry.name}/`);
const discoveryDates=fs.readdirSync(path.join(root,'web/app/data/discovery'))
  .filter(name=>/^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map(name=>name.slice(0,-5));
const routes=['/','/discovery/',...discoveryDates.map(date=>`/discovery/${date}/`),...collectionRoutes,...papers.map(p=>`/papers/${p.slug}/`)];
const errors=[];
for(const route of routes){
  const file=path.join(output,route.slice(1),'index.html');
  if(!fs.existsSync(file)){errors.push('Missing exported page: '+route);continue;}
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('Paper Atlas'))errors.push('Missing reader content: '+route);
  if(html.includes('class="katex-error"'))errors.push('Math rendering error: '+route);
  for(const m of html.matchAll(/\b(?:src|href)="(\/[^"<>]*)"/g)){
    const url=m[1].replace(/&amp;/g,'&');
    if(url.startsWith('//'))continue;
    if(url!==prefix&&!url.startsWith(prefix+'/')){errors.push(`Root URL escapes project: ${route} -> ${url}`);continue;}
    const relative=url.slice(prefix.length).split(/[?#]/)[0];
    const decoded=decodeURIComponent(relative).replace(/^\//,'');
    const target=path.join(output,decoded);
    if(!target.startsWith(output+path.sep)&&target!==output){errors.push('Unsafe output path');continue;}
    if(!fs.existsSync(target)&&!fs.existsSync(path.join(target,'index.html')))errors.push(`Missing linked target: ${route} -> ${url}`);
  }
}
for(const item of JSON.parse(fs.readFileSync(path.join(root,'public-asset-manifest.json'),'utf8'))){
  if(!fs.existsSync(path.join(output,item.path.replace(/^web\/public\//,''))))errors.push('Missing published asset: '+item.path);
}
fs.writeFileSync(path.join(output,'.nojekyll'),'');
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1);}
console.log(`PASS: ${routes.length} exported pages; project-prefixed links; all licensed assets; no KaTeX errors.`);
