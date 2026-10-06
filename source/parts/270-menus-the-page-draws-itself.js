/* ---------------- menus the page draws itself ----------------
   A native select hands its list to the operating system, which builds it
   from the control's own colours and its own idea of the theme. On a dark
   board that came back white with grey text, and there is no stylesheet
   that reliably fixes it: the popup is not in the page.

   So the page draws it. The real <select> stays where it is and keeps the
   value, so every handler that listens for a change is untouched; what you
   see and press is a list of buttons in the board's own colours.       */
function enhanceSelects(root){
  var list=(root||document).querySelectorAll("select.f:not([data-xsel])");
  Array.prototype.forEach.call(list,function(sel){
    sel.setAttribute("data-xsel","1");
    var wrap=document.createElement("div");
    wrap.className="xsel";
    sel.parentNode.insertBefore(wrap,sel);
    wrap.appendChild(sel);

    var btn=document.createElement("button");
    btn.type="button"; btn.className="xsel-btn";
    btn.setAttribute("aria-haspopup","listbox");
    btn.setAttribute("aria-expanded","false");
    if(sel.getAttribute("aria-label")) btn.setAttribute("aria-label",sel.getAttribute("aria-label"));

    var menu=document.createElement("div");
    menu.className="xsel-menu"; menu.setAttribute("role","listbox"); menu.hidden=true;

    function label(){
      var o=sel.options[sel.selectedIndex];
      return o?o.textContent:"";
    }
    function paint(){
      btn.innerHTML='<span>'+esc(label())+'</span>'+
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>';
      menu.innerHTML="";
      Array.prototype.forEach.call(sel.options,function(o,i){
        var it=document.createElement("button");
        it.type="button"; it.className="xsel-opt"+(i===sel.selectedIndex?" on":"");
        it.setAttribute("role","option");
        it.setAttribute("aria-selected",i===sel.selectedIndex?"true":"false");
        it.textContent=o.textContent;
        it.addEventListener("click",function(e){
          e.stopPropagation();
          sel.selectedIndex=i;
          sel.dispatchEvent(new Event("change",{bubbles:true}));
          close();
        });
        menu.appendChild(it);
      });
    }
    function open(){
      closeAllSelects();
      paint();
      menu.hidden=false; btn.setAttribute("aria-expanded","true");
      /* a list that would run off the bottom opens upward instead */
      var r=btn.getBoundingClientRect();
      menu.classList.toggle("up", r.bottom+Math.min(menu.scrollHeight,240)+12>window.innerHeight);
      var on=menu.querySelector(".xsel-opt.on"); if(on) on.focus();
    }
    function close(){ menu.hidden=true; btn.setAttribute("aria-expanded","false"); paint(); }
    wrap._close=close;

    btn.addEventListener("click",function(e){
      e.stopPropagation();
      if(menu.hidden) open(); else close();
    });
    menu.addEventListener("keydown",function(e){
      var items=Array.prototype.slice.call(menu.children);
      var i=items.indexOf(document.activeElement);
      if(e.key==="ArrowDown"){ e.preventDefault(); (items[i+1]||items[0]).focus(); }
      else if(e.key==="ArrowUp"){ e.preventDefault(); (items[i-1]||items[items.length-1]).focus(); }
      else if(e.key==="Escape"){ e.preventDefault(); close(); btn.focus(); }
    });
    sel.addEventListener("change",paint);
    wrap.appendChild(btn); wrap.appendChild(menu);
    paint();
  });
}
function closeAllSelects(){
  Array.prototype.forEach.call(document.querySelectorAll(".xsel"),function(w){
    if(w._close) w._close();
  });
}
addEventListener("click",function(){ closeAllSelects(); });

