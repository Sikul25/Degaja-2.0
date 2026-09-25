(() => {
  'use strict';
  const $ = (s,r=document) => r.querySelector(s);
  const CREDIT_KEY = 'degajaVoiceCredits';
  const SESSION_KEY = 'degajaVoiceSession';
  const ADVISOR_KEY = 'degajaSelectedAdvisor';
  // Fallback data only — the real source of truth is GET /api/advisors,
  // which shares its data with the checkout and oracle endpoints (api/_data.js).
  // Used only if that request fails (e.g. offline).
  let prices = {15:'29,99',30:'59,99',60:'99,99'};
  const fallbackAdvisors = [
    {id:'papuli',name:'Papuli',title:'Tarot, Astrologie & Zukunft'}
  ];
  let remoteAdvisors = null;
  const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const t = key => (window.degajaI18n ? window.degajaI18n.t(key) : key);
  const lang = () => (window.degajaI18n ? window.degajaI18n.getLang() : 'de');
  const fmt = (tpl, vars) => Object.keys(vars).reduce((s,k)=>s.replace(`{${k}}`, vars[k]), tpl);
  const getCredits = () => Math.max(0, Number(localStorage.getItem(CREDIT_KEY)||0));
  const setCredits = n => localStorage.setItem(CREDIT_KEY,String(Math.max(0,n)));
  const getUser = () => { try{return JSON.parse(localStorage.getItem('degajaUser')||'null')}catch(_){return null} };
  const doFetch = (url,opts,ms) => (window.degajaFetch ? window.degajaFetch(url,opts,ms) : fetch(url,opts));
  const getAdvisors = () => (remoteAdvisors && remoteAdvisors.length ? remoteAdvisors : fallbackAdvisors);

  async function loadRemoteData(){
    try{
      const currency = lang() === 'br' ? 'brl' : '';
      const r = await doFetch('/api/advisors' + (currency ? `?currency=${currency}` : ''), {}, 8000);
      if(!r.ok) return;
      const d = await r.json();
      if(Array.isArray(d.advisors) && d.advisors.length) remoteAdvisors = d.advisors.filter(a=>a&&a.active!==false);
      if(d.prices && typeof d.prices === 'object') prices = { ...prices, ...d.prices };
    }catch(_){ /* keep fallback data */ }
  }
  const getSelectedAdvisor = () => {
    const list=getAdvisors();
    let id=''; try{id=String(JSON.parse(localStorage.getItem(ADVISOR_KEY)||'null')?.id||'')}catch(_){ }
    return list.find(a=>String(a.id)===id) || list[0];
  };
  const setSelectedAdvisor = id => {
    const a=getAdvisors().find(x=>String(x.id)===String(id));
    if(a)localStorage.setItem(ADVISOR_KEY,JSON.stringify({id:a.id,name:a.name,title:a.title}));
    return a || getSelectedAdvisor();
  };

  function style(){
    if($('#degajaLiveStyle')) return;
    const s=document.createElement('style'); s.id='degajaLiveStyle';
    s.textContent=`.degaja-live{margin:28px auto 0;padding:24px;max-width:900px;text-align:left;background:rgba(255,255,255,.95);border:1px solid rgba(184,147,70,.28);border-radius:24px;box-shadow:0 16px 45px rgba(31,65,95,.08)}.degaja-live h3{margin:5px 0;color:#18334a;font-size:24px}.degaja-live-head{display:flex;justify-content:space-between;gap:15px;align-items:center;flex-wrap:wrap}.degaja-live-badge{padding:7px 11px;border-radius:999px;background:#f1f8f4;color:#3f7455;font-size:11px;font-weight:800}.degaja-live-status{padding:7px 11px;border-radius:999px;font-size:11px;font-weight:800;display:none}.degaja-live-status.on{display:inline-block;background:#eafaf0;color:#2f8f5b}.degaja-live-status.off{display:inline-block;background:#f2f3f5;color:#7c8592}.degaja-notify{margin-top:16px;padding-top:16px;border-top:1px solid rgba(24,51,74,.08)}.degaja-notify input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d7e0e6;border-radius:12px;margin:8px 0}.degaja-live-copy{color:#687384;line-height:1.6;font-size:14px}.degaja-live-actions{display:flex;gap:10px;flex-wrap:wrap}.degaja-live button{border:0;border-radius:999px;padding:12px 18px;font-weight:800;cursor:pointer}.degaja-live .gold{background:#b88a32;color:#fff}.degaja-live .dark{background:#18334a;color:#fff}.degaja-live .soft{background:#18334a;color:#fff}#degajaLiveMainActions{flex-direction:column}#degajaLiveMainActions button{width:100%;box-sizing:border-box;text-align:center}.degaja-live-credit{font-size:12px;color:#7b8490;margin-top:12px}.degaja-call{margin-top:16px}.degaja-call-panel{padding:18px;border-radius:20px;background:#f6f9fb;border:1px solid rgba(24,51,74,.08)}.degaja-code{font-size:30px;letter-spacing:.18em;font-weight:900;text-align:center;color:#18334a;background:#fff;border:1px dashed rgba(184,147,70,.5);border-radius:16px;padding:14px;margin:12px 0}.degaja-status{font-size:13px;color:#687384;min-height:20px}.degaja-call audio{width:100%;margin-top:10px}.degaja-consult-options{display:grid;gap:9px;margin-top:12px}.degaja-consult-option{display:flex!important;align-items:center;justify-content:space-between;text-align:left!important;width:100%;background:#fbfeff;color:#18334a;border:1px solid #dfeef4!important}.degaja-consult-option small{display:block;color:#74808d;margin-top:3px}.degaja-consult-option b{color:#b88a32}.degaja-advisor{display:none;margin-top:15px;padding:18px;border-radius:18px;background:#fffdf8;border:1px solid rgba(184,147,70,.28)}.degaja-advisor.show{display:block}.degaja-advisor input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d7e0e6;border-radius:12px;margin:8px 0}.degaja-privacy{font-size:11px;color:#8a91a0;line-height:1.5;margin-top:12px}.degaja-advisor-picker{margin-top:16px}.degaja-advisor-picker label{display:block;font-size:12px;font-weight:800;color:#18334a;margin-bottom:7px}.degaja-advisor-picker select{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #d7e0e6;border-radius:12px;background:#fff;color:#18334a;font-weight:700}.degaja-transcript{margin-top:14px;padding:14px;border-radius:16px;background:#fbfbf7;border:1px solid rgba(184,147,70,.25)}.degaja-transcript-head{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;color:#18334a;margin-bottom:8px}.degaja-transcript-note{font-weight:600;color:#8a91a0;font-size:11px}.degaja-transcript-lines{max-height:160px;overflow:auto;display:flex;flex-direction:column;gap:6px}.degaja-transcript-line{font-size:13px;line-height:1.5;color:#48566a;background:#fff;border:1px solid #eef1f4;border-radius:10px;padding:7px 10px}.degaja-transcript-line b{color:#18334a}@media(max-width:650px){.degaja-live{padding:18px;border-radius:20px}.degaja-code{font-size:25px}.degaja-transcript-lines{max-height:120px}}`;
    document.head.appendChild(s);
  }

  function advisorTitle(a){
    const key = 'advisor.' + a.id + '.title';
    const translated = t(key);
    return translated === key ? a.title : translated;
  }

  function advisorOptions(){
    return getAdvisors().map(a=>{
      const dot = typeof a.available === 'boolean' ? (a.available ? '🟢 ' : '⚪ ') : '';
      return `<option value="${esc(a.id)}">${dot}${esc(a.name)} — ${esc(advisorTitle(a))}</option>`;
    }).join('');
  }

  function statusText(){
    const el=$('#degajaLiveStatus'); if(!el) return;
    const a=getSelectedAdvisor();
    if (typeof a.available !== 'boolean') { el.className='degaja-live-status'; el.textContent=''; return; }
    el.className = 'degaja-live-status ' + (a.available ? 'on' : 'off');
    el.textContent = a.available ? t('live.onlineNow') : t('live.offlineNow');
  }

  function getRecognitionCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null}

  function attachTranscript(container){
    if(!container) return null;
    container.style.display='block';
    const linesId=container.id+'Lines';
    container.innerHTML=`<div class="degaja-transcript-head"><span>${t('live.transcriptTitle')}</span><span class="degaja-transcript-note">${t('live.transcriptNote')}</span></div><div class="degaja-transcript-lines" id="${linesId}"></div>`;
    const lines=document.getElementById(linesId);
    return {
      addLine(label,text){
        if(!lines||!text) return;
        lines.insertAdjacentHTML('beforeend',`<div class="degaja-transcript-line"><b>${esc(label)}:</b> ${esc(text)}</div>`);
        lines.scrollTop=lines.scrollHeight;
      },
      clear(){ if(lines) lines.innerHTML=''; }
    };
  }

  function startRecognition(onFinal){
    const Ctor=getRecognitionCtor();
    if(!Ctor) return null;
    const rec=new Ctor();
    rec.lang=t('speech.langCode');
    rec.continuous=true;
    rec.interimResults=false;
    let active=true;
    rec.onresult=e=>{
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal){
          const text=e.results[i][0].transcript.trim();
          if(text) onFinal(text);
        }
      }
    };
    rec.onend=()=>{ if(active){ try{rec.start()}catch(_){} } };
    rec.onerror=()=>{};
    try{ rec.start(); }catch(_){}
    return { stop(){ active=false; try{rec.stop()}catch(_){} } };
  }

  function card(){
    if($('#degajaLiveConsult')) return;
    const wrap=$('#human .human-wrap'); if(!wrap) return;
    const selected=getSelectedAdvisor();
    const el=document.createElement('div'); el.id='degajaLiveConsult'; el.className='degaja-live';
    el.innerHTML=`<div class="degaja-live-head"><div><div class="eyebrow">${t('live.eyebrow')}</div><h3>${t('live.title')}</h3></div><span class="degaja-live-status" id="degajaLiveStatus"></span><span class="degaja-live-badge">${t('live.badge')}</span></div><p class="degaja-live-copy">${t('live.intro')}</p><div class="degaja-advisor-picker"><label for="degajaAdvisorSelect">${t('live.advisorLabel')}</label><select id="degajaAdvisorSelect">${advisorOptions()}</select></div><div class="degaja-live-actions" id="degajaLiveMainActions" style="margin-top:12px"><button class="gold" id="degajaLiveStart">${t('live.startBtn')}</button><button class="soft" id="degajaAdvisorToggle">${t('live.advisorAccessBtn')}</button></div><div class="degaja-live-credit" id="degajaLiveCredit"></div><div class="degaja-call" id="degajaCall"></div><div class="degaja-advisor" id="degajaAdvisor"><h4 style="color:#18334a">${t('live.advisorAccessTitle')}</h4><p class="degaja-live-copy">${t('live.advisorAccessDesc')}</p><input id="degajaAdvisorCode" maxlength="6" inputmode="numeric" placeholder="${t('live.sessionCodePlaceholder')}"><button class="dark" id="degajaAdvisorJoin">${t('live.acceptCallBtn')}</button><div class="degaja-status" id="degajaAdvisorStatus"></div><audio id="degajaAdvisorAudio" autoplay controls></audio><div class="degaja-transcript" id="degajaAdvisorTranscript" style="display:none"></div></div><div class="degaja-privacy">${t('live.privacyFooter')}</div>`;
    wrap.appendChild(el);
    const select=$('#degajaAdvisorSelect'); if(select)select.value=selected.id;
    select?.addEventListener('change',()=>{setSelectedAdvisor(select.value);statusText();});
    $('#degajaLiveStart').onclick=start;
    $('#degajaAdvisorToggle').onclick=()=>$('#degajaAdvisor').classList.toggle('show');
    $('#degajaAdvisorJoin').onclick=advisorJoin;
    creditText();
    statusText();
  }

  function creditText(){const e=$('#degajaLiveCredit');if(!e)return;const c=getCredits(),a=getSelectedAdvisor();e.textContent=c?fmt(t(c===1?'live.creditSingular':'live.creditPlural'),{c,name:a.name}):t('live.noCredit');}

  function start(){
    const u=getUser(), host=$('#degajaCall'); if(!host)return;
    if(!u){host.innerHTML=`<div class="degaja-call-panel"><b>${t('live.pleaseSignIn')}</b><p class="degaja-live-copy">${t('live.pleaseSignInDesc')}</p></div>`;return;}
    const a=getSelectedAdvisor();
    if(a.available===false){
      host.innerHTML=`<div class="degaja-call-panel"><h4 style="color:#18334a">${t('live.notAvailableTitle')}</h4><p class="degaja-live-copy">${fmt(t('live.notAvailableDesc'),{name:esc(a.name)})}</p><a href="#oracle" class="dark" style="display:inline-block;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:800">${t('live.tryOracleBtn')}</a><div class="degaja-notify"><p class="degaja-live-copy">${fmt(t('live.leaveContactLabel'),{name:esc(a.name)})}</p><input id="degajaNotifyContact" maxlength="120" placeholder="${t('live.leaveContactPlaceholder')}"><button class="soft" id="degajaNotifyBtn">${t('live.leaveContactBtn')}</button><div class="degaja-status" id="degajaNotifyStatus"></div></div></div>`;
      $('#degajaNotifyBtn').onclick=async()=>{
        const input=$('#degajaNotifyContact'),status=$('#degajaNotifyStatus');
        const contact=input?.value.trim();
        if(!contact){status.textContent=t('live.leaveContactPlaceholder');return}
        status.textContent='…';
        try{
          const r=await doFetch('/api/notify-interest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({advisorId:a.id,contact,lang:lang()})},8000);
          if(!r.ok)throw new Error('failed');
          status.textContent=t('live.leaveContactSent');input.value=''
        }catch(_){status.textContent=t('live.leaveContactFail')}
      };
      return;
    }
    const c=getCredits();
    const liveAudioWith=fmt(t('live.liveAudioWith'),{name:esc(a.name)});
    const cur=t('currency.symbol');
    host.innerHTML=`<div class="degaja-call-panel"><h4 style="color:#18334a">${fmt(t('live.withName'),{name:esc(a.name)})}</h4><p class="degaja-live-copy">${esc(a.title)} · ${c?t('live.hasCredit'):t('live.chooseDuration')}</p>${c?`<button class="gold" id="degajaUseCredit">${t('live.useCredit')}</button>`:''}<div class="degaja-consult-options"><button class="degaja-consult-option" data-duration="15"><span><strong>${t('live.duration15')}</strong><small>${liveAudioWith}</small></span><b>${cur}${prices[15]}</b></button><button class="degaja-consult-option" data-duration="30"><span><strong>${t('live.duration30')}</strong><small>${liveAudioWith}</small></span><b>${cur}${prices[30]}</b></button><button class="degaja-consult-option" data-duration="60"><span><strong>${t('live.duration60')}</strong><small>${liveAudioWith}</small></span><b>${cur}${prices[60]}</b></button></div><div class="degaja-status">${esc(u.name||u.email)}</div></div>`;
    $('#degajaUseCredit')?.addEventListener('click',()=>{setCredits(getCredits()-1);creditText();call('credit',60,a)});
    host.querySelectorAll('[data-duration]').forEach(b=>b.addEventListener('click',()=>checkout(Number(b.dataset.duration),a)));
  }

  async function checkout(duration,advisor){
    const u=getUser(); if(!u||!advisor)return;
    try{const r=await doFetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:'voice',duration,email:u.email,name:u.name||'',advisorId:advisor.id,lang:lang(),ref:window.degajaI18n?window.degajaI18n.getRef():''})},15000);const d=await r.json();if(!r.ok||!d.url)throw new Error(d.error||'Checkout');localStorage.setItem(SESSION_KEY,JSON.stringify({type:'voice',duration,advisorId:advisor.id}));location.href=d.url}catch(_){const e=$('#degajaCall');if(e)e.innerHTML=`<div class="degaja-call-panel"><b>${t('live.checkoutFailTitle')}</b><p class="degaja-live-copy">${t('live.checkoutFailDesc')}</p></div>`;}
  }

  async function verify(){
    const p=new URLSearchParams(location.search), id=p.get('session_id'); if(p.get('payment')!=='success'||!id)return;
    try{const r=await doFetch('/api/verify-payment?session_id='+encodeURIComponent(id),{},15000);const d=await r.json();if(!r.ok||!d.paid||d.type!=='voice')throw new Error('not paid');const advisor=d.advisorId?setSelectedAdvisor(d.advisorId):getSelectedAdvisor();localStorage.setItem('degajaPaidVoice','1');localStorage.setItem(SESSION_KEY,JSON.stringify({type:'voice',duration:d.duration||60,advisorId:advisor.id,sessionId:id,verifiedAt:Date.now()}));history.replaceState({},document.title,location.pathname+location.hash);call('paid',d.duration||60,advisor)}catch(_){console.warn('DEGAJA payment verification failed');}
  }

  function peerScript(){return new Promise((ok,no)=>{if(window.Peer)return ok();const s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}

  async function call(source,duration,advisor=getSelectedAdvisor()){
    const host=$('#degajaCall');if(!host)return;
    const sourceLabel=source==='credit'?t('live.creditUsedLabel'):t('live.paymentConfirmedLabel');
    host.innerHTML=`<div class="degaja-call-panel"><h4 style="color:#18334a">${fmt(t('live.connectionTitle'),{name:esc(advisor.name)})}</h4><div class="degaja-status">${esc(advisor.title)}</div><div class="degaja-code" id="degajaCode">------</div><div class="degaja-status" id="degajaStatus">${t('live.micPreparing')}</div><div class="degaja-live-actions" style="margin-top:12px"><button class="dark" id="degajaMute">${t('live.muteBtn')}</button><button style="background:#a34d4d;color:#fff" id="degajaEnd">${t('live.endBtn')}</button></div><audio id="degajaRemoteAudio" autoplay controls></audio><div class="degaja-transcript" id="degajaTranscript" style="display:none"></div><div class="degaja-privacy">${fmt(t('live.privacyNote'),{duration,sourceLabel,name:esc(advisor.name)})}</div></div>`;
    try{
      await peerScript();
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      const code=String(Math.floor(100000+Math.random()*900000));
      const peer=new Peer('degaja-'+code);
      window.__degajaPeer=peer;window.__degajaStream=stream;
      $('#degajaCode').textContent=code;
      $('#degajaStatus').textContent=t('live.waitingAdvisor');
      const u=getUser();
      doFetch('/api/notify-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({advisorId:advisor.id,code,customerName:u?.name||u?.email||''})},8000).catch(()=>{});
      const transcript=attachTranscript($('#degajaTranscript'));
      peer.on('call',c=>{c.answer(stream);c.on('stream',remote=>{$('#degajaRemoteAudio').srcObject=remote;$('#degajaStatus').textContent=t('live.liveConnected')})});
      peer.on('connection',conn=>{
        window.__degajaConn=conn;
        conn.on('data',text=>transcript?.addLine(advisor.name,text));
        conn.on('open',()=>{
          window.__degajaRecognition=startRecognition(text=>{transcript?.addLine(t('live.you'),text);conn.send(text)});
        });
      });
      peer.on('error',e=>$('#degajaStatus').textContent=t('live.connectionFailed')+(e.type||'Error'));
      $('#degajaMute').onclick=()=>{const track=stream.getAudioTracks()[0];track.enabled=!track.enabled;$('#degajaMute').textContent=track.enabled?t('live.muteBtn'):t('live.unmuteBtn')};
      $('#degajaEnd').onclick=end
    }catch(_){$('#degajaStatus').textContent=t('live.micUnavailable')}
  }

  async function advisorJoin(){
    const code=$('#degajaAdvisorCode')?.value.trim(), status=$('#degajaAdvisorStatus'), audio=$('#degajaAdvisorAudio');if(!/^\d{6}$/.test(code)){status.textContent=t('live.enterCodePrompt');return}
    try{
      await peerScript();
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      const peer=new Peer();
      window.__degajaAdvisorPeer=peer;window.__degajaAdvisorStream=stream;
      const transcript=attachTranscript($('#degajaAdvisorTranscript'));
      peer.on('open',()=>{
        const c=peer.call('degaja-'+code,stream);
        c?.on('stream',remote=>{audio.srcObject=remote;status.textContent=t('live.liveConnected')});
        c?.on('close',()=>{status.textContent=t('live.callEnded');window.__degajaAdvisorRecognition?.stop();window.__degajaAdvisorConn?.close();const l=document.getElementById('degajaAdvisorTranscriptLines');if(l)l.innerHTML=''});
        const conn=peer.connect('degaja-'+code);
        window.__degajaAdvisorConn=conn;
        conn.on('data',text=>transcript?.addLine(t('live.customer'),text));
        conn.on('open',()=>{
          window.__degajaAdvisorRecognition=startRecognition(text=>{transcript?.addLine(t('live.you'),text);conn.send(text)});
        });
      });
      peer.on('error',e=>status.textContent=t('live.connectionFailed')+(e.type||'Error'))
    }catch(_){status.textContent=t('live.micUnavailableAdvisor')}
  }

  function end(){
    try{
      window.__degajaStream?.getTracks().forEach(track=>track.stop());
      window.__degajaPeer?.destroy();
      window.__degajaRecognition?.stop();
      window.__degajaConn?.close();
    }catch(_){}
    const e=$('#degajaStatus');if(e)e.textContent=t('live.callEnded');
    const lines=$('#degajaTranscriptLines');if(lines)lines.innerHTML='';
  }
  function init(){
    // The live human advisor only speaks German, Russian and Ukrainian.
    if(window.degajaI18n && !window.degajaI18n.hasLiveAdvisor()) return;
    style();card();verify();
    loadRemoteData().then(()=>{
      const select=document.getElementById('degajaAdvisorSelect');
      if(select){ select.innerHTML=advisorOptions(); select.value=getSelectedAdvisor().id; }
      creditText();
      statusText();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
