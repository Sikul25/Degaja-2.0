(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const t = key => (window.degajaI18n ? window.degajaI18n.t(key) : key);
  const currentLang = () => (window.degajaI18n ? window.degajaI18n.getLang() : "de");

  async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
  window.degajaFetch = fetchWithTimeout;

  const state = {
    user: JSON.parse(localStorage.getItem("degajaUser") || "null"),
    authMode: "signin",
    freeUsed: localStorage.getItem("degajaFreeUsed") === "1",
    paidAccess: localStorage.getItem("degajaPaidAccess") === "1",
    conversationHistory: []
  };

  const AI_CREDIT_KEY = "degajaAiCredits";
  const PENDING_READING_KEY = "degajaPendingReading";
  const getAiCredits = () => Math.max(0, Number(localStorage.getItem(AI_CREDIT_KEY) || 0));
  const setAiCredits = n => localStorage.setItem(AI_CREDIT_KEY, String(Math.max(0, n)));

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
      <img src="assets/degaja-logo.png" alt="DEGAJA" class="modal-logo">
      <h2>${isSignup ? t("auth.createTitle") : t("auth.welcomeTitle")}</h2>
      <p style="color:#687384">
        ${isSignup ? t("auth.createDesc") : t("auth.welcomeDesc")}
      </p>
      <div class="auth-tabs">
        <button class="auth-tab ${isSignup ? "active" : ""}" data-auth="signup">${t("auth.tabCreate")}</button>
        <button class="auth-tab ${!isSignup ? "active" : ""}" data-auth="signin">${t("auth.tabSignin")}</button>
      </div>
      <form class="auth-form" id="authForm">
        ${isSignup ? `
          <label>${t("auth.name")}
            <input id="authName" required autocomplete="name" placeholder="${t("auth.namePlaceholder")}">
          </label>` : ""}
        <label>${t("auth.email")}
          <input id="authEmail" type="email" required autocomplete="email" placeholder="name@beispiel.de">
        </label>
        <label>${t("auth.password")}
          <input id="authPassword" type="password" required minlength="6" autocomplete="${isSignup ? "new-password" : "current-password"}" placeholder="${t("auth.passwordPlaceholder")}">
        </label>
        ${!isSignup ? `<button type="button" id="forgotPasswordBtn" class="text-button" style="font-size:12px;margin:-6px 0 4px">${t("auth.forgot")}</button>` : ""}
        <button class="primary" type="submit">${isSignup ? t("auth.submitCreate") : t("auth.submitSignin")}</button>
      </form>
      <p id="authMessage" style="min-height:20px;color:#687384;font-size:13px"></p>
    `);

    $$('[data-auth]').forEach(btn => {
      btn.addEventListener("click", () => authView(btn.dataset.auth));
    });

    $("#forgotPasswordBtn")?.addEventListener("click", () => {
      const message = $("#authMessage");
      if (message) message.textContent = t("auth.forgotMsg");
    });

    $("#authForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const email = $("#authEmail").value.trim().toLowerCase();
      const password = $("#authPassword").value;
      const message = $("#authMessage");

      if (password.length < 6) {
        message.textContent = t("auth.errPassword");
        return;
      }

      if (isSignup) {
        const name = $("#authName").value.trim();
        if (!name) {
          message.textContent = t("auth.errName");
          return;
        }
        saveUser({ name, email, createdAt: new Date().toISOString() });
        message.textContent = t("auth.successCreate");
        setTimeout(closeModal, 500);
        return;
      }

      if (!state.user || state.user.email !== email) {
        message.textContent = t("auth.errNotFound");
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
      <div class="eyebrow">${t("account.eyebrow")}</div>
      <h2>${t("account.hello")} ${escapeHtml(state.user.name)}</h2>
      <div class="account-panel">
        <div class="account-row"><span>${t("account.email")}</span><strong>${escapeHtml(state.user.email)}</strong></div>
        <div class="account-row"><span>${t("account.access")}</span><strong>${state.paidAccess ? t("account.active") : t("account.demo")}</strong></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
        <button class="primary" id="profileClose">${t("account.close")}</button>
        <button class="secondary" id="signOut">${t("account.signout")}</button>
      </div>
    `);

    $("#profileClose")?.addEventListener("click", closeModal);
    $("#signOut")?.addEventListener("click", () => {
      localStorage.removeItem("degajaUser");
      state.user = null;
      closeModal();
    });
  }

  async function getOracle(question, topic, mode = "free", history = []) {
    const lang = currentLang();
    try {
      const response = await fetchWithTimeout("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, topic, mode, history, lang })
      }, 25000);

      if (!response.ok) throw new Error("API nicht verfügbar");
      const data = await response.json();
      if (!data.text) throw new Error("Keine Antwort erhalten");
      return data.text;
    } catch (error) {
      const topicText = topic || t("fallback.topic");
      const template = mode === "free" ? t("fallback.free") : t("fallback.paid");
      return template.replace("{topic}", topicText);
    }
  }

  function stashPendingReading(question, topic) {
    if (question) localStorage.setItem(PENDING_READING_KEY, JSON.stringify({ question, topic: topic || "" }));
    else localStorage.removeItem(PENDING_READING_KEY);
  }

  function showPurchaseModal(question = "", topic = "") {
    if (getAiCredits() > 0) {
      unlockDeepReading(question, topic);
      return;
    }

    stashPendingReading(question, topic);
    openModal(`
      <div class="eyebrow">${t("purchase.eyebrow")}</div>
      <h2>${t("purchase.title")}</h2>
      <p style="color:#687384">${t("purchase.desc")}</p>
      <div class="pricing-grid" style="grid-template-columns:1fr;gap:10px">
        <button class="price-btn" data-checkout="single">${t("purchase.single")}</button>
        <button class="price-btn" data-checkout="pack">${t("purchase.pack")}</button>
      </div>
      <p class="pay-note">${t("purchase.note")}</p>
    `);

    $$('[data-checkout]').forEach(btn => {
      btn.addEventListener("click", () => startCheckout(btn.dataset.checkout));
    });
  }

  async function unlockDeepReading(question, topic) {
    if (!question) {
      document.querySelector("#oracle")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const credits = getAiCredits();
    if (credits > 0) setAiCredits(credits - 1);

    const questionField = $("#aiQuestion");
    const topicField = $("#aiTopic");
    if (questionField) questionField.value = question;
    if (topicField) topicField.value = topic || "";

    const result = $("#aiResult");
    if (result) {
      result.innerHTML = `<strong>${t("result.paidTitle")}</strong><p style="margin:8px 0;color:#596273">${t("result.readingDeeper")}</p>`;
      result.classList.add("show");
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    state.conversationHistory = [];
    const text = await getOracle(question, topic, "paid", state.conversationHistory);
    state.conversationHistory.push({ role: "user", content: question });
    state.conversationHistory.push({ role: "assistant", content: text });
    state.paidAccess = true;
    localStorage.setItem("degajaPaidAccess", "1");
    renderResult(text, question, topic, true);
  }

  async function verifyAiPayment() {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    if (params.get("payment") !== "success" || !sessionId) return;

    try {
      const response = await fetchWithTimeout(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`, {}, 15000);
      const data = await response.json();
      if (!response.ok || !data.paid || data.type !== "ai") return;

      setAiCredits(getAiCredits() + (Number(data.credits) || 1));
      state.paidAccess = true;
      localStorage.setItem("degajaPaidAccess", "1");
      history.replaceState({}, document.title, location.pathname + location.hash);

      let pending = null;
      try { pending = JSON.parse(localStorage.getItem(PENDING_READING_KEY) || "null"); } catch (_) { /* ignore */ }
      localStorage.removeItem(PENDING_READING_KEY);

      if (pending?.question) {
        await unlockDeepReading(pending.question, pending.topic || "");
        return;
      }

      const remaining = getAiCredits();
      const result = $("#aiResult");
      if (result) {
        const template = remaining === 1 ? t("result.remainingSingular") : t("result.remainingPlural");
        result.innerHTML = `<strong>${t("result.paymentSuccess")}</strong><p style="margin:8px 0;color:#596273">${template.replace("{n}", remaining)}</p>`;
        result.classList.add("show");
      }
      document.querySelector("#oracle")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      // Payment already went through on Stripe's side; nothing to recover client-side here.
    }
  }

  async function startCheckout(product) {
    try {
      const response = await fetchWithTimeout("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, lang: currentLang() })
      }, 15000);

      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Zahlung nicht verfügbar");
      window.location.href = data.url;
    } catch (error) {
      openModal(`
        <div class="eyebrow">${t("checkout.eyebrow")}</div>
        <h2>${t("checkout.title")}</h2>
        <p style="color:#687384">${t("checkout.desc")}</p>
        <button class="primary" id="backToOracle">${t("checkout.back")}</button>
      `);
      $("#backToOracle")?.addEventListener("click", closeModal);
    }
  }

  let currentTtsAudio = null;

  function speakTextBrowser(text, button) {
    try {
      if (!window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = t("speech.langCode");
      utterance.lang = langCode;
      const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith(langCode.slice(0, 2)));
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      if (button) {
        button.textContent = t("result.speakStop");
        utterance.onend = () => { button.textContent = t("result.speak"); };
      }
      speechSynthesis.speak(utterance);
    } catch (error) {
      if (button) button.textContent = t("result.speak");
    }
  }

  async function speakText(rawText, button) {
    // Strip markdown formatting (e.g. **bold**) before sending to TTS —
    // otherwise the voice literally reads the asterisks out loud.
    const text = rawText.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*/g, "");
    if (currentTtsAudio) {
      currentTtsAudio.pause();
      currentTtsAudio = null;
      if (button) button.textContent = t("result.speak");
      return;
    }
    if (window.speechSynthesis?.speaking) {
      speechSynthesis.cancel();
      if (button) button.textContent = t("result.speak");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "…";
    }

    // iOS Safari only allows audio/speech playback triggered synchronously
    // within a user gesture. Priming an <audio> element right here — before
    // the async fetch below — "unlocks" it so a later .play() call (once the
    // ElevenLabs response arrives) still works instead of silently doing
    // nothing. Wrapped defensively: if priming itself throws on some device,
    // it must never take down the rest of the function with it.
    let audio;
    try {
      audio = new Audio();
      audio.play().catch(() => {});
      audio.pause();
    } catch (error) {
      audio = null;
    }

    try {
      const response = await fetchWithTimeout("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: currentLang() })
      }, 20000);
      if (!response.ok) throw new Error("tts unavailable");

      const blob = await response.blob();
      if (!blob.size || !blob.type.startsWith("audio")) throw new Error("invalid audio response");
      if (!audio) throw new Error("audio element unavailable");

      const blobUrl = URL.createObjectURL(blob);
      audio.src = blobUrl;
      audio.onended = () => {
        if (button) button.textContent = t("result.speak");
        currentTtsAudio = null;
        URL.revokeObjectURL(blobUrl);
      };

      // play() can resolve even if the audio then fails to actually decode/play
      // (a separate "error" event fires instead) — race both so a real
      // playback failure still falls through to the browser-voice fallback.
      await new Promise((resolve, reject) => {
        audio.addEventListener("error", () => reject(new Error("audio playback error")), { once: true });
        audio.play().then(resolve, reject);
      });

      currentTtsAudio = audio;
      if (button) {
        button.disabled = false;
        button.textContent = t("result.speakStop");
      }
    } catch (error) {
      if (button) button.disabled = false;
      speakTextBrowser(text, button);
    }
  }

  function renderResult(text, question, topic, paid = false) {
    const result = $("#aiResult");
    if (!result) return;

    const safeText = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    result.innerHTML = `
      <strong>${paid ? t("result.paidTitle") : t("result.freeTitle")}</strong>
      <button type="button" id="speakBtn" class="text-button" style="display:block;margin:6px 0;font-size:13px">${t("result.speak")}</button>
      <p style="margin:8px 0;color:#596273">${safeText}</p>
      <div style="font-size:13px;color:#687384"><b>${t("result.yourQuestion")}</b> ${escapeHtml(question)}</div>
      ${paid ? `
        <div class="chat-box">
          <div class="badge">${t("result.badge247")}</div>
          <div class="chat-messages" id="chatMessages">
            <div class="chat-msg ai">${t("result.chatWelcome")}</div>
          </div>
          <div class="chat-row">
            <input id="chatInput" placeholder="${t("result.chatPlaceholder")}" aria-label="${t("result.chatPlaceholder")}">
            <button id="chatSend">${t("result.chatSend")}</button>
          </div>
        </div>` : `
        <div style="margin-top:14px"><button class="price-btn" id="deepBtn">${t("result.deepBtn")}</button></div>`}
    `;

    result.classList.add("show");
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("#deepBtn")?.addEventListener("click", () => showPurchaseModal(question, topic));
    $("#speakBtn")?.addEventListener("click", event => speakText(text, event.currentTarget));

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
    messages.insertAdjacentHTML("beforeend", `<div class="chat-msg ai" id="typing">${t("result.thinking")}</div>`);
    messages.scrollTop = messages.scrollHeight;

    const topic = $("#aiTopic")?.value || "";
    state.conversationHistory.push({ role: "user", content: text });
    const answer = await getOracle(text, topic, "paid", state.conversationHistory);
    state.conversationHistory.push({ role: "assistant", content: answer });

    $("#typing")?.remove();
    messages.insertAdjacentHTML("beforeend", `<div class="chat-msg ai">${escapeHtml(answer).replace(/\n/g, "<br>")}</div>`);
    messages.scrollTop = messages.scrollHeight;
  }

  $("#aiBtn")?.addEventListener("click", async () => {
    const question = $("#aiQuestion")?.value.trim() || "";
    const topic = $("#aiTopic")?.value || "";
    const result = $("#aiResult");

    if (!question) {
      if (result) {
        result.innerHTML = `<strong>${t("result.emptyQuestion")}</strong>`;
        result.classList.add("show");
      }
      return;
    }

    const button = $("#aiBtn");
    if (button) {
      button.disabled = true;
      button.textContent = t("result.reading");
    }

    const drawnCards = Array.isArray(window.DEGAJA_DRAWN_CARDS) ? window.DEGAJA_DRAWN_CARDS : [];
    const apiQuestion = drawnCards.length
      ? `${question}\n\n(${t("oracle.drawnCards")}: ${drawnCards.join(", ")})`
      : question;

    state.conversationHistory = [];
    const text = await getOracle(apiQuestion, topic, "free", state.conversationHistory);
    state.conversationHistory.push({ role: "user", content: question });
    state.conversationHistory.push({ role: "assistant", content: text });
    state.freeUsed = true;
    localStorage.setItem("degajaFreeUsed", "1");
    renderResult(text, question, topic, false);

    if (button) {
      button.disabled = false;
      button.textContent = t("aiBtn.default");
    }
  });

  $$('[data-buy]').forEach(btn => {
    btn.addEventListener("click", () => {
      const question = $("#aiQuestion")?.value.trim() || "";
      const topic = $("#aiTopic")?.value || "";
      stashPendingReading(question, topic);
      startCheckout(btn.dataset.buy);
    });
  });

  $("#loginBtn")?.addEventListener("click", () => {
    state.user ? accountView() : authView("signin");
  });

  $("#accountBtn")?.addEventListener("click", accountView);
  $("#closeModal")?.addEventListener("click", closeModal);

  $("#impressumLink")?.addEventListener("click", event => {
    event.preventDefault();
    openModal(`
      <h2>Impressum</h2>
      <p><strong>Sagacitas Ltd</strong><br>136 Capel Street<br>Dublin, Irland</p>
      <p>Handelsregisternummer: wird nach Abschluss der Eintragung ergänzt (Firmengründung derzeit in Bearbeitung)</p>
      <p>Kontakt: <a href="mailto:info@degaja.com">info@degaja.com</a></p>
    `);
  });

  $("#datenschutzLink")?.addEventListener("click", event => {
    event.preventDefault();
    openModal(`
      <h2>${t("legal.datenschutzTitle")}</h2>
      <p style="color:#687384;font-size:14px;line-height:1.6">${t("legal.datenschutz")}</p>
    `);
  });

  $("#agbLink")?.addEventListener("click", event => {
    event.preventDefault();
    openModal(`
      <h2>${t("legal.agbTitle")}</h2>
      <p style="color:#687384;font-size:14px;line-height:1.6">${t("legal.agb")}</p>
    `);
  });

  modal?.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  verifyAiPayment();
})();
