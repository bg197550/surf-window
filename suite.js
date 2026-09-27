/* Shared Surf / Weather app switcher. Fills <nav class="suite-apps" data-app="surf|weather">. */
(function(){var APPS=[['surf','https://bg197550.github.io/surf-window/','\u224B','Surf'],['weather','https://bg197550.github.io/weather-window/','\u2601','Weather']];
document.querySelectorAll('.suite-apps[data-app]').forEach(function(n){var cur=n.getAttribute('data-app');n.innerHTML=APPS.map(function(a){return '<a class="suite-app" href="'+a[1]+'"'+(a[0]===cur?' aria-current="page"':'')+'><span class="suite-icon" aria-hidden="true">'+a[2]+'</span>'+a[3]+'<span class="suite-long">Window</span></a>'}).join('')})})();

/* Shared "Ask Claude / Ask ChatGPT" panel. Each page sets window.suiteContext = () => ({app, view, text}).
   Opens the question in the viewer's own Claude or ChatGPT (their subscription); nothing is sent anywhere else. */
(function(){
  var MAX_URL_PROMPT=6000,MAX_COPY=24000;
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function clean(t){return String(t||'').replace(/Feed not loading\? ↗|Surfline ↗|Surf Captain ↗|Surf-Forecast ↗|Open [^\n]*↗/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()}
  function build(q,limit){
    var c=(typeof window.suiteContext==='function'&&window.suiteContext())||{app:document.title,view:'',text:document.body.innerText};
    var when=new Date().toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
    var head='I\'m looking at my '+c.app+' dashboard'+(c.view?' ('+c.view+')':'')+' on '+when+'.\n\n'+
      (q?'My question: '+q:'Give me a quick read of what this shows: what stands out, and what should I watch for?')+
      '\n\nAnswer briefly and use the data below. '+(c.note||'')+'\n\n--- What the page shows ---\n';
    var body=clean(c.text),room=limit-head.length,cut=body.length>room;
    return {text:head+(cut?body.slice(0,Math.max(0,room-80))+'\n[…trimmed; the full page data is on my clipboard if you need it]':body),full:head+body.slice(0,MAX_COPY),cut:cut};
  }
  function copy(t){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(function(){return true},function(){return false})}catch(e){}return Promise.resolve(false)}
  function open(which,q,status){
    var p=build(q,MAX_URL_PROMPT),url=which==='claude'?'https://claude.ai/new?q='+encodeURIComponent(p.text):'https://chatgpt.com/?q='+encodeURIComponent(p.text);
    var w=window.open(url,'_blank');if(w){try{w.opener=null}catch(e){}}else{location.href=url}
    copy(p.full).then(function(ok){status.textContent=ok?'Opened '+(which==='claude'?'Claude':'ChatGPT')+'. The page data is also on your clipboard — paste it if the question arrives empty.':'Opened '+(which==='claude'?'Claude':'ChatGPT')+'.'});
  }
  function init(){
    if(document.querySelector('.ask-fab'))return;
    var fab=document.createElement('button');fab.className='ask-fab';fab.type='button';fab.setAttribute('aria-haspopup','dialog');fab.innerHTML='<span aria-hidden="true">✦</span> Ask AI';
    var sheet=document.createElement('div');sheet.className='ask-sheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','Ask about this page');sheet.hidden=true;
    sheet.innerHTML='<div class="ask-head"><b>Ask about this page</b><button type="button" class="ask-close" aria-label="Close">×</button></div>'+
      '<textarea class="ask-q" rows="3" placeholder="e.g. Where should I surf tomorrow morning? — or leave blank for a quick read"></textarea>'+
      '<div class="ask-actions"><button type="button" class="ask-go" data-ai="claude">Ask Claude</button><button type="button" class="ask-go" data-ai="chatgpt">Ask ChatGPT</button></div>'+
      '<p class="ask-status">Sends the question plus what\'s on this page to your own Claude or ChatGPT account.</p>';
    document.body.appendChild(fab);document.body.appendChild(sheet);
    var q=sheet.querySelector('.ask-q'),status=sheet.querySelector('.ask-status');
    function show(v){sheet.hidden=!v;fab.setAttribute('aria-expanded',String(v));if(v)q.focus()}
    fab.onclick=function(){show(sheet.hidden)};sheet.querySelector('.ask-close').onclick=function(){show(false)};
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!sheet.hidden)show(false)});
    sheet.querySelectorAll('.ask-go').forEach(function(b){b.onclick=function(){open(b.getAttribute('data-ai'),q.value.trim(),status)}});
    q.addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))open('claude',q.value.trim(),status)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
