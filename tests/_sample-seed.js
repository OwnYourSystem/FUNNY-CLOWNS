/* A neutral board for the tests (2026-10-21). The app now ships with no goals (flaw 13), and most suites were
   written against a board that already had some. _sample.mjs puts this list in place of the empty seed in the page
   the tests open, so they start where they always did. Same shape as the old seed: 15 goals, 68 steps, the same
   progress, status and tag spread. No real goal is in it. */
export const SAMPLE_SEED=[
 {id:"smpg01",name:"Home repairs",subs:[
   {id:"smps001",name:"Sample step 1",pct:70,ago:2,status:"doing"}]},
 {id:"smpg02",name:"Garden",subs:[
   {id:"smps002",name:"Sample step 2",pct:100,ago:11,status:"done"},
   {id:"smps003",name:"Sample step 3",pct:60,ago:4,status:"doing"},
   {id:"smps004",name:"Sample step 4",pct:30,ago:9,status:"doing"},
   {id:"smps005",name:"Record a short video — part 5",pct:100,ago:17,status:"done"},
   {id:"smps006",name:"Record a short video — part 6",pct:75,ago:3,status:"doing"},
   {id:"smps007",name:"Record a short video — part 7",pct:20,ago:16,status:"doing"},
   {id:"smps008",name:"Record a short video — part 8",pct:0,ago:30,status:"todo"},
   {id:"smps009",name:"Record a short video — part 9",pct:0,ago:30,status:"todo"},
   {id:"smps010",name:"Plan the visit → book the travel",pct:40,ago:5,status:"doing"},
   {id:"smps011",name:"Sample step 11",pct:15,ago:21,status:"doing"}]},
 {id:"smpg03",name:"Kitchen refit",subs:[
   {id:"smps012",name:"Sample step 12",pct:5,ago:19,status:"doing",tag:"Planning"},
   {id:"smps013",name:"Sample step 13",pct:55,ago:1,status:"doing"},
   {id:"smps014",name:"Plan the visit → book the travel",pct:25,ago:12,status:"blocked"},
   {id:"smps015",name:"Sample step 15",pct:10,ago:8,status:"doing"},
   {id:"smps016",name:"Sample step 16",pct:0,ago:30,status:"todo"},
   {id:"smps017",name:"Sample step 17",pct:0,ago:30,status:"todo"},
   {id:"smps018",name:"Sample step 18",pct:0,ago:30,status:"todo"},
   {id:"smps019",name:"Sample step 19",pct:0,ago:0,status:"todo"}]},
 {id:"smpg04",name:"Car",subs:[
   {id:"smps020",name:"Write down the scope, the people and the sources for the sample project, then check it",pct:0,ago:0,status:"todo"},
   {id:"smps021",name:"Write down the scope, the people and the sources for the sample project, then check it",pct:0,ago:0,status:"todo"},
   {id:"smps022",name:"Sample step 22",pct:0,ago:0,status:"todo"},
   {id:"smps023",name:"Sample step 23",pct:0,ago:0,status:"todo"},
   {id:"smps024",name:"Sample step 24",pct:0,ago:0,status:"todo"},
   {id:"smps025",name:"Sample step 25",pct:0,ago:0,status:"todo"},
   {id:"smps026",name:"Sample step 26",pct:0,ago:0,status:"todo"},
   {id:"smps027",name:"Sample step 27",pct:45,ago:4,status:"doing"},
   {id:"smps028",name:"Sample step 28",pct:10,ago:6,status:"doing"}]},
 {id:"smpg05",name:"Finances",subs:[
   {id:"smps029",name:"Sample step 29",pct:0,ago:0,status:"todo"},
   {id:"smps030",name:"Sample step 30",pct:0,ago:0,status:"todo"}]},
 {id:"smpg06",name:"Health checks",subs:[
   {id:"smps031",name:"Sample step 31",pct:50,ago:7,status:"doing"},
   {id:"smps032",name:"Sample step 32",pct:35,ago:3,status:"doing"},
   {id:"smps033",name:"Sample step 33",pct:20,ago:15,status:"doing"},
   {id:"smps034",name:"Sample step 34",pct:15,ago:10,status:"doing"}]},
 {id:"smpg07",name:"Learning Spanish",subs:[
   {id:"smps035",name:"Sample step 35",pct:0,ago:0,status:"todo"},
   {id:"smps036",name:"Sample step 36",pct:80,ago:2,status:"doing"},
   {id:"smps037",name:"Sample step 37",pct:35,ago:9,status:"doing"},
   {id:"smps038",name:"Sample step 38",pct:25,ago:14,status:"doing"},
   {id:"smps039",name:"Sample step 39",pct:60,ago:5,status:"doing"}]},
 {id:"smpg08",name:"Photo album",subs:[
   {id:"smps040",name:"Sample step 40",pct:40,ago:6,status:"doing"},
   {id:"smps041",name:"Sample step 41",pct:0,ago:0,status:"todo"},
   {id:"smps042",name:"Sample step 42",pct:30,ago:11,status:"doing"},
   {id:"smps043",name:"Sample step 43",pct:20,ago:18,status:"doing"},
   {id:"smps044",name:"Sample step 44",pct:0,ago:0,status:"todo"},
   {id:"smps045",name:"Sample step 45",pct:45,ago:6,status:"doing"},
   {id:"smps046",name:"Sample step 46",pct:0,ago:0,status:"todo"}]},
 {id:"smpg09",name:"Bike",subs:[
   {id:"smps047",name:"Sample step 47",pct:45,ago:8,status:"doing"}]},
 {id:"smpg10",name:"Moving house",subs:[
   {id:"smps048",name:"Sample step 48",pct:0,ago:0,status:"todo"},
   {id:"smps049",name:"Sample step 49",pct:30,ago:13,status:"doing"}]},
 {id:"smpg11",name:"Side project",subs:[
   {id:"smps050",name:"Sample step 50",pct:0,ago:0,status:"todo"},
   {id:"smps051",name:"Sample step 51",pct:0,ago:0,status:"todo"},
   {id:"smps052",name:"Sample step 52",pct:0,ago:0,status:"todo"},
   {id:"smps053",name:"Sample step 53",pct:0,ago:0,status:"todo"},
   {id:"smps054",name:"Sample step 54",pct:0,ago:0,status:"todo"},
   {id:"smps055",name:"Sample step 55",pct:0,ago:0,status:"todo"}]},
 {id:"smpg12",name:"Course",subs:[
   {id:"smps056",name:"Sample step 56",pct:0,ago:0,status:"todo"},
   {id:"smps057",name:"Sample step 57",pct:0,ago:0,status:"todo"},
   {id:"smps058",name:"Other options …?",pct:0,ago:0,status:"todo"},
   {id:"smps059",name:"Sample step 59",pct:0,ago:0,status:"todo"}]},
 {id:"smpg13",name:"Writing",subs:[
   {id:"smps060",name:"Sample step 60",pct:0,ago:0,status:"todo"},
   {id:"smps061",name:"Sample step 61",pct:0,ago:0,status:"todo"}]},
 {id:"smpg14",name:"Fitness",subs:[
   {id:"smps062",name:"Sample step 62",pct:0,ago:0,status:"todo"},
   {id:"smps063",name:"Sample step 63",pct:0,ago:0,status:"todo"},
   {id:"smps064",name:"Sample step 64",pct:0,ago:0,status:"todo"},
   {id:"smps065",name:"Sample step 65",pct:0,ago:0,status:"todo"}]},
 {id:"smpg15",name:"Reading list",subs:[
   {id:"smps066",name:"Sample step 66",pct:0,ago:0,status:"todo"},
   {id:"smps067",name:"Sample step 67",pct:0,ago:0,status:"todo"},
   {id:"smps068",name:"Sample step 68",pct:0,ago:0,status:"todo"}]}
];
