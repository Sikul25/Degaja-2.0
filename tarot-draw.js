(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const t = key => (window.degajaI18n ? window.degajaI18n.t(key) : key);

  const MAJOR_ARCANA = [
    { name: 'Der Narr', glyph: '🃏', image: 'assets/tarot/fool.jpg', meaning: 'Neuanfang und Unbekümmertheit – ein Sprung ins Unbekannte.' },
    { name: 'Der Magier', glyph: '⚡', image: 'assets/tarot/magician.jpg', meaning: 'Willenskraft – du hast bereits alles, was du brauchst.' },
    { name: 'Die Hohepriesterin', glyph: '🌙', image: 'assets/tarot/high_priestess.jpg', meaning: 'Intuition – hör auf das, was du innerlich schon weißt.' },
    { name: 'Die Herrscherin', glyph: '🌿', image: 'assets/tarot/empress.jpg', meaning: 'Fülle und Fürsorge – für dich selbst und andere.' },
    { name: 'Der Herrscher', glyph: '👑', image: 'assets/tarot/emperor.jpg', meaning: 'Struktur und Stabilität – Ordnung schafft Klarheit.' },
    { name: 'Der Hierophant', glyph: '📜', image: 'assets/tarot/hierophant.jpg', meaning: 'Tradition und Rat – manchmal hilft bewährte Weisheit.' },
    { name: 'Die Liebenden', glyph: '❤️', image: 'assets/tarot/lovers.jpg', meaning: 'Verbindung – eine wichtige Entscheidung des Herzens.' },
    { name: 'Der Wagen', glyph: '🏹', image: 'assets/tarot/chariot.jpg', meaning: 'Entschlossenheit – du bewegst dich vorwärts, mit Kontrolle.' },
    { name: 'Die Kraft', glyph: '🦁', image: 'assets/tarot/strength.jpg', meaning: 'Innere Stärke – sanfter Mut überwindet Widerstand.' },
    { name: 'Der Eremit', glyph: '🕯️', image: 'assets/tarot/hermit.jpg', meaning: 'Rückzug – Antworten liegen gerade in der Stille.' },
    { name: 'Das Rad des Schicksals', glyph: '🎡', image: 'assets/tarot/wheel.jpg', meaning: 'Wandel – manches liegt einfach nicht in deiner Hand.' },
    { name: 'Die Gerechtigkeit', glyph: '⚖️', image: 'assets/tarot/justice.jpg', meaning: 'Balance – Wahrheit und Fairness setzen sich durch.' },
    { name: 'Der Gehängte', glyph: '🔄', image: 'assets/tarot/hanged.jpg', meaning: 'Loslassen – eine neue Perspektive verändert alles.' },
    { name: 'Der Tod', glyph: '🦋', image: 'assets/tarot/death.jpg', meaning: 'Wandlung – ein Kapitel endet, damit ein neues beginnt.' },
    { name: 'Die Mäßigkeit', glyph: '🕊️', image: 'assets/tarot/temperance.jpg', meaning: 'Geduld – die richtige Mischung braucht Zeit.' },
    { name: 'Der Teufel', glyph: '⛓️', image: 'assets/tarot/devil.jpg', meaning: 'Bindung – erkenne, was dich wirklich festhält.' },
    { name: 'Der Turm', glyph: '🗼', image: 'assets/tarot/tower.jpg', meaning: 'Umbruch – manchmal muss etwas einstürzen, um Platz zu machen.' },
    { name: 'Der Stern', glyph: '⭐', image: 'assets/tarot/star.jpg', meaning: 'Hoffnung – nach der Dunkelheit kommt wieder Licht.' },
    { name: 'Der Mond', glyph: '🌑', image: 'assets/tarot/moon.jpg', meaning: 'Unsicherheit – nicht alles ist bereits klar, und das ist okay.' },
    { name: 'Die Sonne', glyph: '☀️', image: 'assets/tarot/sun.jpg', meaning: 'Freude und Klarheit – ein leichter, guter Moment.' },
    { name: 'Das Gericht', glyph: '📯', image: 'assets/tarot/judgement.jpg', meaning: 'Erwachen – Zeit, ehrlich Bilanz zu ziehen.' },
    { name: 'Die Welt', glyph: '🌍', image: 'assets/tarot/world.jpg', meaning: 'Vollendung – ein Kreis schließt sich stimmig.' }
  ];

  const SUITS = [
    { name: 'Stäbe', glyph: '🪄' },
    { name: 'Kelche', glyph: '🍷' },
    { name: 'Schwerter', glyph: '⚔️' },
    { name: 'Münzen', glyph: '🪙' }
  ];
  const RANKS = ['Ass', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Bube', 'Ritter', 'Königin', 'König'];
  const MINOR_MEANINGS = {
    'Stäbe': [
      'Neue Energie und Inspiration – ein frischer Funke will entfacht werden.',
      'Planung – du blickst nach vorn und wägst deine Möglichkeiten ab.',
      'Ausblick – erste Schritte zeigen Wirkung, mehr ist im Kommen.',
      'Feier – ein Grund zur Freude, ein stabiles Fundament.',
      'Wettstreit – unterschiedliche Kräfte messen sich aneinander.',
      'Erfolg – Anerkennung für das, was du geleistet hast.',
      'Behauptung – du verteidigst deinen Standpunkt mit Mut.',
      'Schnelligkeit – die Dinge bewegen sich plötzlich sehr rasch.',
      'Durchhaltevermögen – müde, aber fast am Ziel.',
      'Last – du trägst viel Verantwortung auf deinen Schultern.',
      'Entdeckerlust – eine neugierige, unternehmungslustige Energie.',
      'Tatendrang – impulsiv und mutig nach vorn.',
      'Selbstsicherheit – warme, strahlende Eigenständigkeit.',
      'Führungsstärke – visionär und entschlossen.'
    ],
    'Kelche': [
      'Neue Gefühle – ein Herz öffnet sich für etwas Besonderes.',
      'Verbindung – eine gegenseitige, gleichwertige Anziehung.',
      'Gemeinschaft – Freude, die man mit anderen teilt.',
      'Nachdenklichkeit – Unzufriedenheit trotz vorhandener Möglichkeiten.',
      'Enttäuschung – der Blick bleibt am Verlorenen hängen.',
      'Erinnerung – Nostalgie und die Unschuld vergangener Zeiten.',
      'Wahlmöglichkeiten – viele Optionen, aber nicht alle sind real.',
      'Aufbruch – du lässt etwas hinter dir, das nicht mehr passt.',
      'Zufriedenheit – ein Wunsch, der sich erfüllt hat.',
      'Harmonie – emotionale Erfüllung im Kreis der Nächsten.',
      'Sanftmut – eine verträumte, gefühlvolle Botschaft.',
      'Romantik – ein Angebot, das dem Herzen folgt.',
      'Einfühlungsvermögen – tiefe, intuitive Fürsorge.',
      'Emotionale Reife – Ruhe trotz innerer Tiefe.'
    ],
    'Schwerter': [
      'Klarheit – ein Durchbruch im Denken, eine klare Wahrheit.',
      'Unentschlossenheit – ein Patt zwischen zwei Möglichkeiten.',
      'Schmerz – eine schwere Wahrheit, die weh tut.',
      'Ruhepause – bewusster Rückzug zur Erholung.',
      'Konflikt – ein Sieg, der nichts wirklich löst.',
      'Übergang – ein ruhigeres Fahrwasser liegt voraus.',
      'Strategie – ein cleverer, vielleicht heimlicher Schachzug.',
      'Gefangen – die Grenzen sind oft nur im Kopf.',
      'Sorge – nächtliche Gedanken, die größer wirken als sie sind.',
      'Abschluss – ein schmerzhaftes Ende, aber wirklich zu Ende.',
      'Wachsamkeit – neugierig, aufmerksam, bereit zu lernen.',
      'Entschlossenheit – direkt, schnell, geradeheraus.',
      'Klarheit – scharfer Verstand mit ehrlicher Sprache.',
      'Urteilsvermögen – Vernunft, die über Gefühle entscheidet.'
    ],
    'Münzen': [
      'Neue Möglichkeit – ein greifbarer Anfang mit Potenzial.',
      'Balance – Jonglieren zwischen mehreren Verpflichtungen.',
      'Zusammenarbeit – gemeinsames Werk trägt Früchte.',
      'Sicherheit – Festhalten an dem, was man hat.',
      'Mangel – eine schwierige Phase, die vorübergeht.',
      'Geben und Nehmen – ein faires Gleichgewicht im Austausch.',
      'Geduld – die Ernte braucht noch etwas Zeit.',
      'Hingabe – Fleiß, der sich mit der Zeit auszahlt.',
      'Wohlstand – die Früchte eigener Unabhängigkeit.',
      'Vermächtnis – langfristige Sicherheit und Familie.',
      'Lernbereitschaft – ein praktischer, bodenständiger Anfang.',
      'Beständigkeit – langsam, aber zuverlässig unterwegs.',
      'Fürsorge – warme, praktische Bodenständigkeit.',
      'Wohlstand – Sicherheit durch harte, kluge Arbeit.'
    ]
  };
  const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const COURT_GLYPHS = { 'Bube': '🧑', 'Ritter': '🏇', 'Königin': '👸', 'König': '🤴' };
  const MINOR_ARCANA = SUITS.flatMap(suit => RANKS.map((rank, i) => ({
    name: `${rank} der ${suit.name}`,
    glyph: i < 10 ? suit.glyph : COURT_GLYPHS[rank],
    badge: i < 10 ? ROMANS[i] : null,
    meaning: MINOR_MEANINGS[suit.name][i]
  })));

  const SUIT_FILE_KEYS = { 'Stäbe': 'wands', 'Kelche': 'cups', 'Schwerter': 'swords', 'Münzen': 'pent' };
  MINOR_ARCANA.forEach((c, idx) => {
    const suit = SUITS[Math.floor(idx / RANKS.length)];
    const rankNum = (idx % RANKS.length) + 1;
    c.image = `assets/tarot/${SUIT_FILE_KEYS[suit.name]}${rankNum}.jpg`;
    c.suitKey = SUIT_FILE_KEYS[suit.name];
    c.rankIndex = idx % RANKS.length;
    c.id = `${c.suitKey}${rankNum}`;
  });
  MAJOR_ARCANA.forEach(c => { c.id = c.image.match(/tarot\/(.+)\.jpg/)[1]; c.major = true; });

  const DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA];

  const MINOR_CONNECTOR = { en: 'of', us: 'of', fr: 'de', es: 'de', it: 'di', pt: 'de', ru: '', uk: '', br: 'de' };

  function localize(cardData) {
    const lang = window.degajaI18n ? window.degajaI18n.getLang() : 'de';
    const fallback = { name: cardData.name, meaning: cardData.meaning };
    if (lang === 'de') return fallback;
    const table = window.DEGAJA_TAROT_I18N && window.DEGAJA_TAROT_I18N[lang];
    if (!table) return fallback;
    if (cardData.major) {
      const entry = table.major[cardData.id];
      return entry ? entry : fallback;
    }
    const suitName = table.suits[cardData.suitKey];
    const rankName = table.ranks[cardData.rankIndex];
    const meaning = table.minorMeanings[cardData.suitKey] && table.minorMeanings[cardData.suitKey][cardData.rankIndex];
    if (!suitName || !rankName || !meaning) return fallback;
    const connector = lang in MINOR_CONNECTOR ? MINOR_CONNECTOR[lang] : 'of';
    const name = [rankName, connector, suitName].filter(Boolean).join(' ');
    return { name, meaning };
  }

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
    s.textContent = `.tarot-draw{position:relative;overflow:hidden;margin:0 0 26px;padding:22px;border-radius:22px;background:rgba(255,255,255,.9);border:1px solid rgba(184,147,70,.24);box-shadow:0 12px 35px rgba(31,65,95,.07);text-align:center}.tarot-draw-copy{color:#687384;font-size:14px;line-height:1.6;margin:0 0 16px;position:relative;z-index:2}.tarot-twinkle{position:absolute;color:#d8aa52;pointer-events:none;animation:tarotTwinkle 3.4s ease-in-out infinite}@keyframes tarotTwinkle{0%,100%{opacity:.15;transform:scale(.85)}50%{opacity:.85;transform:scale(1.1)}}.tarot-orbit-wrap{position:relative;display:inline-block;z-index:2}.tarot-orbit{position:absolute;inset:-46px;pointer-events:none;animation:tarotSpin 24s linear infinite}.tarot-orbit-star{position:absolute;top:50%;left:50%;color:#d8aa52;font-size:11px;line-height:1;opacity:.75}@keyframes tarotSpin{to{transform:rotate(360deg)}}.tarot-start-btn{position:relative;z-index:2;border:0;border-radius:999px;padding:13px 24px;background:#18334a;color:#fff;font-weight:800;cursor:pointer;font-size:15px}.tarot-fan{position:relative;height:150px;margin:18px auto 0;max-width:480px}.tarot-card{position:absolute;left:50%;top:22px;width:64px;height:96px;margin-left:-32px;border-radius:10px;cursor:pointer;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .4s ease;transform-origin:50% 100%}.tarot-card:hover{z-index:50 !important}.tarot-card.tarot-fly-out{opacity:0;transform:translateY(-60px) scale(.6) !important}.tarot-card-face{position:absolute;inset:0;border-radius:10px;backface-visibility:hidden;display:flex;align-items:center;justify-content:center}.tarot-card-back{background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.98) 0%,rgba(255,244,220,.6) 16%,transparent 40%),radial-gradient(circle at 24% 20%,rgba(184,138,50,.8) 0 1.3px,transparent 2px),radial-gradient(circle at 78% 28%,rgba(184,138,50,.6) 0 1.1px,transparent 1.8px),radial-gradient(circle at 64% 76%,rgba(184,138,50,.75) 0 1.3px,transparent 2px),radial-gradient(circle at 30% 80%,rgba(24,51,74,.4) 0 1.1px,transparent 1.8px),radial-gradient(circle at 86% 56%,rgba(184,138,50,.55) 0 1.1px,transparent 1.8px),linear-gradient(160deg,#eef8fc,#cdeaf6 45%,#9bd6ef 100%);border:1px solid rgba(184,147,70,.5)}.tarot-card-back:before{content:"";position:absolute;inset:0;border-radius:9px;background:repeating-conic-gradient(from 0deg at 50% 42%,rgba(255,255,255,.55) 0deg 3deg,transparent 3deg 24deg);mix-blend-mode:soft-light;opacity:.85;animation:tarotRayRotate 16s linear infinite}.tarot-card-back:after{content:"🪐";position:relative;font-size:22px;filter:drop-shadow(0 1px 3px rgba(24,51,74,.25))}@keyframes tarotRayRotate{to{transform:rotate(360deg)}}.tarot-card-front{background:#fffdf8;border:1px solid rgba(184,147,70,.55);transform:rotateY(180deg);font-size:26px}.tarot-card-front img{width:100%;height:100%;object-fit:cover;border-radius:9px}.tarot-reveal-card img{width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:8px;display:block}.tarot-badge{position:absolute;top:5px;right:6px;font-size:10px;font-weight:800;color:#18334a;background:rgba(255,255,255,.9);border:1px solid rgba(184,147,70,.5);border-radius:6px;padding:1px 4px;line-height:1.3}.tarot-card.revealed .tarot-card-inner{transform:rotateY(180deg)}.tarot-card-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.3,.7,.3,1)}.tarot-reveal-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:10px;min-height:1px}.tarot-reveal-card{width:130px;background:#fffdf8;border:1px solid rgba(184,147,70,.35);border-radius:14px;padding:14px 10px;box-shadow:0 10px 26px rgba(31,65,95,.08);animation:tarotPopIn .4s ease both}@keyframes tarotPopIn{from{opacity:0;transform:translateY(14px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}.tarot-reveal-card .glyph{font-size:26px;display:block;margin-bottom:6px}.tarot-reveal-badge{font-size:12px;color:#b88a32;font-weight:800;margin-left:4px;vertical-align:middle}.tarot-reveal-card h4{margin:0 0 6px;color:#18334a;font-size:14px}.tarot-reveal-card p{margin:0;color:#687384;font-size:12px;line-height:1.5}.tarot-cta{margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.tarot-cta button{border:0;border-radius:999px;padding:12px 20px;font-weight:800;cursor:pointer;font-size:14px}.tarot-cta .primary{background:#b88a32;color:#fff}.tarot-cta .soft{background:#f4f7f9;color:#18334a}.tarot-hint{margin-top:14px;color:#9299a5;font-size:12px}.tarot-light-burst{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;pointer-events:none;z-index:60;background:radial-gradient(circle,#fff 0%,#ffe8b0 22%,#b88a32 48%,transparent 72%);box-shadow:0 0 24px 12px rgba(255,238,190,.85);animation:tarotBurst .8s cubic-bezier(.2,.7,.3,1) forwards}@keyframes tarotBurst{0%{width:8px;height:8px;margin:-4px 0 0 -4px;opacity:1}65%{opacity:.85}100%{width:210px;height:210px;margin:-105px 0 0 -105px;opacity:0}}.tarot-light-ray{position:absolute;left:50%;top:50%;width:2px;height:55px;margin-left:-1px;transform-origin:50% 0;background:linear-gradient(to bottom,rgba(255,255,255,.95),transparent);pointer-events:none;z-index:59;animation:tarotRayShoot .65s ease-out forwards}@keyframes tarotRayShoot{0%{opacity:1;transform:rotate(var(--ray-angle,0deg)) scaleY(0)}40%{opacity:1}100%{opacity:0;transform:rotate(var(--ray-angle,0deg)) scaleY(1)}}@media(max-width:480px){.tarot-card{width:52px;height:80px;margin-left:-26px}.tarot-reveal-card{width:100px}}`;
    document.head.appendChild(s);
  }

  function card(cardData) {
    const { name } = localize(cardData);
    const { glyph, badge, image } = cardData;
    const badgeHtml = badge ? `<span class="tarot-badge">${esc(badge)}</span>` : '';
    const frontContent = image ? `<img src="${esc(image)}" alt="${esc(name)}" loading="lazy">` : glyph;
    return `<article class="tarot-card" data-name="${esc(cardData.name)}"><div class="tarot-card-inner"><div class="tarot-card-face tarot-card-back"></div><div class="tarot-card-face tarot-card-front">${frontContent}${badgeHtml}</div></div></article>`;
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

    const orbitCount = 6;
    const orbitStars = Array.from({ length: orbitCount }, (_, i) => {
      const angle = (360 / orbitCount) * i;
      const glyph = i % 2 === 0 ? '✦' : '✧';
      return `<span class="tarot-orbit-star" style="transform:rotate(${angle}deg) translate(58px)">${glyph}</span>`;
    }).join('');

    const twinklePositions = [
      { top: '10%', left: '8%', size: '12px', delay: '0s' },
      { top: '18%', right: '10%', size: '9px', delay: '.8s' },
      { bottom: '14%', left: '14%', size: '10px', delay: '1.6s' },
      { bottom: '20%', right: '8%', size: '13px', delay: '2.2s' }
    ];
    const twinkleStars = twinklePositions.map(p => {
      const pos = Object.entries(p).filter(([k]) => k !== 'size' && k !== 'delay').map(([k, v]) => `${k}:${v}`).join(';');
      return `<span class="tarot-twinkle" style="${pos};font-size:${p.size};animation-delay:${p.delay}">✦</span>`;
    }).join('');

    const el = document.createElement('div');
    el.id = 'tarotDraw';
    el.className = 'tarot-draw';
    el.innerHTML = `
      ${twinkleStars}
      <p class="tarot-draw-copy">${t('tarot.invite')}</p>
      <div class="tarot-orbit-wrap">
        <div class="tarot-orbit">${orbitStars}</div>
        <button class="tarot-start-btn" id="tarotStartBtn">${t('tarot.startBtn')}</button>
      </div>
      <div class="tarot-fan" id="tarotFan" style="display:none"></div>
      <div class="tarot-reveal-row" id="tarotRevealRow"></div>
      <div class="tarot-cta" id="tarotCta" style="display:none"></div>
      <p class="tarot-hint" id="tarotHint" style="display:none">${t('tarot.hint')}</p>
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

    function spawnLightBurst(cardEl) {
      const burst = document.createElement('span');
      burst.className = 'tarot-light-burst';
      cardEl.appendChild(burst);
      const rays = [];
      for (let i = 0; i < 6; i++) {
        const ray = document.createElement('span');
        ray.className = 'tarot-light-ray';
        ray.style.setProperty('--ray-angle', `${i * 60 + Math.random() * 20}deg`);
        ray.style.animationDelay = `${Math.random() * 60}ms`;
        cardEl.appendChild(ray);
        rays.push(ray);
      }
      setTimeout(() => { burst.remove(); rays.forEach(r => r.remove()); }, 850);
    }

    function onCardClick(e) {
      const cardEl = e.currentTarget;
      if (cardEl.classList.contains('revealed') || picked.length >= MAX_PICKS) return;
      const name = cardEl.dataset.name;
      const data = DECK.find(c => c.name === name);
      cardEl.classList.add('revealed');
      spawnLightBurst(cardEl);
      picked.push(data);

      setTimeout(() => {
        cardEl.classList.add('tarot-fly-out');
        const revealRow = $('#tarotRevealRow');
        const localized = localize(data);
        const badgeHtml = data.badge ? `<b class="tarot-reveal-badge">${esc(data.badge)}</b>` : '';
        const glyphHtml = data.image
          ? `<img src="${esc(data.image)}" alt="${esc(localized.name)}" loading="lazy">`
          : `<span class="glyph">${data.glyph}${badgeHtml}</span>`;
        revealRow.insertAdjacentHTML('beforeend', `
          <div class="tarot-reveal-card">${glyphHtml}<h4>${esc(localized.name)}</h4><p>${esc(localized.meaning)}</p></div>
        `);
      }, 550);

      if (picked.length >= MAX_PICKS) {
        $('#tarotFan').querySelectorAll('.tarot-card:not(.revealed)').forEach(c => {
          c.classList.add('tarot-fly-out');
          c.removeEventListener('click', onCardClick);
        });
        window.DEGAJA_DRAWN_CARDS = picked.map(c => localize(c).name);
        setTimeout(() => {
          $('#tarotHint').style.display = 'none';
          const cta = $('#tarotCta');
          cta.style.display = 'flex';
          cta.innerHTML = `<button class="primary" id="tarotAskBtn">${t('tarot.askBtn')}</button><button class="soft" id="tarotResetBtn">${t('tarot.resetBtn')}</button>`;
          $('#tarotAskBtn')?.addEventListener('click', () => {
            $('#oracle .oracle-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => $('#aiQuestion')?.focus(), 400);
          });
          $('#tarotResetBtn')?.addEventListener('click', reset);
        }, 650);
      }
    }

    function startDraw() {
      const orbitWrap = $('.tarot-orbit-wrap', el);
      if (orbitWrap) orbitWrap.style.display = 'none';
      const fan = $('#tarotFan');
      deckForRound = shuffle(DECK).slice(0, FAN_SIZE);
      fan.innerHTML = deckForRound.map(c => card(c)).join('');
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
