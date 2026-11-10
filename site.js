(function () {
  var cfg = window.HINTU || {};
  var STORE = (cfg.appStoreUrl || "").trim();
  var SUPABASE_URL = "https://miefatxolfvpwtxovphg.supabase.co";
  var SUPABASE_KEY = "sb_publishable_noAZARGCQcSI6yQP2BnVjA_WtoZ0Erd";
  var isAndroid = /Android/i.test(navigator.userAgent || "");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // 1) Estado do lançamento: com link da App Store, os botões passam a descarregar.
  if (STORE && !isAndroid) {
    $$("[data-cta]").forEach(function (a) {
      a.setAttribute("href", STORE);
      a.setAttribute("rel", "noopener");
      var span = a.querySelector("span");
      var label = a.hasAttribute("data-cta-short") ? "Descarregar" : "Experimentar grátis no iPhone";
      if (span) span.textContent = label; else a.textContent = label;
    });
    $$("[data-store-only]").forEach(function (a) { a.hidden = false; a.setAttribute("href", STORE); });
    var micro = $("[data-micro]"); if (micro) micro.textContent = "Grátis para começar · iPhone · Sem anúncios, nunca";
    var note = $("[data-sticky-note]"); if (note) note.textContent = "Grátis para começar · Sem anúncios";
    var faq = $("[data-faq-install]"); if (faq) faq.textContent = "Pela App Store, como qualquer outra app. Toque no botão desta página ou procure por «Hintu» na App Store.";
    var t = $("[data-final-title]"); if (t) t.textContent = "Tem iPhone? Comece hoje.";
    var l = $("[data-final-lead]"); if (l) l.textContent = "Ainda sem versão para Android. Deixe o email e avisamos uma vez, quando houver. Sem newsletters.";
    var android = $('input[name="plataforma"][value="android"]'); if (android) android.checked = true;
    var sb = $('form.wait button[type="submit"]'); if (sb) sb.textContent = "Quero a versão Android";
    var when = $(".when"); if (when) when.textContent = "assim que houver versão para Android";
  }

  // 2) Android: o botão principal vai sempre para a lista de espera.
  if (isAndroid) {
    $$("[data-cta]").forEach(function (a) {
      a.setAttribute("href", "#lista");
      var svg = a.querySelector("svg"); if (svg) svg.remove();
      var span = a.querySelector("span");
      var label = a.hasAttribute("data-cta-short") ? "Versão Android" : "Quero a versão Android";
      if (span) span.textContent = label; else a.textContent = label;
    });
    var m = $("[data-micro]"); if (m) m.textContent = "Por agora só para iPhone · Android a seguir";
    var n = $("[data-sticky-note]"); if (n) n.textContent = "Por agora só iPhone · enviamos o link quando houver";
    var r = $('input[name="plataforma"][value="android"]'); if (r) r.checked = true;
    var sb2 = $('form.wait button[type="submit"]'); if (sb2) sb2.textContent = "Quero a versão Android";
    var w = $(".when"); if (w) w.textContent = "assim que houver versão para Android";
  }

  // 3) Ao ir para a lista, põe o cursor no email.
  $$('a[href="#lista"]').forEach(function (a) {
    a.addEventListener("click", function () {
      setTimeout(function () { var i = $("#email-lista"); if (i) i.focus({ preventScroll: true }); }, 450);
    });
  });

  // 4) Menu no telemóvel.
  var menuBtn = $(".menu-btn"), links = $("#nav-links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "Abrir menu"); }
    });
  }

  // 5) Botão fixo no telemóvel: aparece depois do botão do topo e esconde-se na lista.
  var sticky = $(".sticky-cta"), heroCta = $(".hero [data-cta]"), finalSec = $("#lista");
  if (sticky && heroCta && finalSec) {
    var heroVisible = true, finalVisible = false;
    var update = function () { sticky.classList.toggle("show", !heroVisible && !finalVisible); };
    try {
      new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; update(); }).observe(heroCta);
      new IntersectionObserver(function (es) { finalVisible = es[0].isIntersecting; update(); }, { threshold: 0.15 }).observe(finalSec);
    } catch (err) { sticky.classList.add("show"); }
  }

  // 6) Lista de espera: guarda o email na base de dados (só inserção; ninguém consegue ler pela internet).
  var form = $("form.wait");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#email-lista"), err = $(".err", form), btn = $('button[type="submit"]', form);
      var email = (input.value || "").trim().toLowerCase();
      var plat = ($('input[name="plataforma"]:checked', form) || {}).value || "ios";
      var showErr = function (msg) { err.textContent = msg; err.style.display = "block"; };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) { showErr("Falta um email válido."); input.focus(); return; }
      err.style.display = "none";
      var btnLabel = btn.textContent; btn.disabled = true; btn.textContent = "A enviar…";
      fetch(SUPABASE_URL + "/rest/v1/lista_espera?on_conflict=email", {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          "Prefer": "resolution=ignore-duplicates,return=minimal"
        },
        body: JSON.stringify({ email: email, plataforma: plat, origem: location.pathname || "/" })
      }).then(function (res) {
        if (!res.ok && res.status !== 409) throw new Error("http " + res.status);
        $(".who", form).textContent = email;
        if (plat === "android") { var w = $(".when", form); if (w) w.textContent = "assim que houver versão para Android"; }
        form.classList.add("done");
      }).catch(function () {
        showErr("Não conseguimos guardar agora. Tente de novo daqui a pouco ou escreva para ola@hintu.pt.");
      }).then(function () { btn.disabled = false; btn.textContent = btnLabel; });
    });
  }
})();
