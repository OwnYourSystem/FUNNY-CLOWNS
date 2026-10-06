/* The engine is the part of the board that decides: the size of the day, the picks, the reasons, the numbers.
   It must run with no page. This test reads the source parts and fails if an engine part reaches for the page,
   for browser storage, or for a timer. It also fails if index.html is not what the parts build.            */
const fs=require("fs"), path=require("path"), cp=require("child_process");
const ROOT="/home/user/FUNNY-CLOWNS/source", PARTS=path.join(ROOT,"parts");
const {parse,kindOf,walk}=require(__dirname+"/engine-classify.cjs");
const files=fs.readdirSync(PARTS).sort();
const ENGINE_LAST=+process.env.ENGINE_LAST||200;      /* parts numbered up to this are the engine region */
let full="", offs=[]; for(const f of files){ offs.push([f,full.length]); full+=fs.readFileSync(path.join(PARTS,f),"utf8"); }
const owner=pos=>{ let o=offs[0][0]; for(const x of offs) if(x[1]<=pos) o=x[0]; return o; };
const {ast}=parse(full);
const body=ast.body[ast.body.length-1].expression.callee.body.body;
let pass=0, fail=0; const bad=[];
function check(name,cond,detail){ if(cond) pass++; else { fail++; bad.push(name+(detail?": "+detail:"")); } }
const isEngineFile=f=>!/\.(screen|store)\.js$/.test(f) && +f.slice(0,3)<=ENGINE_LAST;
let engineFns=0, engineStmts=0;
for(const s of body){
  const f=owner(s.start);
  const k=kindOf(s);
  if(s.type==="FunctionDeclaration"){
    if(isEngineFile(f)){ engineFns++; check("engine function "+s.id.name+" in "+f+" is clean",k==="engine",k); }
    if(/\.store\.js$/.test(f)) check("store function "+s.id.name+" touches storage only",k==="store",k);
    if(/\.screen\.js$/.test(f)) check("screen function "+s.id.name+" is a screen function",k==="screen"||k==="store",k);
  } else if(isEngineFile(f)){ engineStmts++; check("engine statement at "+f+":"+full.slice(s.start,s.start+50).replace(/\n/g," ")+" is clean",k==="engine",k); }
}
check("there are engine functions to check",engineFns>50,String(engineFns));
const built=cp.execSync("cd "+ROOT+" && LC_ALL=C sh -c 'cat head.html parts/*.js tail.html'",{maxBuffer:1<<28}).toString();
check("source/delivery-board.html is what the parts build",fs.readFileSync(path.join(ROOT,"delivery-board.html"),"utf8")===built);
check("index.html is what the parts build",fs.readFileSync(path.join(ROOT,"..","index.html"),"utf8")===built);
console.log("engine functions checked:",engineFns,"top-level statements checked:",engineStmts);
bad.forEach(b=>console.log("FAIL",b)); console.log(`${pass} pass, ${fail} fail`);
process.exit(fail?1:0);
