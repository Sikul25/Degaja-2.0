(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    user: JSON.parse(localStorage.getItem("degajaUser") || "null"),
    authMode: "signin",
    freeUsed: localStorage.getItem("degajaFreeUsed") === "1",
    paidAccess: localStorage.getItem("degajaPaidAccess") === "1"
  };

  const modal = $("#modal");
  const modalContent = $("#modalContent");

  function openModal(html) {
    if (!modal || !modalContent) return;
    modalContent.innerHTML = html;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  function saveUser(user) {
    state.user = user;
    localStorage.setItem("degajaUser", JSON.stringify(user));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function authView(mode = state.authMode) {
    state.authMode = mode;
    const isSignup = mode === "signup";

    openModal(`
      <div class="eyebrow">DEGAJA</div>
      <h2>${isSignup ? "Konto erstellen" : "Willkommen zurück"}</h2>
      <p style="color:#687384">
        ${isSignup
          ? "Erstelle dein persönliches DEGAJA-Konto und speichere deine Lesungen."
          : "Melde dich an, um deine Sessions und dein DEGAJA-Erlebnis zu verwalten."}
      </p>
      <div class="auth-tabs">
        <button class="auth-tab ${isSignup ? "active" : ""}" data-auth="signup">Konto erstellen</button>
        <button class="auth-tab ${!isSignup ? "active" : ""}" data-auth="signin">Anmelden</button>
      </div>
      <form class="auth-form" id="authForm">
        ${isSignup ? `
          <label>Vor- und Nachname
            <input id="authName" required autocomplete="name" placeholder="Dein Name">
          </label>` : ""}
        <label>E-Mail-Adresse
          <input id="authEmail" type="email" required autocomplete="email" placeholder="name@beispiel.de">
        </label>
        <label>Passwort
          <input id="authPassword" type="password" required minlength="6" autocomplete="${isSignup ? "new-password" : "current-password"}" placeholder="Mindestens 6 Zeichen">
        </label>
        <button class="primary" type="submit">${isSignup ? "Konto erstellen" : "Anmelden"}</button>
      </form>
      <p id="authMessage" style="min-height:20px;color:#687384;font-size:13px"></p>
    `);

    $$('[data-auth]').forEach(btn => {
      btn.addEventListener("click", () => authView(btn.dataset.auth));
    });

    $("#authForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const email = $("#authEmail").value.trim().toLowerCase();
      const password = $("#authPassword").value;
      const message = $("#authMessage");

      if (password.length < 6) {
        message.textContent = "Bitte verwende mindestens 6 Zeichen für dein Passwort.";
        return;
      }

      if (isSignup) {
        const name = $("#authName").value.trim();
        if (!name) {
          message.textContent = "Bitte gib deinen Namen ein.";
          return;
        }
        saveUser({ name, email, createdAt: new Date().toISOString() });
        message.textContent = "Konto erstellt. Willkommen bei DEGAJA.";
        setTimeout(closeModal, 500);
        return;
      }

      if (!state.user || state.user.email !== email) {
        message.textContent = "Kein DEGAJA-Konto mit dieser E-Mail-Adresse gefunden.";
        return;
      }
      closeModal();
    });
  }

  function accountView() {
    if (!state.user) {
      authView("signin");
      return;
    }

    openModal(`
      <div class="eyebrow">DEIN DEGAJA SPACE</div>
      <h2>Hallo, ${escapeHtml(state.user.name)}</h2>
      <div class="account-panel">
        <div class="account-row"><span>E-Mail</span><strong>${escapeHtml(state.user.email)}</strong></div>
        <div class="account-row"><span>Zugang</span><strong>${state.paidAccess ? "Aktiv" : "Kostenlose Demo"}</strong></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
        <button class="primary" id="profileClose">Schließen</button>
        <button class="secondary" id="signOut">Abmelden</button>
      </div>
    `);

    $("#profileClose")?.addEventListener("click", closeModal);
    $("#signOut")?.addEventListener("click", () => {
      localStorage.removeItem("degajaUser");
      state.user = null;
      closeModal();
    });
  }

  async function getOracle(question, topic, mode = "free") {
    try {
      const response = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, topic, mode })
      });

      if (!response.ok) throw new Error("API nicht verfügbar");
      const data = await response.json();
      if (!data.text) throw new Error("Keine Antwort erhalten");
      return data.text;
    } catch (error) {
      const topicText = topic || "dein Anliegen";
      return mode === "free"
        ? `Dein Thema ist **${topicText}**. Nimm dir einen Moment und höre auf das, was sich für dich wirklich stimmig anfühlt. Deine Frage: „${question}“. Diese erste Deutung ist dein kostenloser Impuls. Für eine tiefere persönliche Lesung mit anschließender 24/7-Begleitung kannst du jederzeit freischalten.`
        : `DEGAJA ist für dich da. Wir betrachten dein Thema „${topicText}“ Schritt für Schritt und bleiben bei deiner Frage: „${question}“. Du kannst jederzeit weiterfragen.`;
    }
  }

  function showPurchaseModal() {
    openModal(`
      <div class="eyebrow">DEGAJA · 24/7</div>
      <h2>Geh tiefer</h2>
      <p style="color:#687384">Deine erste Antwort war kostenlos. Schalte jetzt eine tiefere persönliche Lesung mit anschließender 24/7-Begleitung frei.</p>
      <div class="pricing-grid" style="grid-template-columns:1fr;gap:10px">
        <button class="price-btn" data-checkout="single">Eine Lesung · €4,99</button>
        <button class="price-btn" data-checkout="pack">3 Lesungen · €9,99</button>
      </div>
      <p class="pay-note">Einmalige Zahlung · keine automatische Verlängerung.</p>
    `);

    $$('[data-checkout]').forEach(btn => {
      btn.addEventListener("click", () => startCheckout(btn.dataset.checkout));
    });
  }

  async function startCheckout(product) {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product })
      });

      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Zahlung nicht verfügbar");
      window.location.href = data.url;
    } catch (error) {
      openModal(`
        <div class="eyebrow">DEGAJA</div>
        <h2>Zahlung vorbereiten</h2>
        <p style="color:#687384">Der Checkout ist vorbereitet. Für echte Zahlungen muss noch der Zahlungsanbieter mit seinem geheimen Schlüssel in Vercel verbunden werden.</p>
        <button class="primary" id="backToOracle">Zurück zum Orakel</button>
      `);
      $("#backToOracle")?.addEventListener("click", closeModal);
    }
  }

  function renderResult(text, question, topic, paid = false) {
    const result = $("#aiResult");
    if (!result) return;

    const safeText = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    result.innerHTML = `
      <strong>${paid ? "DEGAJA · Deine persönliche Lesung" : "DEGAJA · Deine erste Antwort"}</strong>
      <p style="margin:8px 0;color:#596273">${safeText}</p>
      <div style="font-size:13px;color:#687384"><b>Deine Frage:</b> ${escapeHtml(question)}</div>
      ${paid ? `
        <div class="chat-box">
          <div class="badge">24/7 BEGLEITUNG</div>
          <div class="chat-messages" id="chatMessages">
            <div class="chat-msg ai">Ich bin hier. Du kannst zu deiner Lesung jederzeit weiterfragen.</div>
          </div>
          <div class="chat-row">
            <input id="chatInput" placeholder="Stelle eine weitere Frage …" aria-label="Weitere Frage">
            <button id="chatSend">Senden</button>
          </div>
        </div>` : `
        <div style="margin-top:14px"><button class="price-btn" id="deepBtn">✨ Tiefer gehen · €4,99</button></div>`}
    `;

    result.classList.add("show");
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("#deepBtn")?.addEventListener("click", showPurchaseModal);

    if (paid) {
      $("#chatSend")?.addEventListener("click", sendChat);
      $("#chatInput")?.addEventListener("keydown", event => {
        if (event.key === "Enter") sendChat();
      });
    }
  }

  async function sendChat() {
    const input = $("#chatInput");
    const text = input?.value.trim();
    if (!text) return;
    const messages = $("#chatMessages");
    if (!messages) return;

    messages.insertAdjacentHTML("beforeend", `<div class="chat-msg user">${escapeHtml(text)}</div>`);
    input.value = "";
    messages.insertAdjacentHTML("beforeend", `<div class="chat-msg ai" id="typing">DEGAJA denkt nach …</div>`);
    messages.scrollTop = messages.scrollHeight;

    const question = $("#aiQuestion")?.value.trim() || "";
    const topic = $("#aiTopic")?.value || "";
    const answer = await getOracle(`${question}\n\nFollow-up: ${text}`, topic, "paid");

    $("#typing")?.remove();
    messages.insertAdjacentHTML("beforeend", `<div class="chat-msg ai">${escapeHtml(answer).replace(/\n/g, "<br>")}</div>`);
    messages.scrollTop = messages.scrollHeight;
  }

  function consultationView(type = "scheduled") {
    const urgent = type === "urgent";
    openModal(`
      <div class="consult-modal">
        <div class="eyebrow">${urgent ? "🔥 SOFORTBERATUNG" : "🎧 PERSÖNLICHE BERATUNG"}</div>
        <h2>${urgent ? "Du möchtest jetzt sprechen?" : "Wähle deine Beratung"}</h2>
        <p style="color:#687384">${urgent ? "Sende deine Anfrage. Unsere Expertin prüft ihre aktuelle Verfügbarkeit und wir versuchen, den direkten Audio-Kontakt innerhalb von 10–30 Minuten herzustellen." : "Wähle deine Dauer und vereinbare einen Termin für ein vertrauliches Audio-Gespräch."}</p>
        <div class="consult-options">
          <button class="consult-option" data-duration="15"><span><strong>15 Minuten</strong><small>Persönliches Audio-Gespräch</small></span><b>${urgent ? "€24,99" : "€19,99"}</b></button>
          <button class="consult-option" data-duration="30"><span><strong>30 Minuten</strong><small>Persönliches Audio-Gespräch</small></span><b>${urgent ? "€34,99" : "€29,99"}</b></button>
          <button class="consult-option" data-duration="60"><span><strong>60 Minuten</strong><small>Persönliches Audio-Gespräch</small></span><b>${urgent ? "€54,99" : "€49,99"}</b></button>
        </div>
        <div id="consultFormWrap" style="display:none"></div>
        <div class="consult-hint">Diskret & privat · Nur Audio · Keine Weitergabe deiner privaten Telefonnummer</div>
      </div>
    `);

    $$(".consult-option").forEach(option => {
      option.addEventListener("click", () => showConsultForm(urgent, option.dataset.duration));
    });
  }

  function showConsultForm(urgent, duration) {
    const wrap = $("#consultFormWrap");
    if (!wrap) return;

    const price = urgent
      ? ({ "15": "24,99", "30": "34,99", "60": "54,99" }[duration] || "24,99")
      : ({ "15": "19,99", "30": "29,99", "60": "49,99" }[duration] || "19,99");

    wrap.style.display = "block";
    wrap.innerHTML = `
      <div class="selected-consult">${urgent ? "🔥 Sofortberatung" : "🎧 Beratung nach Termin"} · ${duration} Min · €${price}</div>
      <form class="consult-form" id="consultForm" style="margin-top:12px">
        <label>Name<input id="consultName" required autocomplete="name" value="${escapeHtml(state.user?.name || "")}" placeholder="Dein Name"></label>
        <label>E-Mail-Adresse<input id="consultEmail" type="email" required autocomplete="email" value="${escapeHtml(state.user?.email || "")}" placeholder="name@beispiel.de"></label>
        ${urgent ? `<label>Was beschäftigt dich gerade?<textarea id="consultMessage" maxlength="600" placeholder="Ein paar Worte helfen unserer Expertin, dich besser zu verstehen."></textarea></label>` : `<label>Wunschzeit<input id="consultTime" type="datetime-local" required></label>`}
        <button class="consult-submit" type="submit">${urgent ? "Sofortberatung anfragen →" : "Beratung anfragen →"}</button>
      </form>
      <p class="consult-hint" style="margin-top:10px">Die Anfrage wird erst nach Verbindung des DEGAJA-Beratungssystems tatsächlich übermittelt. Es wird keine private Telefonnummer benötigt.</p>
    `;

    $("#consultForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const payload = {
        type: urgent ? "urgent" : "scheduled",
        duration: Number(duration),
        name: $("#consultName")?.value.trim(),
        email: $("#consultEmail")?.value.trim(),
        message: $("#consultMessage")?.value.trim() || "",
        requestedTime: $("#consultTime")?.value || ""
      };

      const button = $("#consultForm button");
      if (button) {
        button.disabled = true;
        button.textContent = "Anfrage wird vorbereitet …";
      }

      try {
        const response = await fetch("/api/consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.error || "Beratungssystem nicht verfügbar");

        wrap.innerHTML = `<div class="success-box"><strong>Deine Anfrage ist angekommen.</strong><br>Wir melden uns mit den nächsten Schritten. Für die Audio-Beratung brauchst du keine private Telefonnummer.</div>`;
      } catch (error) {
        if (button) {
          button.disabled = false;
          button.textContent = urgent ? "Sofortberatung anfragen →" : "Beratung anfragen →";
        }
        const hint = document.createElement("div");
        hint.className = "consult-hint";
        hint.style.marginTop = "8px";
        hint.style.color = "#8a6b32";
        hint.textContent = "Die Oberfläche ist bereit. Die echte Übermittlung wird mit dem DEGAJA-Beratungssystem verbunden.";
        wrap.appendChild(hint);
      }
    });
  }

  $("#aiBtn")?.addEventListener("click", async () => {
    const question = $("#aiQuestion")?.value.trim() || "";
    const topic = $("#aiTopic")?.value || "";
    const result = $("#aiResult");

    if (!question) {
      if (result) {
        result.innerHTML = "<strong>Bitte beschreibe kurz, was dich beschäftigt.</strong>";
        result.classList.add("show");
      }
      return;
    }

    const button = $("#aiBtn");
    if (button) {
      button.disabled = true;
      button.textContent = "DEGAJA liest …";
    }

    const text = await getOracle(question, topic, "free");
    state.freeUsed = true;
    localStorage.setItem("degajaFreeUsed", "1");
    renderResult(text, question, topic, false);

    if (button) {
      button.disabled = false;
      button.textContent = "Kostenlose erste Antwort →";
    }
  });

  $$('[data-buy]').forEach(btn => {
    btn.addEventListener("click", () => startCheckout(btn.dataset.buy));
  });

  $$('[data-consult]').forEach(btn => {
    btn.addEventListener("click", () => consultationView(btn.dataset.consult));
  });

  $("#loginBtn")?.addEventListener("click", () => {
    state.user ? accountView() : authView("signin");
  });

  $("#accountBtn")?.addEventListener("click", accountView);
  $("#closeModal")?.addEventListener("click", closeModal);

  modal?.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });
})();
