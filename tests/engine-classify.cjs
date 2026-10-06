const _p=require('module').createRequire('/opt/node22/lib/node_modules/eslint/package.json');
/* Shared by the split tool and the purity test. Finds the top-level functions of the board's IIFE and says what each one touches. */
const acorn=_p('acorn');
const SCREEN_IDS=new Set("document window navigator location history setTimeout setInterval clearTimeout clearInterval requestAnimationFrame fetch alert confirm prompt matchMedia Notification caches getComputedStyle XMLHttpRequest addEventListener removeEventListener Image Audio innerWidth innerHeight scrollTo".split(" "));
const STORE_IDS=new Set(["localStorage","sessionStorage"]);
const SCREEN_PROPS=new Set("innerHTML textContent dataset classList style hidden addEventListener removeEventListener querySelector querySelectorAll appendChild setAttribute getAttribute closest click focus scrollIntoView createElement getBoundingClientRect insertAdjacentHTML".split(" "));
function walk(n,fn){ if(!n||typeof n.type!=="string") return; fn(n); for(const k in n){ if(k==="type"||k==="start"||k==="end"||k==="range") continue; const v=n[k]; if(Array.isArray(v)) v.forEach(x=>walk(x,fn)); else if(v&&typeof v.type==="string") walk(v,fn); } }
function kindOf(fnNode){
  let screen=false, store=false;
  walk(fnNode,n=>{
    if(n.type==="Identifier"){ if(SCREEN_IDS.has(n.name)) screen=true; if(STORE_IDS.has(n.name)) store=true; if(n.name==="$") screen=true; }
    if(n.type==="MemberExpression"&&!n.computed&&n.property.type==="Identifier"&&SCREEN_PROPS.has(n.property.name)) screen=true;
  });
  return screen?"screen":(store?"store":"engine");
}
function parse(text){ const comments=[]; const ast=acorn.parse(text,{ecmaVersion:"latest",ranges:false,onComment:comments}); return {ast,comments}; }
function topFunctions(text){
  const {ast,comments}=parse(text);
  const iife=ast.body[ast.body.length-1];
  const body=iife.expression.callee.body.body;
  return {ast,comments,fns:body.filter(s=>s.type==="FunctionDeclaration").map(s=>({name:s.id.name,start:s.start,end:s.end,kind:kindOf(s),node:s}))};
}
module.exports={parse,topFunctions,kindOf,walk};
