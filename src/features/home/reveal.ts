/**
 * Below-the-fold reveal (opacity + 8 px translate), added by JS only:
 * without JS, or with reduced motion, everything stays visible.
 * The hero is never animated.
 */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!REDUCED && "IntersectionObserver" in window) {
  const below = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.remove("is-pending");
        el.classList.add("is-in");
        observer.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (const el of below) {
    el.classList.add("is-pending");
    observer.observe(el);
  }
}
