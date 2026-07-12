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
    {id:"biocomputing-2026-07-11", tint:"--t-art", lab:"Enquête", ttl:"Des neurones humains dans nos ordinateurs", when:"11 juil.", href:"/articles/des-neurones-humains-dans-nos-ordinateurs/"},
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

  /* --- Lecteur audio « résumé » réutilisable (.sr-audio) + puce (.sr-cue) --- */
  function fmtT(t){t=Math.max(0,t|0);var m=(t/60)|0,s=t%60;return m+':'+(s<10?'0':'')+s;}
  function buildAudio(){
    [].slice.call(document.querySelectorAll('.sr-audio')).forEach(function(el){
      if(el._built)return;el._built=true;
      var title=el.getAttribute('data-title')||'Résumé audio';
      var note=el.getAttribute('data-note')||'';
      var dur=el.getAttribute('data-dur')||'';
      var a=new Audio();a.preload='none';a.src=el.getAttribute('data-src')||'';
      el.innerHTML='<button class="sra-btn" type="button" aria-label="Lire ou mettre en pause">'
        +'<svg class="sra-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
        +'<svg class="sra-pause" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg></button>'
        +'<div class="sra-body"><div class="sra-top"><span class="sra-title">'+title+'</span>'
        +(note?'<span class="sra-info" tabindex="0" role="button" aria-label="À propos de cet audio">i<span class="sra-tip">'+note+'</span></span>':'')
        +'</div><div class="sra-row"><div class="sra-bar" role="slider" tabindex="0" aria-label="Position de lecture"><div class="sra-prog"></div></div>'
        +'<span class="sra-time">'+(dur?('0:00 / '+dur):'')+'</span></div></div>';
      var btn=el.querySelector('.sra-btn'),bar=el.querySelector('.sra-bar'),
          prog=el.querySelector('.sra-prog'),time=el.querySelector('.sra-time');
      function up(){var d=a.duration||0,c=a.currentTime||0;if(d){prog.style.width=(c/d*100)+'%';time.textContent=fmtT(c)+' / '+fmtT(d);}}
      btn.addEventListener('click',function(){if(a.paused){var pp=a.play();if(pp&&pp.catch){pp.catch(function(){});}}else{a.pause();}});
      var info=el.querySelector('.sra-info');
      if(info){info.addEventListener('click',function(){info.classList.toggle('open');});}
      a.addEventListener('play',function(){el.classList.add('playing');});
      a.addEventListener('pause',function(){el.classList.remove('playing');});
      a.addEventListener('ended',function(){el.classList.remove('playing');});
      a.addEventListener('timeupdate',up);a.addEventListener('loadedmetadata',up);
      bar.addEventListener('click',function(e){var r=bar.getBoundingClientRect();var p=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));if(a.duration){a.currentTime=p*a.duration;}});
      el._audio=a;
    });
    [].slice.call(document.querySelectorAll('.sr-cue[data-audio]')).forEach(function(c){
      if(c._wired)return;c._wired=true;
      c.addEventListener('click',function(e){e.preventDefault();
        var t=document.getElementById(c.getAttribute('data-audio'));if(!t)return;
        t.scrollIntoView({behavior:'smooth',block:'center'});
        if(t._audio&&t._audio.paused){t._audio.play();}});
    });
  }

  /* --- Thème : appliqué au plus tôt (voir inline dans <head>) puis bouton --- */
  var root=document.documentElement;
  function current(){var a=root.getAttribute('data-theme');if(a)return a;return (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}
  function syncMeta(){if(root.getAttribute('data-theme')){document.querySelectorAll('meta[name=theme-color]').forEach(function(x){x.remove();});var m=document.createElement('meta');m.name='theme-color';m.content=current()==='dark'?'#0f1722':'#e9eef4';document.head.appendChild(m);}}

  function buildShare(toast){
    var triggers=[].slice.call(document.querySelectorAll('[data-share]'));
    if(!triggers.length)return;
    var menu=null,curBtn=null;
    var NETS=[
      ['x','X (Twitter)','<svg viewBox="0 0 24 24"><path d="M18.24 2h3.3l-7.2 8.23L22.98 22h-6.63l-5.2-6.8L5.2 22H1.9l7.7-8.8L1.02 2h6.8l4.7 6.22L18.24 2zm-1.16 18h1.83L7.01 3.88H5.05L17.08 20z"/></svg>'],
      ['li','LinkedIn','<svg viewBox="0 0 24 24"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5zM3 9h4v12H3zM9 9h3.8v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z"/></svg>'],
      ['fb','Facebook','<svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>'],
      ['wa','WhatsApp','<svg viewBox="0 0 24 24"><path d="M20.5 3.5A11.85 11.85 0 0 0 3.6 20L2 22.6l2.72-1.55A11.85 11.85 0 1 0 20.5 3.5zM12 21.3c-1.7 0-3.36-.46-4.82-1.32l-.35-.2-2.86.82.83-2.78-.22-.36A9.6 9.6 0 1 1 12 21.3zm5.3-7.18c-.29-.15-1.72-.85-1.98-.94-.27-.1-.46-.15-.65.14-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.65-1.57-.89-2.15-.24-.56-.48-.49-.65-.5h-.56c-.19 0-.5.07-.77.36-.26.29-1.01.99-1.01 2.41s1.04 2.8 1.18 2.99c.15.19 2.04 3.12 4.95 4.37.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34z"/></svg>'],
      ['copy','Copier le lien','<svg viewBox="0 0 24 24"><path d="M3.9 12a2.1 2.1 0 0 1 2.1-2.1h4V8H6a4 4 0 0 0 0 8h4v-1.9H6A2.1 2.1 0 0 1 3.9 12zM14 8h-4v1.9h4a2.1 2.1 0 0 1 0 4.2h-4V16h4a4 4 0 0 0 0-8zm-6 3h8v2H8z"/></svg>']
    ];
    function makeMenu(){
      menu=document.createElement('div');menu.className='sr-sharemenu';menu.setAttribute('role','menu');
      menu.innerHTML=NETS.map(function(n){return '<button type="button" role="menuitem" data-net="'+n[0]+'">'+n[1]+'<span>'+n[2]+'</span></button>';}).join('');
      document.body.appendChild(menu);
      menu.addEventListener('click',function(e){var b=e.target.closest('[data-net]');if(!b)return;doNet(b.getAttribute('data-net'));closeMenu();});
    }
    function placeMenu(btn){
      var r=btn.getBoundingClientRect();menu.style.visibility='hidden';menu.classList.add('open');
      var mw=menu.offsetWidth,mh=menu.offsetHeight;
      var left=Math.max(8,Math.min(r.right-mw,window.innerWidth-mw-8));
      var top=r.bottom+6;if(top+mh>window.innerHeight-8)top=Math.max(8,r.top-mh-6);
      menu.style.left=left+'px';menu.style.top=top+'px';menu.style.visibility='';
    }
    function openMenu(btn){if(!menu)makeMenu();curBtn=btn;placeMenu(btn);menu.classList.add('open');}
    function closeMenu(){if(menu)menu.classList.remove('open');curBtn=null;}
    function doNet(net){
      if(!curBtn)return;var u=curBtn.__u,t=curBtn.__t;
      if(net==='copy'){
        if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){
          toast.textContent='Lien copié';toast.classList.add('show');
          clearTimeout(toast._t);toast._t=setTimeout(function(){toast.classList.remove('show');},2200);
        }).catch(function(){});}
        return;
      }
      var eu=encodeURIComponent(u),et=encodeURIComponent(t),url;
      if(net==='x')url='https://twitter.com/intent/tweet?url='+eu+'&text='+et;
      else if(net==='li')url='https://www.linkedin.com/sharing/share-offsite/?url='+eu;
      else if(net==='fb')url='https://www.facebook.com/sharer/sharer.php?u='+eu;
      else if(net==='wa')url='https://wa.me/?text='+et+'%20'+eu;
      if(url)window.open(url,'_blank','noopener,noreferrer,width=600,height=540');
    }
    document.addEventListener('click',function(e){if(menu&&menu.classList.contains('open')&&!menu.contains(e.target))closeMenu();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu();});
    window.addEventListener('scroll',function(){closeMenu();},true);
    window.addEventListener('resize',function(){closeMenu();});
    triggers.forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        var u=btn.getAttribute('data-share-url')||'';
        if(!u){var a=btn.closest('a[href]');u=a?a.href:location.href;}
        else if(u.indexOf('http')!==0){u=location.origin+u;}
        var t=btn.getAttribute('data-share-title')||document.title;
        btn.__u=u;btn.__t=t;
        if(navigator.share){navigator.share({title:t,url:u}).catch(function(err){if(err&&err.name==='AbortError')return;openMenu(btn);});}
        else{openMenu(btn);}
      });
    });
  }

  function mount(){
    var h=document.getElementById('sr-header');
    var f=document.getElementById('sr-footer');
    if(h){h.outerHTML=headerHTML(h.getAttribute('data-active')||'');}
    if(f){f.outerHTML=footerHTML();}

    buildAudio();

    /* toast (mail) */
    var toast=document.createElement('span');toast.className='sr-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);

    /* Partage — natif (navigator.share) sinon menu de repli */
    buildShare(toast);

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
