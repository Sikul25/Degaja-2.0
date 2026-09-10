(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    user: JSON.parse(localStorage.getItem("degajaUser") || "null"),
    authMode: "signin"
  };

  const modal = $("#modal");
  const modalContent = $("#modalContent");

  function openModal(html) {
    modalContent.innerHTML = html;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  function saveUser(user) {
    state.user = user;
    localStorage.setItem("degajaUser", JSON.stringify(user));
  }

  function authView(mode = state.authMode) {
    state.authMode = mode;
    const isSignup = mode === "signup";

    openModal(`
      <div class="eyebrow">DEGAJA 2.0</div>
      <h2>${isSignup ? "Konto erstellen" : "Willkommen zurück"}</h2>
      <p style="color:#687384">
        ${isSignup ? "Erstelle dein persönliches DEGAJA-Konto." : "Melde dich an, um deine Sessions und Favoriten zu verwalten."}
      </p>
      <div class="auth-tabs">
        <button class="auth-tab ${isSignup ? "active" : ""}" data-auth="signup">Konto erstellen</button>
        <button class="auth-tab ${!isSignup ? "active" : ""}" data-auth="signin">Anmelden</button>
      </div>
      <form class="auth-form" id="authForm">
        ${isSignup ? '<label>Vor- und Nachname<input id="authName" required autocomplete="name" placeholder="Dein Name"></label>' : ""}
        <label>E-Mail<input id="authEmail" type="email" required autocomplete="email" placeholder="name@example.com"></label>
        <label>Passwort<input id="authPassword" type="password" required minlength="6" autocomplete="${isSignup ? "new-password" : "current-password"}" placeholder="Mindestens 6 Zeichen"></label>
        <button class="primary" type="submit">${isSignup ? "Konto erstellen" : "Anmelden"}</button>
      </form>
      <p id="authMessage" style="min-height:20px;color:#687384;font-size:13px"></p>
    `);

    $$('[data-auth]').forEach(btn => {
      btn.addEventListener("click", () => authView(btn.dataset.auth));
    });

    $("#authForm").addEventListener("submit", e => {
      e.preventDefault();
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
        setTimeout(closeModal, 450);
      } else {
        const stored = state.user;
        if (!stored || stored.email !== email) {
          message.textContent = "Kein lokales Konto mit dieser E-Mail gefunden.";
          return;
        }
        closeModal();
      }
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
        <div class="account-row"><span>Sessions</span><strong>0</strong></div>
        <div class="account-row"><span>Favoriten</span><strong>0</strong></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
        <button class="primary" id="profileClose">Schließen</button>
        <button class="secondary" id="signOut">Abmelden</button>
      </div>
    `);

    $("#profileClose").addEventListener("click", closeModal);
    $("#signOut").addEventListener("click", () => {
      localStorage.removeItem("degajaUser");
      state.user = null;
      closeModal();
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[char]));
  }

  function aiResult(question, topic) {
    const clean = escapeHtml(question);
    const topicText = topic ? escapeHtml(topic) : "dein Anliegen";
    return `
      <strong>DEGAJA AI – Erste Einordnung</strong>
      <p style="margin:8px 0;color:#596273">
        Danke, dass du ${topicText} mit uns teilst. DEGAJA würde dein Anliegen in einem nächsten Schritt strukturieren,
        wichtige Punkte herausarbeiten und passende Unterstützung vorschlagen.
      </p>
      <div style="font-size:13px;color:#687384"><b>Dein Anliegen:</b> ${clean}</div>
      <p style="font-size:12px;color:#8a91a0;margin-bottom:0">
        Hinweis: Diese Demo verwendet noch keine externe KI-API. Die sichere Backend-Anbindung kommt separat.
      </p>
    `;
  }

  $("#aiBtn")?.addEventListener("click", () => {
    const question = $("#aiQuestion").value.trim();
    const topic = $("#aiTopic").value;
    const result = $("#aiResult");

    if (!question) {
      result.innerHTML = "<strong>Bitte beschreibe kurz, was dich beschäftigt.</strong>";
      result.classList.add("show");
      return;
    }

    result.innerHTML = aiResult(question, topic);
    result.classList.add("show");
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("#startBtn")?.addEventListener("click", () => {
    $("#ai")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("#aiQuestion")?.focus(), 450);
  });

  $("#loginBtn")?.addEventListener("click", () => {
    state.user ? accountView() : authView("signin");
  });

  $("#accountBtn")?.addEventListener("click", accountView);

  $("#closeModal")?.addEventListener("click", closeModal);

  modal?.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  $$('[data-scroll]').forEach(btn => {
    btn.addEventListener("click", () => {
      const target = $(btn.dataset.scroll);
      target?.scrollIntoView({ behavior: "smooth" });
    });
  });

  $$(".topic-card").forEach(card => {
    card.addEventListener("click", () => {
      const title = $("strong", card)?.textContent || "Thema";
      $("#aiTopic").value = [...$("#aiTopic").options].some(o => o.text === title) ? title : "";
      $("#ai")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => $("#aiQuestion")?.focus(), 450);
    });
  });

  $$(".advisor-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".advisor-card");
      const name = $("h3", card)?.textContent || "Berater";
      const details = $("p", card)?.textContent || "";
      openModal(`
        <div class="eyebrow">SMART MATCHING</div>
        <h2>${escapeHtml(name)}</h2>
        <p style="color:#687384">${escapeHtml(details)}</p>
        <p>Dieses Profil ist für die Demo vorbereitet. Im nächsten Schritt können Verfügbarkeit, Preis, Sprache, Bewertungen und Buchung live angebunden werden.</p>
        <button class="primary" id="advisorContinue">Session starten</button>
      `);
      $("#advisorContinue").addEventListener("click", () => {
        if (!state.user) {
          authView("signin");
        } else {
          closeModal();
          $("#live")?.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  });

  $$(".plan").forEach(plan => {
    plan.addEventListener("click", () => {
      const duration = $("strong", plan)?.textContent || "Session";
      const price = $("b", plan)?.textContent || "";
      if (!state.user) {
        authView("signin");
        return;
      }
      openModal(`
        <div class="eyebrow">DEGAJA LIVE</div>
        <h2>${escapeHtml(duration)}</h2>
        <p>Ausgewählte Session: <strong>${escapeHtml(price)}</strong></p>
        <p style="color:#687384">Die Zahlungs- und Terminbuchung wird hier als nächster Backend-Schritt angebunden.</p>
        <button class="primary" id="bookingContinue">Weiter</button>
      `);
      $("#bookingContinue").addEventListener("click", closeModal);
    });
  });
})();
