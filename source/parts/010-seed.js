(function(){
"use strict";

/* ===============================================================
   SEED  —  the shipped board.
   Bump SEED_REV whenever this list changes. On load the board adds
   what is new, relocates what moved and renames what was renamed,
   and NEVER overwrites progress, status or anything you have
   edited yourself. Deleted items stay deleted.
   pct/ago are placeholder figures for items that predate the real
   data; everything added later starts at 0 and todo.
================================================================*/
var SEED_REV = 6;
var RETIRED = ["tch","enb"];   /* withdrawn; a group goes only if it ends up empty */

var SEED=[
 {id:"svc",name:"Service Desk + client requests",subs:[
   {id:"svc1",name:"Service Desk project updates",pct:70,ago:2,status:"doing"}]},
 {id:"vgd",name:"Vanguard",subs:[
   {id:"vg1",name:"Stakeholders identification",pct:100,ago:11,status:"done"},
   {id:"vg2",name:"Team Building notifications",pct:60,ago:4,status:"doing"},
   {id:"vg3",name:"Survey Set up for Esbjerg",pct:30,ago:9,status:"doing"},
   {id:"vg4",name:"Prompting Copilot Tutorial — video",pct:100,ago:17,status:"done"},
   {id:"vg5",name:"Excel in Copilot — video",pct:75,ago:3,status:"doing"},
   {id:"vg6",name:"SAP data in Copilot — video",pct:20,ago:16,status:"doing"},
   {id:"vg7",name:"Agents — video",pct:0,ago:30,status:"todo"},
   {id:"vg8",name:"Frameworks — video",pct:0,ago:30,status:"todo"},
   {id:"vg9",name:"Esbjerg Meeting plans → Travel Plan",pct:40,ago:5,status:"doing"},
   {id:"tc1",name:"Start up the IT Teams Channel for users about AI specially",pct:15,ago:21,status:"doing"}]},
 {id:"llm",name:"Local LLM Sunscape",subs:[
   {id:"ll7",name:"Present the DSP Playbook solution as use case",pct:5,ago:19,status:"doing",tag:"Planning"},
   {id:"ll1",name:"Sandbox architecture design",pct:55,ago:1,status:"doing"},
   {id:"ll2",name:"Compliance assessment → rules from Leon",pct:25,ago:12,status:"blocked"},
   {id:"ll3",name:"Security assessment",pct:10,ago:8,status:"doing"},
   {id:"ll4",name:"Cost estimation",pct:0,ago:30,status:"todo"},
   {id:"ll5",name:"Risk assessment",pct:0,ago:30,status:"todo"},
   {id:"ll6",name:"Recommendation document",pct:0,ago:30,status:"todo"},
   {id:"ll8",name:"Fine Tuning",pct:0,ago:0,status:"todo"}]},
 {id:"sap",name:"SAP",subs:[
   {id:"sp1",name:"Discovery: define scope, stakeholders, and data sources for SAP Datasphere & Analytics",pct:0,ago:0,status:"todo"},
   {id:"sp2",name:"Backlog seeding workshop: capture initial epics and acceptance criteria",pct:0,ago:0,status:"todo"},
   {id:"sp3",name:"SAP Migration Issues",pct:0,ago:0,status:"todo"},
   {id:"sp4",name:"SAP Datasphere Mastering",pct:0,ago:0,status:"todo"},
   {id:"sp5",name:"Follow the Learning portal sessions",pct:0,ago:0,status:"todo"},
   {id:"sp6",name:"SAP Analytical Cloud Mastering",pct:0,ago:0,status:"todo"},
   {id:"sp7",name:"Becoming a monster in customizing the models and metadata",pct:0,ago:0,status:"todo"},
   {id:"en1",name:"SAP Datasphere and SAP Analytics",pct:45,ago:4,status:"doing"},
   {id:"en3",name:"Power BI re-structuring after the SAP Cloud goes live",pct:10,ago:6,status:"doing"}]},
 {id:"ofm",name:"OFM",subs:[
   {id:"of1",name:"Solve the problem of Refresh in RV_STRM_GAS_DER_STRM",pct:0,ago:0,status:"todo"},
   {id:"of2",name:"Live Data extraction",pct:0,ago:0,status:"todo"}]},
 {id:"grs",name:"Partnership",subs:[
   {id:"gs1",name:"Rune",pct:50,ago:7,status:"doing"},
   {id:"gs2",name:"On SAC (Maintanance)",pct:35,ago:3,status:"doing"},
   {id:"gs3",name:"On PowerPlatform",pct:20,ago:15,status:"doing"},
   {id:"gs4",name:"On SAC (finance)",pct:15,ago:10,status:"doing"}]},
 {id:"alc",name:"Alchemy",subs:[
   {id:"al5",name:"terraform set up and bronze db reshuffle",pct:0,ago:0,status:"todo"},
   {id:"al1",name:"ADF Update on Landing Zone",pct:80,ago:2,status:"doing"},
   {id:"al3",name:"Terraform and Databricks IaC approach",pct:35,ago:9,status:"doing"},
   {id:"al4",name:"Automate the update landing to Bronze",pct:25,ago:14,status:"doing"},
   {id:"al2",name:"Bronze Database on Databricks",pct:60,ago:5,status:"doing"}]},
 {id:"aut",name:"Automation Debt",subs:[
   {id:"au1",name:"azure cybersecurity",pct:40,ago:6,status:"doing"},
   {id:"au4",name:"sap datasphere requests via DSP CLI",pct:0,ago:0,status:"todo"},
   {id:"au2",name:"Databricks",pct:30,ago:11,status:"doing"},
   {id:"au3",name:"Datasphere CLI ( as POC)",pct:20,ago:18,status:"doing"},
   {id:"au5",name:"ADF best practices",pct:0,ago:0,status:"todo"},
   {id:"svc2",name:"copilot ai agent projects",pct:45,ago:6,status:"doing"},
   {id:"au7",name:"power platform solutions",pct:0,ago:0,status:"todo"}]},
 {id:"ppm",name:"Power Platform management",subs:[
   {id:"pp1",name:"Relocate Power Apps and Power Automate Flows in Solution Box",pct:45,ago:8,status:"doing"}]},
 {id:"anb",name:"ai native bootcamp",subs:[
   {id:"an1",name:"ML concepts and practices",pct:0,ago:0,status:"todo"},
   {id:"en2",name:"AI Bootcamp tier 2: LLMs",pct:30,ago:13,status:"doing"}]},
 {id:"apd",name:"Applications development",subs:[
   {id:"ap1",name:"ETF Adviser",pct:0,ago:0,status:"todo"},
   {id:"ap2",name:"Life-Brain",pct:0,ago:0,status:"todo"},
   {id:"ap3",name:"Mind Anchor",pct:0,ago:0,status:"todo"},
   {id:"ap4",name:"Verbatim",pct:0,ago:0,status:"todo"},
   {id:"ap5",name:"Tysk-DK",pct:0,ago:0,status:"todo"},
   {id:"ap6",name:"Property Evaluation",pct:0,ago:0,status:"todo"}]},
 {id:"oys",name:"OYS_Version3",subs:[
   {id:"oy1",name:"OYS Tracker",pct:0,ago:0,status:"todo"},
   {id:"oy2",name:"UDEMY AIGP Course",pct:0,ago:0,status:"todo"},
   {id:"oy3",name:"Other courses NIST, DORA, ISO …?",pct:0,ago:0,status:"todo"},
   {id:"oy4",name:"Get the certificate",pct:0,ago:0,status:"todo"}]},
 {id:"tcs",name:"The Compromised Stack",subs:[
   {id:"tc9",name:"Obsidian + Claude set up",pct:0,ago:0,status:"todo"},
   {id:"tc8",name:"Start chapter 0",pct:0,ago:0,status:"todo"}]},
 {id:"shr",name:"Shredding and Mastering",subs:[
   {id:"sh1",name:"Daily training Shredding",pct:0,ago:0,status:"todo"},
   {id:"sh2",name:"Airbike",pct:0,ago:0,status:"todo"},
   {id:"sh3",name:"Running",pct:0,ago:0,status:"todo"},
   {id:"sh4",name:"Workout",pct:0,ago:0,status:"todo"}]},
 {id:"bks",name:"Books To Read",subs:[
   {id:"bk1",name:"The order of Time",pct:0,ago:0,status:"todo"},
   {id:"bk2",name:"When Breath Becomes Air",pct:0,ago:0,status:"todo"},
   {id:"bk3",name:"Reality is not what it seems",pct:0,ago:0,status:"todo"}]}
];

var KEY="oys-min-deliveries-v1";
var STATUSES=[["todo","Todo"],["doing","Doing"],["blocked","Blocked"],["done","Done"]];
var REPEATS=[["","Once"],["daily","Daily"],["weekdays","Weekdays"],["weekly","Weekly"],
             ["biweekly","Every 2 weeks"],["monthly","Monthly"]];
function repLabel(r){
  for(var i=0;i<REPEATS.length;i++) if(REPEATS[i][0]===r) return REPEATS[i][1];
  return "Once";
}
/* The period a recurring subtask is currently in. "" means it is not due
   today at all, which is how weekdays skips the weekend. */
function periodKey(r,d){
  d=d||new Date();
  if(r==="daily") return dstr(d);
  if(r==="weekdays"){ var w=d.getDay(); return (w===0||w===6)?"":dstr(d); }
  if(r==="weekly") return d.getFullYear()+"-W"+pad2(weekNo(d));
  if(r==="biweekly") return d.getFullYear()+"-B"+pad2(Math.floor(weekNo(d)/2));
  if(r==="monthly") return d.getFullYear()+"-"+pad2(d.getMonth()+1);
  return "";
}
/* Opening a new period closes the last one: a period finished lengthens the
   streak, a period missed ends it, and either way the task comes back clean. */
function rollRecurring(){
  var due=[];
  allSubs().forEach(function(sb){
    if(!sb.rep) return;
    var key=periodKey(sb.rep);
    if(!key || sb.period===key) return;
    if(sb.period){
      if(sb.pct>=100||sb.status==="done"){
        sb.streak=(sb.streak||0)+1;
        sb.best=Math.max(sb.best||0,sb.streak);
      } else sb.streak=0;
    }
    sb.period=key; sb.pct=0; sb.status="todo"; sb.upd=todayStr();
    due.push(sb);
  });
  if(due.length){
    due.forEach(function(sb){
      if(!state.plan.some(function(c){ return c.id===sb.id; }) &&
         !state.oftad.some(function(c){ return c.id===sb.id; }))
        state.plan.push({k:"sub",id:sb.id,done:false});
    });
    save();
  }
  return due;
}

