/* ════════════════════════════════════════════════════════════
   WEDDING DIRECTION — Loader instrumente (v4 - inaltime stabila)
   Courses > Settings > Advanced > Custom JavaScript
   ════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var GH = "https://butcuu.github.io/wd/";
  var TOOLS = {
    "91ca406c-00bf-4a4c-ab24-f47971007e1c": "panou.html",
    "48ea5cab-c32f-4ccb-a6c3-ba959f723785": "buget.html",
    "46f55aa5-48b0-4022-8161-5be7d1c9be34": "invitati.html",
    "c4f25fbc-8b4e-4471-9748-ae9c9fb2b01f": "comparator.html",
    "6cbbe44b-cf37-4ed6-90c4-faa054da52d3": "creator.html"
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
    var sels = [".post-content",".lesson-content",".course-post-content",
      "[class*=post-body]","[class*=postContent]","[class*=lesson]",
      "[class*=PostContent]","[class*=content-area]",".content","main","#main"];
    for(var i=0;i<sels.length;i++){ var e=document.querySelector(sels[i]); if(e) return e; }
    return document.body;
  }

  var frames = {};
  var lastH = {};
  window.addEventListener("message", function(ev){
    if(ev && ev.data && ev.data.wdHeight){
      var newH = ev.data.wdHeight;
      for(var id in frames){
        var f = frames[id];
        if(f && f.contentWindow === ev.source){
          // aplic doar daca difera semnificativ (>8px) - opresc tremurul/bucla
          var prev = lastH[id] || 0;
          if(Math.abs(newH - prev) > 8 && newH > 100 && newH < 12000){
            f.style.height = (newH + 16) + "px";
            lastH[id] = newH;
          }
        }
      }
    }
  });

  function inject(){
    var lid = currentLessonId();
    if(!lid || !TOOLS[lid]) return;
    if(document.getElementById("wd-frame-"+lid)) return;

    var host = findHost();
    var cid = getCid();
    var src = GH + TOOLS[lid] + (cid ? ("?cid="+encodeURIComponent(cid)) : "");

    var f = document.createElement("iframe");
    f.id = "wd-frame-"+lid;
    f.src = src;
    f.style.cssText = "width:100%;border:0;display:block;height:700px;background:#fcf8f3;border-radius:12px;margin:10px 0;";
    f.setAttribute("scrolling","no");
    f.allow = "clipboard-write";

    if(host.firstChild) host.insertBefore(f, host.firstChild);
    else host.appendChild(f);

    frames[lid] = f;
    console.log("[WD] injectat:", TOOLS[lid], "cid:", cid||"(lipsa)");
  }

  function tryInject(){ setTimeout(inject, 600); }
  if(document.readyState!=="loading") tryInject(); else document.addEventListener("DOMContentLoaded", tryInject);

  var lastPath = location.pathname;
  setInterval(function(){
    if(location.pathname !== lastPath){ lastPath = location.pathname; frames={}; lastH={}; tryInject(); }
  }, 700);

  console.log("[WD] loader pornit v4.");
})();
