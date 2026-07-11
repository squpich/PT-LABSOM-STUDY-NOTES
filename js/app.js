
(() => {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const body = document.body;
  const root = document.documentElement;
  const sidebar = qs("#study-sidebar");
  const backdrop = qs("[data-component='backdrop']");
  const progressBar = qs("[data-progress-bar]");
  const progressLabel = qs("[data-progress-label]");
  const sections = qsa("[data-section]");
  const tocLinks = qsa(".table-of-contents a");
  const searchInput = qs("[data-search-input]");
  const searchClear = qs("[data-action='clear-search']");
  const quizForm = qs("[data-quiz-form]");
  const quizResult = qs("[data-quiz-result]");
  const scrollTopBtn = qs("[data-action='scroll-top']");

  function openSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.add("is-open");
    backdrop.hidden = false;
    body.classList.add("sidebar-open");
    qsa("[data-action='toggle-sidebar']").forEach(btn => btn.setAttribute("aria-expanded", "true"));
  }

  function closeSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.remove("is-open");
    backdrop.hidden = true;
    body.classList.remove("sidebar-open");
    qsa("[data-action='toggle-sidebar']").forEach(btn => btn.setAttribute("aria-expanded", "false"));
  }

  function toggleTheme() {
    const current = root.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("audioExamTheme", next);
    qsa("[data-action='toggle-theme']").forEach(btn => {
      btn.setAttribute("aria-pressed", String(next === "dark"));
      btn.textContent = next === "dark" ? "Tema claro" : "Tema escuro";
    });
  }

  function restoreTheme() {
    const saved = localStorage.getItem("audioExamTheme");
    if (saved === "dark" || saved === "light") {
      root.dataset.theme = saved;
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      root.dataset.theme = "dark";
    } else {
      root.dataset.theme = "light";
    }
    qsa("[data-action='toggle-theme']").forEach(btn => {
      const dark = root.dataset.theme === "dark";
      btn.setAttribute("aria-pressed", String(dark));
      btn.textContent = dark ? "Tema claro" : "Tema escuro";
    });
  }

  function updateProgress() {
    if (!progressBar || !progressLabel || !sections.length) return;

    const viewportMid = window.scrollY + window.innerHeight * 0.58;
    let completed = 0;

    sections.forEach(section => {
      const top = section.offsetTop;
      if (viewportMid >= top) completed += 1;
    });

    const percent = Math.min(100, Math.round((completed / sections.length) * 100));
    progressBar.value = percent;
    progressLabel.textContent = `${percent}%`;
  }

  function updateScrollTopVisibility() {
    if (!scrollTopBtn) return;
    scrollTopBtn.hidden = window.scrollY < 480;
    scrollTopBtn.classList.toggle("is-visible", window.scrollY >= 480);
  }

  function updateActiveToc() {
    let activeId = "";
    const y = window.scrollY + 170;

    sections.forEach(section => {
      if (section.offsetTop <= y) activeId = section.id;
    });

    tocLinks.forEach(link => {
      const match = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("is-active", match);
      if (match) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function handleAccordion(button) {
    const panelId = button.getAttribute("aria-controls");
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  }

  function runSearch() {
    const query = (searchInput?.value || "").trim().toLowerCase();

    sections.forEach(section => {
      section.classList.remove("search-hidden", "search-highlight");

      if (!query) return;

      const text = section.textContent.toLowerCase();
      const match = text.includes(query);
      section.classList.toggle("search-hidden", !match);
      section.classList.toggle("search-highlight", match);
    });

    if (query) {
      const first = qs("[data-section]:not(.search-hidden)");
      first?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function clearSearch() {
    if (!searchInput) return;
    searchInput.value = "";
    sections.forEach(section => section.classList.remove("search-hidden", "search-highlight"));
    searchInput.focus();
  }

  function openQuiz() {
    const quiz = qs("#quiz-panel");
    if (!quiz) return;
    quiz.scrollIntoView({ behavior: "smooth", block: "start" });
    qsa("[data-action='open-quiz']").forEach(btn => btn.setAttribute("aria-expanded", "true"));
  }

  function gradeQuiz(event) {
    event.preventDefault();
    if (!quizForm || !quizResult) return;

    const questions = qsa("[data-question-id]", quizForm);
    let correct = 0;
    let answered = 0;

    questions.forEach(question => {
      question.classList.remove("is-correct", "is-wrong");
      const selected = qs("input[type='radio']:checked", question);
      if (!selected) return;

      answered += 1;
      const isCorrect = selected.value === question.dataset.correctAnswer;
      question.classList.add(isCorrect ? "is-correct" : "is-wrong");
      if (isCorrect) correct += 1;
    });

    if (answered < questions.length) {
      quizResult.textContent = `Отвечено: ${answered} из ${questions.length}. Заполни все вопросы.`;
      return;
    }

    const percent = Math.round((correct / questions.length) * 100);
    quizResult.textContent = `Результат: ${correct}/${questions.length} — ${percent}%.`;
  }

  function resetQuiz() {
    if (!quizForm || !quizResult) return;
    qsa("[data-question-id]", quizForm).forEach(q => q.classList.remove("is-correct", "is-wrong"));
    quizResult.textContent = "";
  }

  document.addEventListener("click", event => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    if (action === "toggle-sidebar") openSidebar();
    if (action === "close-sidebar") closeSidebar();
    if (action === "toggle-theme") toggleTheme();
    if (action === "toggle-accordion") handleAccordion(actionEl);
    if (action === "clear-search") clearSearch();
    if (action === "open-quiz") openQuiz();
    if (action === "reset-quiz") resetQuiz();
    if (action === "scroll-top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  tocLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 1000) closeSidebar();
    });
  });

  searchInput?.addEventListener("input", runSearch);
  searchClear?.addEventListener("click", clearSearch);
  quizForm?.addEventListener("submit", gradeQuiz);
  quizForm?.addEventListener("reset", () => requestAnimationFrame(resetQuiz));

  window.addEventListener("scroll", () => {
    updateProgress();
    updateActiveToc();
    updateScrollTopVisibility();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1000) closeSidebar();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSidebar();

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSidebar();
      setTimeout(() => searchInput?.focus(), 120);
    }
  });

  restoreTheme();
  updateProgress();
  updateActiveToc();
})();
