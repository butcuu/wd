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
    var sels = [".post-content",".lesson-content",".course-post-content","[class*=post-body]","[class*=postContent]","[class*=lesson]","[class*=PostContent]","[class*=content-area]",".content","main","#main"];
    for(var i=0;i<sels.length;i++){ var e=document.querySelector(sels[i]); if(e) return e; }
    return document.body;
  }
  var theFrame = null, lastApplied = 0;
  window.addEventListener("message", function(ev){
    if(!(ev && ev.data && ev.data.wdHeight && theFrame)) return;
    if(theFrame.contentWindow !== ev.source) return;
    var newH = ev.data.wdHeight;
    if(newH < 150 || newH > 30000) return;
    // urmaresc EXACT inaltimea continutului (nu adaug spatiu mare). Aplic doar daca difera >5px.
    if(Math.abs(newH - lastApplied) > 5){
      theFrame.style.height = newH + "px";
      lastApplied = newH;
    }
  });
  function inject(){
    var lid = currentLessonId();
    if(!lid || !TOOLS[lid]) return;
    if(document.getElementById("wd-frame-"+lid)) return;
    var host = findHost();
    var cid = getCid();
    var src = GH + TOOLS[lid] + (cid ? ("?cid="+encodeURIComponent(cid)) : "");
    try {
      Array.prototype.forEach.call(host.children, function(ch){
        ch.setAttribute("data-wd-hidden","1");
        ch.style.display = "none";
      });
    } catch(e){}
    var f = document.createElement("iframe");
    f.id = "wd-frame-"+lid;
    f.src = src;
    // pornesc de la o inaltime mica; snippetul din iframe o creste exact cat trebuie
    f.style.cssText = "width:100%;border:0;display:block;height:600px;background:#fcf8f3;border-radius:12px;margin:0;";
    f.setAttribute("scrolling","no");
    f.allow = "clipboard-write";
    host.insertBefore(f, host.firstChild);
    theFrame = f; lastApplied = 600;
    setTimeout(function(){
      try { window.scrollTo({top:0, behavior:"smooth"}); } catch(e){ window.scrollTo(0,0); }
    }, 200);
  }
  function tryInject(){ setTimeout(inject, 600); }
  if(document.readyState!=="loading") tryInject(); else document.addEventListener("DOMContentLoaded", tryInject);
  var lastPath = location.pathname;
  setInterval(function(){
    if(location.pathname !== lastPath){ lastPath = location.pathname; theFrame=null; lastApplied=0; tryInject(); }
  }, 700);
})();
