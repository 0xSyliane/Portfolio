import { resolveMailto } from "../lib/contact.ts";

/**
 * Progressive enhancement of `EmailLink`. Without JS the visible `span[data-mail]` stays as a
 * plain note and the address is nowhere in the HTML. With JS the span becomes a real link, but
 * the `mailto:` is only assembled when the visitor shows intent (pointer, touch, focus) or
 * clicks, never on page load.
 */
const INTENT_EVENTS = ["pointerenter", "pointerdown", "touchstart", "focus"] as const;

const enhance = (slot: HTMLElement): void => {
  const source = slot.querySelector<HTMLElement>("[data-mail]");
  const hostNode = slot.querySelector<HTMLElement>("[data-mail-host]");
  if (!source || !hostNode) return;

  const link = document.createElement("a");
  link.className = `${source.className} is-live`.trim();
  link.href = "#";
  link.textContent = source.dataset.mailLabel ?? source.textContent;

  const assemble = (): string | undefined =>
    resolveMailto({
      user: source.dataset.mailUser,
      host: hostNode.dataset.mailHost,
      subject: source.dataset.mailSubject,
    });

  const arm = (): void => {
    if (link.getAttribute("href") !== "#") return;
    const href = assemble();
    if (href) link.setAttribute("href", href);
  };

  for (const type of INTENT_EVENTS) link.addEventListener(type, arm, { passive: true });
  // Assistive tech may click without any prior pointer or focus event.
  link.addEventListener("click", (event) => {
    if (link.getAttribute("href") !== "#") return;
    event.preventDefault();
    const href = assemble();
    if (href) window.location.assign(href);
  });

  source.replaceWith(link);
  hostNode.remove();
};

document.querySelectorAll<HTMLElement>("[data-mail-slot]").forEach(enhance);
