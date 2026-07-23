/* ============================================================
   WD LOADER v3 - Custom Javascript (Memberships > Courses >
   PANOUL NUNTII MELE > Settings > Advanced > Custom Javascript)

   Inlocuieste integral scriptul actual. Pastreaza tot ce face acum
   (redirect /home, maparea instrumentelor, identificarea contactului)
   si adauga ce lipseste si produce pagina goala pe mobil:

   1. AUTO-RESIZE. Instrumentele trimit deja inaltimea reala prin
      postMessage({wdHeight}), dar scriptul actual nu asculta. Iframe-ul
      ramane blocat la 2000px: pe mobil continutul e taiat, iar dedesubt
      ramane spatiu gol.
   2. SCROLL RESET la fiecare montare, inclusiv cand se schimba lectia.
   3. WATCHDOG. Injectarea nu mai e o singura incercare la 600ms. Daca
      SPA-ul randeaza tarziu (mobil) sau sterge iframe-ul, il pune la loc.
   4. Ascunderea continutului lectiei se face prin regula CSS, deci prinde
      si ce se randeaza dupa injectare.
   5. Mesaj vizibil cu link direct daca instrumentul nu se incarca in 9s.
      Mireasa nu mai vede niciodata ecran alb.
   ============================================================ */

/* ---------- 1. redirect global: /home -> biblioteca de cursuri ---------- */
(function(){
  "use strict";
  var LIB = "/courses/library-v2";
  function homeRedirect(){
    if(location.pathname === "/home" || location.pathname === "/home/"){
      location.replace(LIB);
      return true;
    }
    return false;
  }
  if(!homeRedirect()){
    var lastP = location.pathname;
    setInterval(function(){
      if(location.pathname !== lastP){
        lastP = location.pathname;
        homeRedirect();
      }
    }, 300);
  }
})();

