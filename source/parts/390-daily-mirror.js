/* ---------------- daily mirror ----------------
   The board lives in this browser. A scheduled reminder cannot read
   localStorage, so when the page runs inside claude.ai it mirrors just
   today's docks into the artifact store. Nothing else leaves the page,
   and the downloaded file skips this entirely.                        */
var boardDb=null, syncT=null;
