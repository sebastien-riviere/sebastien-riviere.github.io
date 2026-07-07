/* ============================================================
   SITE — chrome partagé : injecte header (nav + cloche) & footer,
   gère thème (persistant), bouton mail (copie) et cloche « Quoi de neuf ».
   Usage dans la page :
     <div id="sr-header" data-active="outils"></div> ... <div id="sr-footer"></div>
     <script src="/assets/site.js" defer></script>
   data-active ∈ home | mediatheque | articles | outils  (facultatif)
   ============================================================ */
(function(){
  "use strict";

  /* --- Données « Quoi de neuf » (source unique) --- */
  var NOTIFS=[
    {id:"creole-2026-07-04", tint:"--t-art",  lab:"Article",     ttl:"Quand l'IA chante en créole",            when:"4 juil.",   href:"/articles/quand-l-ia-chante-en-creole/"},
    {id:"mediatheque-2026-07",tint:"--t-labo",lab:"Médiathèque", ttl:"Films &amp; séries sur l'IA ajoutés",     when:"juillet",   href:"/outils/mediatheque-ia/"},
    {id:"glossaire-2026-07", tint:"--t-ia",   lab:"Glossaire",   ttl:"Nouvelles définitions IA",                when:"cette sem.",href:"/outils/glossaire-ia/"},
    {id:"optout-2026-07",    tint:"--t-prod", lab:"Guide",       ttl:"Refuser l'entraînement des IA (opt-out)", when:"nouveau",   href:"/opt-out-ia/"}
  ];
  var NAV=[
    {key:"home",        label:"Accueil",              href:"/"},
    {key:"mediatheque", label:"Médiathèque IA",       href:"/outils/mediatheque-ia/"},
    {key:"articles",    label:"Articles &amp; enquêtes",href:"/articles/"},
    {key:"outils",      label:"Outils",               href:"/outils/"}
  ];
  var MAIL="rsebastien@protonmail.com";
  var LINKEDIN="https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil";

  function esc(s){return s;}

  function headerHTML(active){
    var nav=NAV.map(function(n){
      return '<a href="'+n.href+'"'+(n.key===active?' class="active"':'')+'>'+n.label+'</a>';
    }).join('');
    var notifs=NOTIFS.map(function(o){
      return '<a class="sr-notif" data-id="'+o.id+'" style="--tint:var('+o.tint+')" href="'+o.href+'">'
        +'<span class="dot"></span>'
        +'<span class="nbody"><span class="lab">'+o.lab+'</span><span class="ttl">'+o.ttl+'</span></span>'
        +'<span class="when">'+o.when+'</span><span class="new"></span></a>';
    }).join('');
    return ''
    +'<div class="sr-navband"><div class="sr-maxw">'
    +'<div class="sr-navtop">'
    +'<a class="sr-brand" href="/">'
    +'<span class="sr-logo"><img src="/logo.png" alt="Logo Sébastien Rivière" width="32" height="32"></span>'
    +'<span><span class="sr-nm">Sébastien Rivière</span><br><span class="sr-tg">apprendre · comprendre · transmettre</span></span>'
    +'</a>'
    +'<div class="sr-actions">'
    +'<div class="sr-notif-wrap">'
    +'<button class="sr-ibtn sr-bell" id="srBell" title="Quoi de neuf" aria-label="Quoi de neuf">'
    +'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>'
    +'<span class="sr-badge" id="srBadge" data-count="0">0</span></button>'
    +'<div class="sr-panel" id="srPanel" role="dialog" aria-label="Quoi de neuf">'
    +'<div class="sr-np-head"><h3>Quoi de neuf</h3>'
    +'<span class="cnt" id="srCount" data-count="0">0 non lus</span>'
    +'<button class="markall" id="srMarkAll">Tout marquer comme lu</button></div>'
    +'<div class="sr-np-list" id="srList">'+notifs+'</div>'
    +'<div class="sr-np-foot"><a href="/outils/">Tout le hub →</a></div>'
    +'</div></div>'
    +'<button class="sr-ibtn sr-theme" id="srTheme" title="Thème clair / sombre" aria-label="Basculer le thème clair / sombre">'
    +'<svg class="ic-light" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>'
    +'<svg class="ic-dark" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z"/></svg></button>'
    +'<a class="sr-ibtn ml" id="srMail" href="mailto:'+MAIL+'" title="M\'écrire (clic = copie l\'adresse)" aria-label="M\'écrire par email">'
    +'<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg></a>'
    +'<a class="sr-ibtn li" href="'+LINKEDIN+'" target="_blank" rel="noopener" title="LinkedIn" aria-label="Profil LinkedIn">'
    +'<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M7 10v8M7 7v.01M12 10v8M12 13a3 3 0 0 1 6 0v5"/></svg></a>'
    +'</div></div>'
    +'<nav class="sr-mainnav" aria-label="Navigation principale">'+nav+'</nav>'
    +'</div></div>';
  }

  function footerHTML(){
    return ''
    +'<div class="sr-footband"><div class="sr-maxw"><footer class="sr-footer">'
    +'<span class="fn">© Sébastien Rivière · 2026</span>'
    +'<span class="fl">'
    +'<a href="/outils/">Outils</a>'
    +'<a href="/outils/mediatheque-ia/">Médiathèque IA</a>'
    +'<a href="/articles/">Articles</a>'
    +'<a href="/a-propos/">À propos</a>'
    +'</span>'
    +'<a class="fbadge" href="/opt-out-ia/" title="Ce site refuse l\'entraînement des IA — comprendre et faire pareil">'
    +'<span class="d"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>Sans entraînement IA</a>'
    +'</footer></div></div>';
  }

  /* --- Thème : appliqué au plus tôt (voir inline dans <head>) puis bouton --- */
  var root=document.documentElement;
  function current(){var a=root.getAttribute('data-theme');if(a)return a;return (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}
  function syncMeta(){if(root.getAttribute('data-theme')){document.querySelectorAll('meta[name=theme-color]').forEach(function(x){x.remove();});var m=document.createElement('meta');m.name='theme-color';m.content=current()==='dark'?'#0f1722':'#e9eef4';document.head.appendChild(m);}}

  function mount(){
    var h=document.getElementById('sr-header');
    var f=document.getElementById('sr-footer');
    if(h){h.outerHTML=headerHTML(h.getAttribute('data-active')||'');}
    if(f){f.outerHTML=footerHTML();}

    /* toast (mail) */
    var toast=document.createElement('span');toast.className='sr-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);

    /* Thème */
    var themeBtn=document.getElementById('srTheme');
    if(themeBtn)themeBtn.addEventListener('click',function(){var next=current()==='dark'?'light':'dark';root.setAttribute('data-theme',next);try{localStorage.setItem('theme',next);}catch(e){}syncMeta();});

    /* Mail : copie l'adresse */
    var mail=document.getElementById('srMail');
    if(mail)mail.addEventListener('click',function(){
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(MAIL).then(function(){
        toast.textContent='Adresse copiée : '+MAIL;toast.classList.add('show');
        clearTimeout(toast._t);toast._t=setTimeout(function(){toast.classList.remove('show');},2600);
      }).catch(function(){});}
    });

    /* Cloche « Quoi de neuf » — état lu persistant */
    var bell=document.getElementById('srBell'),panel=document.getElementById('srPanel'),
        badge=document.getElementById('srBadge'),count=document.getElementById('srCount'),
        items=[].slice.call(document.querySelectorAll('#srList .sr-notif'));
    if(!bell)return;
    var KEY='sr_notifs_read';
    function readSet(){try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){return [];}}
    function saveRead(a){try{localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}}
    function markUI(it,isRead){it.classList.toggle('unread',!isRead);}
    function refresh(){var n=items.filter(function(it){return it.classList.contains('unread');}).length;
      badge.textContent=n;badge.setAttribute('data-count',n);
      count.textContent=n+' non lus';count.setAttribute('data-count',n);}
    var read=readSet();
    items.forEach(function(it){markUI(it,read.indexOf(it.getAttribute('data-id'))>-1);});
    refresh();
    function setRead(id){var r=readSet();if(r.indexOf(id)<0){r.push(id);saveRead(r);}}
    bell.addEventListener('click',function(e){e.stopPropagation();panel.classList.toggle('open');});
    document.addEventListener('click',function(e){if(!panel.contains(e.target)&&!bell.contains(e.target))panel.classList.remove('open');});
    items.forEach(function(it){it.addEventListener('click',function(){setRead(it.getAttribute('data-id'));markUI(it,true);refresh();});});
    document.getElementById('srMarkAll').addEventListener('click',function(e){e.stopPropagation();
      items.forEach(function(it){setRead(it.getAttribute('data-id'));markUI(it,true);});refresh();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