/* ---------- 2. instrumentele ---------- */
(function(){
"use strict";

var GH   = "https://butcuu.github.io/wd/";
var ORIG = "https://butcuu.github.io";
var MAXH = 30000;

var TOOLS = {
  "91ca406c-00bf-4a4c-ab24-f47971007e1c": "panou.html",
  "48ea5cab-c32f-4ccb-a6c3-ba959f723785": "buget.html",
  "46f55aa5-48b0-4022-8161-5be7d1c9be34": "invitati.html",
  "c4f25fbc-8b4e-4471-9748-ae9c9fb2b01f": "comparator.html",
  "6cbbe44b-cf37-4ed6-90c4-faa054da52d3": "creator.html",
  "06237266-ce93-4ea3-bd18-2d4d125b9209": "stadii.html"
};

/* inaltime de start, doar pana vine inaltimea reala prin postMessage */
var START = 900;

/* ---------- identificare contact (aceeasi logica din productie) ---------- */
var CID = null;

function looksLikeId(v){
  return typeof v === "string" && /^[A-Za-z0-9]{15,28}$/.test(v);
}
function deepFindCid(o, depth){
  if(!o || typeof o !== "object" || depth > 6) return "";
  for(var k in o){
    if(!Object.prototype.hasOwnProperty.call(o,k)) continue;
    var v = o[k];
    if(/^contact_?id$/i.test(k) && looksLikeId(v)) return v;
    if(/^contact$/i.test(k) && v && typeof v === "object" && looksLikeId(v.id)) return v.id;
  }
  for(var k2 in o){
    if(!Object.prototype.hasOwnProperty.call(o,k2)) continue;
    var v2 = o[k2];
    if(v2 && typeof v2 === "object"){
      var r = deepFindCid(v2, depth+1);
      if(r) return r;
    }
  }
  return "";
}
function findCid(){
  var RE = /"contact_?[iI]d"\s*:\s*"([A-Za-z0-9]{15,28})"/;
  /* 0. daca lectia a fost deschisa cu ?cid= (navigare intre instrumente) */
  try{
    var q = new URLSearchParams(location.search).get("cid");
    if(q && looksLikeId(q)) return q;
  }catch(e){}
  /* 1. localStorage["common"] - sursa principala pe clientclub */
  try{
    var raw = localStorage.getItem("common");
    if(raw){
      var m = raw.match(RE);
      if(m) return m[1];
      var r = deepFindCid(JSON.parse(raw), 0);
      if(r) return r;
    }
  }catch(e){}
  /* 2. orice alta cheie din localStorage */
  try{
    for(var i=0;i<localStorage.length;i++){
      var kk = localStorage.key(i);
      if(kk === "wd_cid") continue;
      var v = localStorage.getItem(kk) || "";
      var m2 = v.match(RE);
      if(m2) return m2[1];
    }
  }catch(e){}
  /* 3. dataLayer */
  try{
    if(window.dataLayer && window.dataLayer.length){
      for(var j=0;j<window.dataLayer.length;j++){
        var s = "";
        try{ s = JSON.stringify(window.dataLayer[j]); }catch(e){}
        if(s){ var m3 = s.match(RE); if(m3) return m3[1]; }
      }
    }
  }catch(e){}
  /* 4. fallback vechi: token firebase */
  try{
    for(var x=0;x<localStorage.length;x++){
      var k = localStorage.key(x);
      if(k && k.indexOf("firebase:authUser") > -1){
        var d = JSON.parse(localStorage.getItem(k));
        if(d && d.stsTokenManager && d.stsTokenManager.accessToken){
          var pl = JSON.parse(atob(d.stsTokenManager.accessToken.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
          if(pl.contact_id) return pl.contact_id;
        }
      }
    }
  }catch(e){}
  /* 5. ultima varianta: cache local */
  try{ var c = localStorage.getItem("wd_cid"); if(c) return c; }catch(e){}
  return "";
}
function getCid(){
  if(CID) return CID;
  var id = findCid();
  if(id){ CID = id; try{ localStorage.setItem("wd_cid", id); }catch(e){} }
  return id;
}

/* ---------- helpers ---------- */
function lessonId(){
  var m = location.pathname.match(/posts\/([0-9a-f\-]{36})/i);
  return m ? m[1] : null;
}

/* aceeasi lista ca in scriptul actual, in aceeasi ordine */
var HOST_SEL = [".post-content",".lesson-content",".course-post-content",
  "[class*=post-body]","[class*=postContent]","[class*=lesson]","[class*=PostContent]",
  "[class*=content-area]",".content","main","#main"];

function findHost(){
  for(var i=0;i<HOST_SEL.length;i++){
    var e = document.querySelector(HOST_SEL[i]);
    if(e && e !== document.body && e !== document.documentElement) return e;
  }
  return null;
}

function ensureStyle(){
  if(document.getElementById("wd-loader-style")) return;
  var s = document.createElement("style");
  s.id = "wd-loader-style";
  s.textContent =
    '[data-wd-host]>*:not(#wd-wrap){display:none!important}' +
    '#wd-wrap{display:block!important;width:100%;margin:0;min-height:420px}' +
    '#wd-frame{width:100%;border:0;display:block;background:#fcf8f3;border-radius:12px}' +
    '#wd-fb{font-family:Inter,-apple-system,system-ui,sans-serif;color:#4f463f;background:#fcf8f3;' +
      'border:1px solid #e9e0d2;border-radius:12px;padding:26px 20px;text-align:center;font-size:15px;line-height:1.6}' +
    '#wd-fb b{display:block;font-size:18px;color:#2b2622;margin-bottom:6px}' +
    '#wd-fb a{display:inline-block;margin-top:14px;background:#C6A96C;color:#fff;text-decoration:none;' +
      'font-weight:700;padding:12px 26px;border-radius:24px}';
  (document.head || document.documentElement).appendChild(s);
}

function clearHosts(except){
  var m = document.querySelectorAll("[data-wd-host]");
  for(var i=0;i<m.length;i++){ if(m[i] !== except) m[i].removeAttribute("data-wd-host"); }
}
function unmount(){
  clearHosts(null);
  var w = document.getElementById("wd-wrap");
  if(w && w.parentNode) w.parentNode.removeChild(w);
}
function srcFor(lid, cid){
  return GH + TOOLS[lid] + "?v=3" + (cid ? ("&cid=" + encodeURIComponent(cid)) : "");
}

/* ---------- montare + watchdog ---------- */
var tries = 0;

function mount(){
  var lid = lessonId();

  /* lectie normala (video): curat orice urma si ies. Aici scriptul nu face nimic. */
  if(!lid || !TOOLS[lid]){
    if(document.getElementById("wd-wrap") || document.querySelector("[data-wd-host]")) unmount();
    tries = 0;
    return;
  }

  var wrap = document.getElementById("wd-wrap");

  /* daca e deja montat corect, nu mai caut containerul (economie pe mobil) */
  if(wrap && wrap.getAttribute("data-lid") === lid && wrap.parentNode &&
     wrap.parentNode.hasAttribute("data-wd-host") && document.body.contains(wrap)){
    if(wrap.getAttribute("data-cid") !== "1"){
      var c0 = getCid();
      if(c0){
        wrap.setAttribute("data-cid","1");
        var fr0 = document.getElementById("wd-frame");
        if(fr0) fr0.src = srcFor(lid, c0);
      }
    }
    return;
  }

  var host = findHost();

  /* containerul lectiei inca nu e randat: astept, nu stric pagina.
     dupa ~6 secunde cad pe body, dar tot prin CSS, deci reversibil. */
  if(!host){
    tries++;
    if(tries < 12) return;
    host = document.body;
  }

  /* deja montat corect */
  if(wrap && wrap.parentNode === host && wrap.getAttribute("data-lid") === lid){
    if(!host.hasAttribute("data-wd-host")){ clearHosts(host); host.setAttribute("data-wd-host","1"); }
    /* daca a pornit fara cid si intre timp l-am gasit, reincarc instrumentul */
    if(wrap.getAttribute("data-cid") !== "1"){
      var c = getCid();
      if(c){
        wrap.setAttribute("data-cid","1");
        var fr = document.getElementById("wd-frame");
        if(fr) fr.src = srcFor(lid, c);
      }
    }
    return;
  }

  ensureStyle();
  if(wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);

  var cid = getCid();

  wrap = document.createElement("div");
  wrap.id = "wd-wrap";
  wrap.setAttribute("data-lid", lid);
  if(cid) wrap.setAttribute("data-cid","1");

  var f = document.createElement("iframe");
  f.id = "wd-frame";
  f.src = srcFor(lid, cid);
  f.setAttribute("scrolling","yes");
  f.allow = "clipboard-write";
  f.style.height = START + "px";

  var ok = false;
  f.addEventListener("load", function(){ ok = true; });

  wrap.appendChild(f);
  host.insertBefore(wrap, host.firstChild);
  clearHosts(host);
  host.setAttribute("data-wd-host","1");
  tries = 0;

  try{ window.scrollTo(0,0); }catch(e){}

  /* plasa de siguranta: mesaj in loc de ecran alb */
  setTimeout(function(){
    if(ok) return;
    if(!document.body.contains(f)) return;
    if(document.getElementById("wd-fb")) return;
    var fb = document.createElement("div");
    fb.id = "wd-fb";
    fb.innerHTML = '<b>Instrumentul nu s-a incarcat</b>' +
      'Conexiunea a intrerupt incarcarea. Reincarca pagina sau deschide instrumentul direct.' +
      '<a href="' + f.src + '" target="_top">Deschide instrumentul</a>';
    wrap.insertBefore(fb, f);
  }, 9000);
}

/* ---------- auto-resize: ascult inaltimea reala trimisa de instrument ---------- */
window.addEventListener("message", function(ev){
  if(ev.origin !== ORIG) return;
  var h = ev.data && ev.data.wdHeight;
  if(!h || h < 200 || h > MAXH) return;
  var f = document.getElementById("wd-frame");
  if(f && f.contentWindow === ev.source && Math.abs(parseInt(f.style.height,10) - h) > 4){
    f.style.height = h + "px";
  }
});

/* ---------- pornire ---------- */
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
mount();
setInterval(mount, 500);
window.addEventListener("pageshow", mount);
document.addEventListener("visibilitychange", function(){ if(!document.hidden) mount(); });

})();
