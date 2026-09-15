(() => {
  'use strict';
  const $ = (s,r=document) => r.querySelector(s);
  const CREDIT_KEY = 'degajaVoiceCredits';
  const SESSION_KEY = 'degajaVoiceSession';
  const ADVISOR_KEY = 'degajaSelectedAdvisor';
  const prices = {15:'29,99',30:'59,99',60:'99,99'};
  const fallbackAdvisors = [
    {id:'anna',name:'Anna',title:'Tarot & Liebe'},
    {id:'sophie',name:'Sophie',title:'Beziehung & Gefühle'},
    {id:'lea',name:'Lea',title:'Zukunft & Karten'},
    {id:'maria',name:'Maria',title:'Numerologie'},
    {id:'clara',name:'Clara',title:'Astrologie'},
    {id:'julia',name:'Julia',title:'Liebe & Partnerschaft'},
    {id:'elena',name:'Elena',title:'Tarot & Intuition'},
    {id:'laura',name:'Laura',title:'Beruf & Lebensweg'},
    {id:'nina',name:'Nina',title:'Karten & Beziehungen'},
    {id:'isabella',name:'Isabella',title:'Astrologie & Numerologie'}
  ];
  const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const getCredits = () => Math.max(0, Number(localStorage.getItem(CREDIT_KEY)||0));
  const setCredits = n => localStorage.setItem(CREDIT_KEY,String(Math.max(0,n)));
  const getUser = () => { try{return JSON.parse(localStorage.getItem('degajaUser')||'null')}catch(_){return null} };
  const getAdvisors = () => (Array.isArray(window.DEGAJA_ADVISORS) && window.DEGAJA_ADVISORS.length ? window.DEGAJA_ADVISORS.filter(a=>a&&a.active!==false) : fallbackAdvisors);
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
    s.textContent=`.degaja-live{margin:28px auto 0;padding:24px;max-width:900px;text-align:left;background:rgba(255,255,255,.95);border:1px solid rgba(184,147,70,.28);border-radius:24px;box-shadow:0 16px 45px rgba(31,65,95,.08)}.degaja-live h3{margin:5px 0;color:#18334a;font-size:24px}.degaja-live-head{display:flex;justify-content:space-between;gap:15px;align-items:center;flex-wrap:wrap}.degaja-live-badge{padding:7px 11px;border-radius:999px;background:#f1f8f4;color:#3f7455;font-size:11px;font-weight:800}.degaja-live-copy{color:#687384;line-height:1.6;font-size:14px}.degaja-live-actions{display:flex;gap:10px;flex-wrap:wrap}.degaja-live button{border:0;border-radius:999px;padding:12px 18px;font-weight:800;cursor:pointer}.degaja-live .gold{background:#b88a32;color:#fff}.degaja-live .dark{background:#18334a;color:#fff}.degaja-live .soft{background:#f4f7f9;color:#18334a}.degaja-live-credit{font-size:12px;color:#7b8490;margin-top:12px}.degaja-call{margin-top:16px}.degaja-call-panel{padding:18px;border-radius:20px;background:#f6f9fb;border:1px solid rgba(24,51,74,.08)}.degaja-code{font-size:30px;letter-spacing:.18em;font-weight:900;text-align:center;color:#18334a;background:#fff;border:1px dashed rgba(184,147,70,.5);border-radius:16px;padding:14px;margin:12px 0}.degaja-status{font-size:13px;color:#687384;min-height:20px}.degaja-call audio{width:100%;margin-top:10px}.degaja-consult-options{display:grid;gap:9px;margin-top:12px}.degaja-consult-option{display:flex!important;align-items:center;justify-content:space-between;text-align:left!important;width:100%;background:#fbfeff;color:#18334a;border:1px solid #dfeef4!important}.degaja-consult-option small{display:block;color:#74808d;margin-top:3px}.degaja-consult-option b{color:#b88a32}.degaja-advisor{display:none;margin-top:15px;padding:18px;border-radius:18px;background:#fffdf8;border:1px solid rgba(184,147,70,.28)}.degaja-advisor.show{display:block}.degaja-advisor input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d7e0e6;border-radius:12px;margin:8px 0}.degaja-privacy{font-size:11px;color:#8a91a0;line-height:1.5;margin-top:12px}.degaja-advisor-picker{margin-top:16px}.degaja-advisor-picker label{display:block;font-size:12px;font-weight:800;color:#18334a;margin-bottom:7px}.degaja-advisor-picker select{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #d7e0e6;border-radius:12px;background:#fff;color:#18334a;font-weight:700}@media(max-width:650px){.degaja-live{padding:18px;border-radius:20px}.degaja-code{font-size:25px}}`;
    document.head.appendChild(s);
  }

  function advisorOptions(){
    return getAdvisors().map(a=>`<option value="${esc(a.id)}">${esc(a.name)} — ${esc(a.title)}</option>`).join('');
  }

  function card(){
    if($('#degajaLiveConsult')) return;
    const wrap=$('#human .human-wrap'); if(!wrap) return;
    const selected=getSelectedAdvisor();
    const el=document.createElement('div'); el.id='degajaLiveConsult'; el.className='degaja-live';
    el.innerHTML=`<div class="degaja-live-head"><div><div class="eyebrow">✦ LIVE AUDIO ✦</div><h3>Direkt mit unserer Expertin sprechen</h3></div><span class="degaja-live-badge">🔒 Anonym · nur nach Zahlung</span></div><p class="degaja-live-copy">Wähle zuerst deine persönliche DEGAJA-Beraterin. Deine Beratung bleibt dieser Beraterin zugeordnet.</p><div class="degaja-advisor-picker"><label for="degajaAdvisorSelect">Deine Beraterin</label><select id="degajaAdvisorSelect">${advisorOptions()}</select></div><div class="degaja-live-actions" style="margin-top:12px"><button class="gold" id="degajaLiveStart">Live-Beratung starten</button><button class="soft" id="degajaAdvisorToggle">Berater-Zugang</button></div><div class="degaja-live-credit" id="degajaLiveCredit"></div><div class="degaja-call" id="degajaCall"></div><div class="degaja-advisor" id="degajaAdvisor"><h4 style="color:#18334a">Berater-Zugang</h4><p class="degaja-live-copy">Die Beraterin gibt den anonymen 6-stelligen Sitzungscode des Kunden ein.</p><input id="degajaAdvisorCode" maxlength="6" inputmode="numeric" placeholder="Sitzungscode"><button class="dark" id="degajaAdvisorJoin">Anruf annehmen</button><div class="degaja-status" id="degajaAdvisorStatus"></div><audio id="degajaAdvisorAudio" autoplay controls></audio></div><div class="degaja-privacy">Keine Telefonnummer · kein Video · Peer-to-peer Audio. Die Zahlung wird serverseitig über Stripe bestätigt, bevor der Live-Zugang geöffnet wird.</div>`;
    wrap.appendChild(el);
    const select=$('#degajaAdvisorSelect'); if(select)select.value=selected.id;
    select?.addEventListener('change',()=>setSelectedAdvisor(select.value));
    $('#degajaLiveStart').onclick=start;
    $('#degajaAdvisorToggle').onclick=()=>$('#degajaAdvisor').classList.toggle('show');
    $('#degajaAdvisorJoin').onclick=advisorJoin;
    creditText();
  }

  function creditText(){const e=$('#degajaLiveCredit');if(!e)return;const c=getCredits(),a=getSelectedAdvisor();e.textContent=c?`DEGAJA-Live-Guthaben: ${c} Beratung${c===1?'':'en'} verfügbar · für ${a.name}.`:'Kein Live-Guthaben vorhanden · direkte Kartenzahlung möglich.';}

  function start(){
    const u=getUser(), host=$('#degajaCall'); if(!host)return;
    if(!u){host.innerHTML='<div class="degaja-call-panel"><b>Bitte zuerst anmelden.</b><p class="degaja-live-copy">Eine Live-Beratung kann nur einem angemeldeten DEGAJA-Konto zugeordnet werden.</p></div>';return;}
    const a=getSelectedAdvisor();
    const c=getCredits();
    host.innerHTML=`<div class="degaja-call-panel"><h4 style="color:#18334a">Live-Beratung mit ${esc(a.name)}</h4><p class="degaja-live-copy">${esc(a.title)} · ${c?'Du hast bereits ein Live-Guthaben.':'Wähle eine Dauer und bezahle sicher mit Karte.'}</p>${c?'<button class="gold" id="degajaUseCredit">Vorhandenes Guthaben verwenden</button>':''}<div class="degaja-consult-options"><button class="degaja-consult-option" data-duration="15"><span><strong>15 Minuten</strong><small>Live Audio mit ${esc(a.name)}</small></span><b>€${prices[15]}</b></button><button class="degaja-consult-option" data-duration="30"><span><strong>30 Minuten</strong><small>Live Audio mit ${esc(a.name)}</small></span><b>€${prices[30]}</b></button><button class="degaja-consult-option" data-duration="60"><span><strong>60 Minuten</strong><small>Live Audio mit ${esc(a.name)}</small></span><b>€${prices[60]}</b></button></div><div class="degaja-status">${esc(u.name||u.email)}</div></div>`;
    $('#degajaUseCredit')?.addEventListener('click',()=>{setCredits(getCredits()-1);creditText();call('credit',60,a)});
    host.querySelectorAll('[data-duration]').forEach(b=>b.addEventListener('click',()=>checkout(Number(b.dataset.duration),a)));
  }

  async function checkout(duration,advisor){
    const u=getUser(); if(!u||!advisor)return;
    try{const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:'voice',duration,email:u.email,name:u.name||'',advisorId:advisor.id})});const d=await r.json();if(!r.ok||!d.url)throw new Error(d.error||'Checkout');localStorage.setItem(SESSION_KEY,JSON.stringify({type:'voice',duration,advisorId:advisor.id}));location.href=d.url}catch(_){const e=$('#degajaCall');if(e)e.innerHTML='<div class="degaja-call-panel"><b>Zahlung konnte nicht vorbereitet werden.</b><p class="degaja-live-copy">Bitte versuche es erneut.</p></div>';}
  }

  async function verify(){
    const p=new URLSearchParams(location.search), id=p.get('session_id'); if(p.get('payment')!=='success'||!id)return;
    try{const r=await fetch('/api/verify-payment?session_id='+encodeURIComponent(id));const d=await r.json();if(!r.ok||!d.paid||d.type!=='voice')throw new Error('not paid');const advisor=d.advisorId?setSelectedAdvisor(d.advisorId):getSelectedAdvisor();localStorage.setItem('degajaPaidVoice','1');localStorage.setItem(SESSION_KEY,JSON.stringify({type:'voice',duration:d.duration||60,advisorId:advisor.id,sessionId:id,verifiedAt:Date.now()}));history.replaceState({},document.title,location.pathname+location.hash);call('paid',d.duration||60,advisor)}catch(_){console.warn('DEGAJA payment verification failed');}
  }

  function peerScript(){return new Promise((ok,no)=>{if(window.Peer)return ok();const s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}

  async function call(source,duration,advisor=getSelectedAdvisor()){
    const host=$('#degajaCall');if(!host)return;
    host.innerHTML=`<div class="degaja-call-panel"><h4 style="color:#18334a">Live-Sprachverbindung mit ${esc(advisor.name)}</h4><div class="degaja-status">${esc(advisor.title)}</div><div class="degaja-code" id="degajaCode">------</div><div class="degaja-status" id="degajaStatus">Mikrofon wird vorbereitet …</div><div class="degaja-live-actions" style="margin-top:12px"><button class="dark" id="degajaMute">Mikrofon stummschalten</button><button style="background:#a34d4d;color:#fff" id="degajaEnd">Gespräch beenden</button></div><audio id="degajaRemoteAudio" autoplay controls></audio><div class="degaja-privacy">${duration} Minuten · ${source==='credit'?'Guthaben verwendet':'Zahlung bestätigt'} · Beraterin: ${esc(advisor.name)} · Teile nur den Sitzungscode mit deiner DEGAJA-Beraterin.</div></div>`;
    try{await peerScript();const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});const code=String(Math.floor(100000+Math.random()*900000));const peer=new Peer('degaja-'+code);window.__degajaPeer=peer;window.__degajaStream=stream;$('#degajaCode').textContent=code;$('#degajaStatus').textContent='Warte auf die Beraterin …';peer.on('call',c=>{c.answer(stream);c.on('stream',remote=>{$('#degajaRemoteAudio').srcObject=remote;$('#degajaStatus').textContent='Live verbunden.'})});peer.on('error',e=>$('#degajaStatus').textContent='Verbindung fehlgeschlagen: '+(e.type||'Fehler'));$('#degajaMute').onclick=()=>{const t=stream.getAudioTracks()[0];t.enabled=!t.enabled;$('#degajaMute').textContent=t.enabled?'Mikrofon stummschalten':'Mikrofon einschalten'};$('#degajaEnd').onclick=end}catch(_){$('#degajaStatus').textContent='Mikrofonzugriff oder Live-Verbindung nicht verfügbar.'}
  }

  async function advisorJoin(){
    const code=$('#degajaAdvisorCode')?.value.trim(), status=$('#degajaAdvisorStatus'), audio=$('#degajaAdvisorAudio');if(!/^\d{6}$/.test(code)){status.textContent='Bitte einen 6-stelligen Sitzungscode eingeben.';return}
    try{await peerScript();const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});const peer=new Peer();window.__degajaAdvisorPeer=peer;window.__degajaAdvisorStream=stream;peer.on('open',()=>{const c=peer.call('degaja-'+code,stream);c?.on('stream',remote=>{audio.srcObject=remote;status.textContent='Live verbunden.'});c?.on('close',()=>status.textContent='Gespräch beendet.')});peer.on('error',e=>status.textContent='Verbindung fehlgeschlagen: '+(e.type||'Fehler'))}catch(_){status.textContent='Mikrofonzugriff nicht verfügbar.'}
  }

  function end(){try{window.__degajaStream?.getTracks().forEach(t=>t.stop());window.__degajaPeer?.destroy()}catch(_){}const e=$('#degajaStatus');if(e)e.textContent='Gespräch beendet.';}
  function init(){style();card();verify()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
