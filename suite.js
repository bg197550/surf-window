/* Shared Surf / Weather app switcher. Fills <nav class="suite-apps" data-app="surf|weather">. */
(function(){var APPS=[['weather','https://bg197550.github.io/weather-window/','\u2601','Weather'],['surf','https://bg197550.github.io/surf-window/','\u224B','Surf'],['snow','https://bg197550.github.io/weather-window/snow/','\u2744','Snow']];
document.querySelectorAll('.suite-apps[data-app]').forEach(function(n){var cur=n.getAttribute('data-app');n.innerHTML=APPS.map(function(a){return '<a class="suite-app" href="'+a[1]+'"'+(a[0]===cur?' aria-current="page"':'')+'><span class="suite-icon" aria-hidden="true">'+a[2]+'</span>'+a[3]+'</a>'}).join('')})})();

/* Shared "Ask AI" panel, opened from the app bar (no floating button).
   Each page sets window.suiteContext = () => ({app, view, text, note}).
   In-page answers come from Gemini through the Cloudflare Worker at AI_URL (free tier); when AI_URL is empty
   only the "Open in Claude / ChatGPT" hand-offs are shown. */
(function(){
  var AI_URL='https://window-ai.bgandel.workers.dev';
  var MAX_URL_PROMPT=6000,MAX_COPY=24000,MAX_CTX=30000,log=[];
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function fmt(t){return esc(t).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/^\s*[-*•]\s+/gm,'• ').replace(/\n/g,'<br>')}
  function clean(t){return String(t||'').replace(/Feed not loading\? ↗|Surfline ↗|Surf Captain ↗|Surf-Forecast ↗|Open [^\n]*↗/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()}
  function ctx(q){var c=(typeof window.suiteContext==='function'&&window.suiteContext(q))||{app:document.title,view:'',text:document.body.innerText};function finish(v){v.text=clean(v.text);return v}return c&&typeof c.then==='function'?c.then(finish):finish(c)}
  function handoff(q,limit){var c=ctx(),when=new Date().toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
    var head='I\'m looking at my '+c.app+' dashboard'+(c.view?' ('+c.view+')':'')+' on '+when+'.\n\n'+(q?'My question: '+q:'Give me a quick read of what this shows: what stands out, and what should I watch for?')+'\n\nAnswer briefly and use the data below. '+(c.note||'')+'\n\n--- What the page shows ---\n';
    var room=limit-head.length,cut=c.text.length>room;return {text:head+(cut?c.text.slice(0,Math.max(0,room-80))+'\n[…trimmed; the full page data is on my clipboard if you need it]':c.text),full:head+c.text.slice(0,MAX_COPY)}}
  function copy(t){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(function(){return true},function(){return false})}catch(e){}return Promise.resolve(false)}
  function openApp(which,q,status){var p=handoff(q,MAX_URL_PROMPT),url=which==='claude'?'https://claude.ai/new?q='+encodeURIComponent(p.text):'https://chatgpt.com/?q='+encodeURIComponent(p.text);
    var w=window.open(url,'_blank');if(w){try{w.opener=null}catch(e){}}else{location.href=url}
    copy(p.full).then(function(ok){status.textContent='Opened '+(which==='claude'?'Claude':'ChatGPT')+(ok?'. The page data is also on your clipboard if the question arrives empty.':'.')})}
  function init(){
    var bar=document.querySelector('.suite-inner');if(!bar||document.querySelector('.ask-btn'))return;
    var btn=document.createElement('button');btn.className='ask-btn';btn.type='button';btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-expanded','false');btn.innerHTML='<span aria-hidden="true">✦</span> Ask<span class="suite-long">AI</span>';
    var meta=bar.querySelector('.suite-meta');bar.insertBefore(btn,meta||null);
    var sheet=document.createElement('div');sheet.className='ask-sheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','Ask about this page');sheet.hidden=true;
    sheet.innerHTML='<div class="ask-head"><b>Ask about this page</b><span><button type="button" class="ask-clear" hidden>Clear</button><button type="button" class="ask-close" aria-label="Close">×</button></span></div>'+
      '<div class="ask-log" aria-live="polite"></div>'+
      '<textarea class="ask-q" rows="2" placeholder="e.g. Where should I surf tomorrow morning?"></textarea>'+
      (AI_URL?'<div class="ask-actions"><button type="button" class="ask-send">Ask</button></div><div class="ask-alt">Need outside sources? Open in <button type="button" class="ask-link" data-ai="claude">Claude ↗</button> · <button type="button" class="ask-link" data-ai="chatgpt">ChatGPT ↗</button></div><p class="ask-status">Answered by Gemini using the current view and relevant Weather forecasts when available.</p>'
             :'<div class="ask-actions"><button type="button" class="ask-go" data-ai="claude">Ask Claude</button><button type="button" class="ask-go" data-ai="chatgpt">Ask ChatGPT</button></div><p class="ask-status">Opens your question with this page\'s data in your own Claude or ChatGPT account.</p>');
    document.body.appendChild(sheet);
    var q=sheet.querySelector('.ask-q'),status=sheet.querySelector('.ask-status'),logEl=sheet.querySelector('.ask-log'),clear=sheet.querySelector('.ask-clear'),busy=false;
    function show(v){sheet.hidden=!v;btn.setAttribute('aria-expanded',String(v));if(v)q.focus()}
    function draw(){logEl.innerHTML=log.map(function(m){return '<div class="ask-msg '+(m.role==='user'?'me':'ai')+(m.error?' err':'')+'">'+fmt(m.content)+(m.sources&&m.sources.length?'<div class="ask-src">Sources: '+m.sources.slice(0,5).map(function(x){return '<a href="'+esc(x.uri)+'" target="_blank" rel="noopener">'+esc(x.title||x.uri)+'</a>'}).join(' · ')+'</div>':'')+'</div>'}).join('');logEl.hidden=!log.length;clear.hidden=!log.length;logEl.scrollTop=logEl.scrollHeight}
    function send(){var text=q.value.trim()||'Give me a quick read of this page: what stands out and what should I watch for?';if(busy)return;busy=true;
      log.push({role:'user',content:text});log.push({role:'assistant',content:'Thinking…',pending:true});q.value='';draw();
      var msgs=log.filter(function(m){return !m.pending&&!m.error}).map(function(m){return {role:m.role,content:m.content}});
      Promise.resolve().then(function(){return ctx(text)}).then(function(c){return fetch(AI_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({app:c.app,view:c.view,note:c.note||'',context:c.text.slice(0,MAX_CTX),messages:msgs})})})
        .then(function(r){return r.json().catch(function(){return {error:'Unexpected response'}}).then(function(d){return {ok:r.ok,d:d}})})
        .then(function(x){log.pop();log.push(x.ok&&x.d.text?{role:'assistant',content:x.d.text,sources:x.d.sources}:{role:'assistant',content:x.d.error||'Something went wrong. Try again.',error:true})})
        .catch(function(){log.pop();log.push({role:'assistant',content:'Couldn\'t reach the AI service. Check your connection and try again.',error:true})})
        .then(function(){busy=false;draw()})}
    btn.onclick=function(){show(sheet.hidden)};sheet.querySelector('.ask-close').onclick=function(){show(false)};
    clear.onclick=function(){log=[];draw();q.focus()};
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!sheet.hidden)show(false)});
    document.addEventListener('click',function(e){if(!sheet.hidden&&!sheet.contains(e.target)&&!btn.contains(e.target))show(false)});
    sheet.querySelectorAll('[data-ai]').forEach(function(b){b.onclick=function(){openApp(b.getAttribute('data-ai'),q.value.trim(),status)}});
    var sendBtn=sheet.querySelector('.ask-send');if(sendBtn)sendBtn.onclick=send;
    q.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&AI_URL){e.preventDefault();send()}});
    draw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
