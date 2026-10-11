import { buildMailto } from "../lib/contact.ts";

/**
 * Progressive enhancement: turns every `[data-mail]` element into a working
 * mailto link by assembling the address from `data-mail-user`,
 * `data-mail-domain` and `data-mail-subject`. Without JS the element keeps its
 * fallback text and the address never appears in the HTML.
 */
const enhance = (): void => {
  document.querySelectorAll<HTMLAnchorElement>("a[data-mail]").forEach((link) => {
    const href = buildMailto({
      local: link.dataset.mailUser,
      domain: link.dataset.mailDomain,
      subject: link.dataset.mailSubject,
    });
    if (!href) return;
    link.setAttribute("href", href);
    link.removeAttribute("aria-disabled");
    link.classList.add("is-live");
    const label = link.dataset.mailLabel;
    if (label) link.textContent = label;
  });
};

enhance();
