(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  const DECK = [
    { name: 'Der Narr', glyph: '🃏', meaning: 'Neuanfang und Unbekümmertheit – ein Sprung ins Unbekannte.' },
    { name: 'Der Magier', glyph: '⚡', meaning: 'Willenskraft – du hast bereits alles, was du brauchst.' },
    { name: 'Die Hohepriesterin', glyph: '🌙', meaning: 'Intuition – hör auf das, was du innerlich schon weißt.' },
    { name: 'Die Herrscherin', glyph: '🌿', meaning: 'Fülle und Fürsorge – für dich selbst und andere.' },
    { name: 'Der Herrscher', glyph: '👑', meaning: 'Struktur und Stabilität – Ordnung schafft Klarheit.' },
    { name: 'Der Hierophant', glyph: '📜', meaning: 'Tradition und Rat – manchmal hilft bewährte Weisheit.' },
    { name: 'Die Liebenden', glyph: '❤️', meaning: 'Verbindung – eine wichtige Entscheidung des Herzens.' },
    { name: 'Der Wagen', glyph: '🏹', meaning: 'Entschlossenheit – du bewegst dich vorwärts, mit Kontrolle.' },
    { name: 'Die Kraft', glyph: '🦁', meaning: 'Innere Stärke – sanfter Mut überwindet Widerstand.' },
    { name: 'Der Eremit', glyph: '🕯️', meaning: 'Rückzug – Antworten liegen gerade in der Stille.' },
    { name: 'Das Rad des Schicksals', glyph: '🎡', meaning: 'Wandel – manches liegt einfach nicht in deiner Hand.' },
    { name: 'Die Gerechtigkeit', glyph: '⚖️', meaning: 'Balance – Wahrheit und Fairness setzen sich durch.' },
    { name: 'Der Gehängte', glyph: '🔄', meaning: 'Loslassen – eine neue Perspektive verändert alles.' },
    { name: 'Der Tod', glyph: '🦋', meaning: 'Wandlung – ein Kapitel endet, damit ein neues beginnt.' },
    { name: 'Die Mäßigkeit', glyph: '🕊️', meaning: 'Geduld – die richtige Mischung braucht Zeit.' },
    { name: 'Der Teufel', glyph: '⛓️', meaning: 'Bindung – erkenne, was dich wirklich festhält.' },
    { name: 'Der Turm', glyph: '🗼', meaning: 'Umbruch – manchmal muss etwas einstürzen, um Platz zu machen.' },
    { name: 'Der Stern', glyph: '⭐', meaning: 'Hoffnung – nach der Dunkelheit kommt wieder Licht.' },
    { name: 'Der Mond', glyph: '🌑', meaning: 'Unsicherheit – nicht alles ist bereits klar, und das ist okay.' },
    { name: 'Die Sonne', glyph: '☀️', meaning: 'Freude und Klarheit – ein leichter, guter Moment.' },
    { name: 'Das Gericht', glyph: '📯', meaning: 'Erwachen – Zeit, ehrlich Bilanz zu ziehen.' },
    { name: 'Die Welt', glyph: '🌍', meaning: 'Vollendung – ein Kreis schließt sich stimmig.' }
  ];

  const FAN_SIZE = 9;
  const MAX_PICKS = 3;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function style() {
    if ($('#tarotDrawStyle')) return;
    const s = document.createElement('style');
    s.id = 'tarotDrawStyle';
    s.textContent = `.tarot-draw{margin:0 0 26px;padding:22px;border-radius:22px;background:rgba(255,255,255,.9);border:1px solid rgba(184,147,70,.24);box-shadow:0 12px 35px rgba(31,65,95,.07);text-align:center}.tarot-draw-copy{color:#687384;font-size:14px;line-height:1.6;margin:0 0 16px}.tarot-start-btn{border:0;border-radius:999px;padding:13px 24px;background:#18334a;color:#fff;font-weight:800;cursor:pointer;font-size:15px}.tarot-fan{position:relative;height:150px;margin:18px auto 0;max-width:480px}.tarot-card{position:absolute;left:50%;top:22px;width:64px;height:96px;margin-left:-32px;border-radius:10px;cursor:pointer;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .4s ease;transform-origin:50% 100%}.tarot-card:hover{z-index:50 !important}.tarot-card.tarot-fly-out{opacity:0;transform:translateY(-60px) scale(.6) !important}.tarot-card-face{position:absolute;inset:0;border-radius:10px;backface-visibility:hidden;display:flex;align-items:center;justify-content:center}.tarot-card-back{background:linear-gradient(135deg,#18334a,#20456b);border:1px solid rgba(216,170,82,.6)}.tarot-card-back:after{content:"✦";color:#d8aa52;font-size:20px}.tarot-card-front{background:#fffdf8;border:1px solid rgba(184,147,70,.55);transform:rotateY(180deg);font-size:26px}.tarot-card.revealed .tarot-card-inner{transform:rotateY(180deg)}.tarot-card-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.3,.7,.3,1)}.tarot-reveal-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:10px;min-height:1px}.tarot-reveal-card{width:130px;background:#fffdf8;border:1px solid rgba(184,147,70,.35);border-radius:14px;padding:14px 10px;box-shadow:0 10px 26px rgba(31,65,95,.08);animation:tarotPopIn .4s ease both}@keyframes tarotPopIn{from{opacity:0;transform:translateY(14px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}.tarot-reveal-card .glyph{font-size:26px;display:block;margin-bottom:6px}.tarot-reveal-card h4{margin:0 0 6px;color:#18334a;font-size:14px}.tarot-reveal-card p{margin:0;color:#687384;font-size:12px;line-height:1.5}.tarot-cta{margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.tarot-cta button{border:0;border-radius:999px;padding:12px 20px;font-weight:800;cursor:pointer;font-size:14px}.tarot-cta .primary{background:#b88a32;color:#fff}.tarot-cta .soft{background:#f4f7f9;color:#18334a}.tarot-hint{margin-top:14px;color:#9299a5;font-size:12px}@media(max-width:480px){.tarot-card{width:52px;height:80px;margin-left:-26px}.tarot-reveal-card{width:100px}}`;
    document.head.appendChild(s);
  }

  function card(name, glyph) {
    return `<article class="tarot-card" data-name="${esc(name)}"><div class="tarot-card-inner"><div class="tarot-card-face tarot-card-back"></div><div class="tarot-card-face tarot-card-front">${glyph}</div></div></article>`;
  }

  function layoutFan(container) {
    const cards = [...container.querySelectorAll('.tarot-card')];
    const n = cards.length;
    const spread = 46; // total degrees of the arc
    const spacing = 46; // px between card centers, keeps each card's center clear of its neighbors
    cards.forEach((el, i) => {
      const angle = -spread / 2 + (spread / (n - 1)) * i;
      const xOffset = (i - (n - 1) / 2) * spacing;
      el.style.zIndex = String(i);
      el.style.transform = `translateX(${xOffset}px) rotate(0deg) scale(.3)`;
      el.style.opacity = '0';
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = `translateX(${xOffset}px) rotate(${angle}deg)`;
        }, i * 55);
      });
    });
  }

  function render() {
    if ($('#tarotDraw')) return;
    const oracleCard = $('#oracle .oracle-card');
    const form = $('#oracle .oracle-form');
    if (!oracleCard || !form) return;

    const el = document.createElement('div');
    el.id = 'tarotDraw';
    el.className = 'tarot-draw';
    el.innerHTML = `
      <p class="tarot-draw-copy">Möchtest du erst drei Karten ziehen, bevor du deine Frage stellst?</p>
      <button class="tarot-start-btn" id="tarotStartBtn">🎴 Karten ziehen</button>
      <div class="tarot-fan" id="tarotFan" style="display:none"></div>
      <div class="tarot-reveal-row" id="tarotRevealRow"></div>
      <div class="tarot-cta" id="tarotCta" style="display:none"></div>
      <p class="tarot-hint" id="tarotHint" style="display:none">Wähle drei Karten, die dich ansprechen.</p>
    `;
    oracleCard.insertBefore(el, form);

    let picked = [];
    let deckForRound = [];

    function reset() {
      picked = [];
      window.DEGAJA_DRAWN_CARDS = [];
      $('#tarotRevealRow').innerHTML = '';
      $('#tarotCta').style.display = 'none';
      $('#tarotCta').innerHTML = '';
      startDraw();
    }

    function onCardClick(e) {
      const cardEl = e.currentTarget;
      if (cardEl.classList.contains('revealed') || picked.length >= MAX_PICKS) return;
      const name = cardEl.dataset.name;
      const data = DECK.find(c => c.name === name);
      cardEl.classList.add('revealed');
      picked.push(data);

      setTimeout(() => {
        cardEl.classList.add('tarot-fly-out');
        const revealRow = $('#tarotRevealRow');
        revealRow.insertAdjacentHTML('beforeend', `
          <div class="tarot-reveal-card"><span class="glyph">${data.glyph}</span><h4>${esc(data.name)}</h4><p>${esc(data.meaning)}</p></div>
        `);
      }, 550);

      if (picked.length >= MAX_PICKS) {
        $('#tarotFan').querySelectorAll('.tarot-card:not(.revealed)').forEach(c => {
          c.classList.add('tarot-fly-out');
          c.removeEventListener('click', onCardClick);
        });
        window.DEGAJA_DRAWN_CARDS = picked.map(c => c.name);
        setTimeout(() => {
          $('#tarotHint').style.display = 'none';
          const cta = $('#tarotCta');
          cta.style.display = 'flex';
          cta.innerHTML = `<button class="primary" id="tarotAskBtn">Frage zu diesen Karten stellen →</button><button class="soft" id="tarotResetBtn">🔄 Neu ziehen</button>`;
          $('#tarotAskBtn')?.addEventListener('click', () => {
            $('#oracle .oracle-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => $('#aiQuestion')?.focus(), 400);
          });
          $('#tarotResetBtn')?.addEventListener('click', reset);
        }, 650);
      }
    }

    function startDraw() {
      $('#tarotStartBtn').style.display = 'none';
      const fan = $('#tarotFan');
      deckForRound = shuffle(DECK).slice(0, FAN_SIZE);
      fan.innerHTML = deckForRound.map(c => card(c.name, c.glyph)).join('');
      fan.style.display = 'block';
      $('#tarotHint').style.display = 'block';
      fan.querySelectorAll('.tarot-card').forEach(c => c.addEventListener('click', onCardClick));
      layoutFan(fan);
    }

    $('#tarotStartBtn').addEventListener('click', startDraw);
  }

  function init() { style(); render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
