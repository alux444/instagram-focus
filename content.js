(() => {
  "use strict";

  const SELECTORS = {
    // Sidebar/bottom nav links
    exploreLink: 'a[href="/explore/"]',
    reelsLink: 'a[href="/reels/"]',
  };

  const SUGGESTED_TEXTS = [
    "suggested for you",
    "suggested posts",
    "suggested reels",
  ];

  function hideElement(el) {
    if (el && el.style.display !== "none") {
      el.style.display = "none";
    }
  }

  function hideNavLinks() {
    document
      .querySelectorAll(SELECTORS.exploreLink)
      .forEach((el) => hideElement(el.closest("a")?.parentElement || el));
    document
      .querySelectorAll(SELECTORS.reelsLink)
      .forEach((el) => hideElement(el.closest("a")?.parentElement || el));
  }

  function isSuggestedText(text) {
    const lower = text.trim().toLowerCase();
    return SUGGESTED_TEXTS.some((t) => lower.includes(t));
  }

  function hideSuggestedContent() {
    // Walk all small text nodes that say "Suggested for you" and nuke their
    // containing feed block.  Instagram wraps suggested post carousels and
    // "Suggested for you" headers in various containers – we climb up to the
    // nearest feed-level container and hide it.

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return isSuggestedText(node.textContent)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      let target = textNode.parentElement;

      // Climb up until we hit a major container (article, a role="presentation"
      // wrapper, or a direct child of main/feed).
      for (let i = 0; i < 15 && target; i++) {
        const tag = target.tagName?.toLowerCase();
        const role = target.getAttribute("role");

        // If we hit an <article> or a role=presentation div that looks like a
        // feed card, hide it.
        if (
          tag === "article" ||
          role === "presentation" ||
          (target.parentElement &&
            target.parentElement.getAttribute("role") === "main")
        ) {
          hideElement(target);
          break;
        }
        target = target.parentElement;
      }
    }

    // Also hide the "Suggested for you" sidebar section (right column)
    document.querySelectorAll("div").forEach((div) => {
      const span = div.querySelector(":scope > div > span, :scope > span");
      if (span && isSuggestedText(span.textContent)) {
        hideElement(div);
      }
    });
  }

  function run() {
    hideNavLinks();
    hideSuggestedContent();
  }

  let clickCount = 0;
  const successAudio = new Audio(chrome.runtime.getURL("success.mp3"));
  document.addEventListener("click", () => {
    clickCount++;
    if (clickCount % 100 === 0) {
      successAudio.currentTime = 0;
      successAudio.play();
    }
  });

  // Run immediately
  run();

  // Instagram is an SPA – observe DOM changes and re-run
  const observer = new MutationObserver(() => {
    run();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
