(function(){
  "use strict";

  // --- Fix carduri instrumente: gaseste butoanele DUPA link, forteaza culoarea (bate orice) ---
  (function(){
    var IDS=["48ea5cab-c32f-4ccb-a6c3-ba959f723785","46f55aa5-48b0-4022-8161-5be7d1c9be34","c4f25fbc-8b4e-4471-9748-ae9c9fb2b01f","6cbbe44b-cf37-4ed6-90c4-faa054da52d3","91ca406c-00bf-4a4c-ab24-f47971007e1c"];
    function isTool(a){ var h=a.getAttribute("href")||""; for(var i=0;i<IDS.length;i++){ if(h.indexOf(IDS[i])>-1) return true; } return false; }
    function style(){
      var links=document.querySelectorAll("a[href]");
      Array.prototype.forEach.call(links,function(a){
        if(!isTool(a)) return;
        a.style.setProperty("text-decoration","none","important");
        a.style.setProperty("color","#2C2926","important");
        Array.prototype.forEach.call(a.querySelectorAll("*"),function(el){
          el.style.setProperty("text-decoration","none","important");
          if(el.tagName==="P" && !el.querySelector("strong")){ el.style.setProperty("color","#6b6258","important"); }
          else { el.style.setProperty("color","#2C2926","important"); }
        });
        var card=a.closest?a.closest("td"):a.parentNode;
        if(card && !card.getAttribute("data-wd-bound")){
          card.setAttribute("data-wd-bound","1");
          card.style.transition="border-color .15s ease, box-shadow .15s ease";
          var on=function(){ card.style.setProperty("border-color","#C6A96C","important"); card.style.setProperty("box-shadow","0 0 0 1px #C6A96C inset, 0 6px 18px rgba(155,121,56,.10)","important"); };
          var off=function(){ card.style.removeProperty("box-shadow"); card.style.setProperty("border-color","#EFE6D8","important"); };
          card.addEventListener("mouseenter",on); card.addEventListener("mouseleave",off);
          a.addEventListener("focus",on); a.addEventListener("blur",off);
        }
      });
    }
    style();
    var n=0, iv=setInterval(function(){ style(); if(++n>30) clearInterval(iv); }, 350);
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", style);
    try{ new MutationObserver(style).observe(document.body,{childList:true,subtree:true}); }catch(e){}
  })();

  var GH = "https://butcuu.github.io/wd/";
  var TOOLS = {
    "91ca406c-00bf-4a4c-ab24-f47971007e1c": "panou.html",
    "48ea5cab-c32f-4ccb-a6c3-ba959f723785": "buget.html",
    "46f55aa5-48b0-4022-8161-5be7d1c9be34": "invitati.html",
    "c4f25fbc-8b4e-4471-9748-ae9c9fb2b01f": "comparator.html",
    "6cbbe44b-cf37-4ed6-90c4-faa054da52d3": "creator.html",
    "06237266-ce93-4ea3-bd18-2d4d125b9209": "stadii.html"
  };
  var HEIGHT = {
    "91ca406c-00bf-4a4c-ab24-f47971007e1c": 2000,
    "48ea5cab-c32f-4ccb-a6c3-ba959f723785": 2000,
    "46f55aa5-48b0-4022-8161-5be7d1c9be34": 2000,
    "c4f25fbc-8b4e-4471-9748-ae9c9fb2b01f": 2000,
    "6cbbe44b-cf37-4ed6-90c4-faa054da52d3": 2000,
    "06237266-ce93-4ea3-bd18-2d4d125b9209": 1700
  };
  function getCid(){
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(k&&k.indexOf("firebase:authUser")>-1){
          var d=JSON.parse(localStorage.getItem(k));
          if(d&&d.stsTokenManager&&d.stsTokenManager.accessToken){
            var pl=JSON.parse(atob(d.stsTokenManager.accessToken.split(".")[1].replace(/-/g,'+').replace(/_/g,'/')));
            if(pl.contact_id) return pl.contact_id;
          }
        }
      }
    }catch(e){}
    return "";
  }
  function currentLessonId(){
    var m = location.pathname.match(/posts\/([0-9a-f\-]{36})/i);
    return m ? m[1] : null;
  }
  function findHost(){
    var sels = [".post-content",".lesson-content",".course-post-content","[class*=post-body]","[class*=postContent]","[class*=lesson]","[class*=PostContent]","[class*=content-area]",".content","main","#main"];
    for(var i=0;i<sels.length;i++){ var e=document.querySelector(sels[i]); if(e) return e; }
    return document.body;
  }
  function inject(){
    var lid = currentLessonId();
    if(!lid || !TOOLS[lid]) return;
    if(document.getElementById("wd-frame-"+lid)) return;
    var host = findHost();
    var cid = getCid();
    var src = GH + TOOLS[lid] + (cid ? ("?cid="+encodeURIComponent(cid)) : "");
    var h = HEIGHT[lid] || 1500;
    try {
      Array.prototype.forEach.call(host.children, function(ch){
        ch.setAttribute("data-wd-hidden","1");
        ch.style.display = "none";
      });
    } catch(e){}
    var f = document.createElement("iframe");
    f.id = "wd-frame-"+lid;
    f.src = src;
    f.style.cssText = "width:100%;border:0;display:block;height:"+h+"px;background:#fcf8f3;border-radius:12px;margin:0;";
    f.setAttribute("scrolling","yes");
    f.allow = "clipboard-write";
    host.insertBefore(f, host.firstChild);
    setTimeout(function(){
      try { window.scrollTo({top:0, behavior:"smooth"}); } catch(e){ window.scrollTo(0,0); }
    }, 200);
  }
  function tryInject(){ setTimeout(inject, 600); }
  if(document.readyState!=="loading") tryInject(); else document.addEventListener("DOMContentLoaded", tryInject);
  var lastPath = location.pathname;
  setInterval(function(){
    if(location.pathname !== lastPath){ lastPath = location.pathname; tryInject(); }
  }, 700);

  // ===== AUTO-RESIZE: ascult inaltimea reala trimisa de instrument si potrivesc iframe-ul =====
  // Fix scroll mobil: iframe-ul creste pe continut, fara scroll intern, fara blocaj.
  // Atinge DOAR iframe-urile wd-frame (instrumentele). NU atinge video-uri sau alt continut.
  window.addEventListener("message", function(ev){
    try {
      var h = ev && ev.data && ev.data.wdHeight;
      if (!h || h < 200 || h > 20000) return;
      var frames = document.querySelectorAll('iframe[id^="wd-frame-"]');
      for (var i=0;i<frames.length;i++){
        if (frames[i].contentWindow === ev.source){
          frames[i].style.height = h + "px";
          break;
        }
      }
    } catch(e){}
  });
})();
