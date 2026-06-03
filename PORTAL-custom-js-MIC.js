/* ════════════════════════════════════════════════════════════
   WEDDING DIRECTION — Loader instrumente zona de membri
   Se pune in: Courses > Settings > Advanced > Custom JavaScript
   Detecteaza lectia (dupa ID), incarca instrumentul de pe GitHub
   intr-un iframe, ii paseaza cid-ul miresei (din Firebase).
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

  // cid-ul miresei din token Firebase (portalul are Firebase, il citim aici)
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
    if(m) return m[1];
    var q = new URLSearchParams(location.search).get("post");
    return q || null;
  }

  function inject(){
    var lid = currentLessonId();
    if(!lid || !TOOLS[lid]) return;
    if(document.getElementById("wd-frame-"+lid)) return;

    var host = document.querySelector(".post-content, .lesson-content, .course-post-content, [class*=post-body], main") || document.body;

    var cid = getCid();
    var src = GH + TOOLS[lid] + (cid ? ("?cid="+encodeURIComponent(cid)) : "");

    var f = document.createElement("iframe");
    f.id = "wd-frame-"+lid;
    f.src = src;
    f.style.cssText = "width:100%;border:0;display:block;min-height:1400px;background:#fcf8f3;";
    f.setAttribute("scrolling","no");
    f.allow = "clipboard-write";

    host.appendChild(f);

    // ajustez inaltimea iframe-ului la continut (mesaj de la pagina copil)
    window.addEventListener("message", function(ev){
      if(ev && ev.data && ev.data.wdHeight && f){
        f.style.minHeight = (ev.data.wdHeight + 40) + "px";
      }
    });
  }

  function tryInject(){ setTimeout(inject, 500); }
  if(document.readyState!=="loading") tryInject(); else document.addEventListener("DOMContentLoaded", tryInject);

  var lastPath = location.pathname;
  setInterval(function(){
    if(location.pathname !== lastPath){ lastPath = location.pathname; tryInject(); }
  }, 600);
})();
