import type { Home } from "./types.ts";

/**
 * EN home copy: same shape and same list lengths as ./home.fr.ts (parity test). The French
 * text is the reference. Portfolio first; the offers are one short section near the bottom
 * (no prices, it only asks to get in touch).
 */
export const homeEn: Home = {
  meta: {
    title: "Syliane Saadbouzid — Web developer, portfolio and CV",
    description:
      "Portfolio and CV of Syliane Saadbouzid: web developer in Algiers, third-year student at USTHB. Live projects, studies and skills (TypeScript, Next.js, Python).",
  },
  hero: {
    eyebrow: "Algiers · USTHB, 3rd year · self-employed",
    name: "Syliane Saadbouzid",
    role: "Full-stack web developer and automation",
    lede: "A third-year engineering student at USTHB with an internship at Alcodefi, I build websites, web apps and automations. Here is what I have built.",
    ctaPrimary: { label: "Send a message", href: "#contact" },
    ctaSecondary: { label: "Download the CV (PDF)", href: "/cv/syliane-saadbouzid-cv-en.pdf" },
  },
  services: {
    heading: "Working together",
    intro: "I also take on freelance work.",
    items: [
      {
        ref: "S-01",
        title: "Websites and online shops",
        summary: "From a showcase site to a custom shop.",
      },
      {
        ref: "S-02",
        title: "Automation",
        summary: "Power Automate, n8n, Python, local AI: fewer repetitive tasks.",
      },
    ],
    cta: "Get in touch",
  },
  work: {
    heading: "Work",
    intro: "",
    cases: [
      {
        slug: "alcodefi",
        kind: "real",
        status: "verified-live",
        stampLabel: "Live",
        title: "Alcodefi website",
        liveLabel: "View the Alcodefi website",
        shotAlt:
          "Home page of the Alcodefi website, desktop version: contact bar, menu, slogan “Notre défi, votre réussite.”, a training search box and the start of the list of upcoming sessions.",
        summary:
          "Website of a state-approved vocational training institute in Algiers: course catalogue, session schedule and contact.",
        statusNote: "Built during my internship.",
        role: "Web development, during my internship at Alcodefi.",
        stack: ["Next.js", "React", "Vercel"],
        links: { live: "https://www.alcodefi.org/" },
      },
      {
        slug: "creche-des-anges",
        kind: "real",
        status: "wip",
        stampLabel: "In progress",
        title: "Crèche des Anges",
        summary:
          "Bilingual showcase site, in French and Arabic (right-to-left), for a nursery and preschool in Algiers.",
        statusNote: "Not published yet.",
        role: "Design and development.",
        stack: ["Astro", "TypeScript", "Vercel"],
        links: {},
      },
      {
        slug: "blaze-type",
        kind: "engineering",
        status: "verified-live",
        stampLabel: "Live",
        title: "Blaze Type",
        liveLabel: "View Blaze Type live",
        shotAlt:
          "Blaze Type during a test: a text to copy with the correct letters in green and a mistake in red, with the speed (WPM), accuracy and timer shown at the top.",
        summary: "Web app that tests typing speed.",
        statusNote: "No client order.",
        role: "Design and development, solo.",
        stack: ["JavaScript", "CSS", "Vercel"],
        links: { live: "https://blaze-type.vercel.app/" },
      },
      {
        slug: "shellmates",
        kind: "real",
        status: "verified-live",
        stampLabel: "Live",
        title: "Shellmates club website",
        liveLabel: "View the Shellmates website",
        shotAlt:
          "Home page of the Shellmates club website, desktop version: the title “This is Shellmates Club”, a short presentation of the club and a “Join Us!” button on a dark circuit-pattern background.",
        summary: "Website of the USTHB cybersecurity club.",
        statusNote: "Built as a team, not alone.",
        role: "Former member of the club's development department (2024-2025).",
        stack: ["Next.js", "TypeScript", "Tailwind CSS"],
        links: { live: "https://www.shellmates.club/" },
      },
      {
        slug: "boutique-sur-mesure",
        kind: "engineering",
        status: "exploration",
        stampLabel: "Exploration",
        title: "Custom online shop",
        summary:
          "Reusable shop base: catalogue, checkout, cash on delivery, back-office, French and Arabic (RTL).",
        statusNote: "Private code, walkthrough on request.",
        role: "Design and development.",
        stack: ["Next.js", "TypeScript", "PostgreSQL", "Vitest", "Strict CSP", "Vercel"],
        links: {},
      },
    ],
    conceptsNote: "Technical base, not commissioned by a client.",
    cta: "Get in touch",
  },
  about: {
    heading: "About",
    pull: "I prefer to show what is delivered: the links in the Work section lead to sites you can open.",
    paragraphs: [
      "I am a web developer in Algiers and I work self-employed: I build websites, web apps and automations (e-mails, documents, APIs).",
      "A third-year computer science engineering student at USTHB (cybersecurity specialty), I did an internship at Alcodefi, in web development and data management: handling paper and digital files, checking errors when paper records are keyed into digital form, importing data into Excel, organising folders.",
      "I build automations with Power Automate, n8n and Python, adding AI (Ollama, llama.cpp). I know how to use Hermes and OpenClaw, and I am fluent in Bash and Claude Code. On the web side, my main tools are TypeScript, Next.js, Python and PostgreSQL. I was part of the development department of the Shellmates club.",
      "My code is on [GitHub](https://github.com/0xSyliane) and my background on [LinkedIn](https://www.linkedin.com/in/syliane-saadbouzid-a9278a395/).",
    ],
  },
  cvteaser: {
    text: "Projects, studies and skills on one page.",
    viewLabel: "View the CV",
    downloadLabel: "Download the CV (PDF)",
  },
  contact: {
    heading: "Contact",
    intro:
      "A question, a proposal, an internship or a project? Write me a few lines: an e-mail is enough, there is no form.",
    emailLabel: "Write an e-mail",
    emailNoScript: "E-mail address: enable JavaScript to show it, or reach me on LinkedIn or GitHub.",
    email: { local: "sylianesaadbouzide", domain: "gmail.com", subject: "Getting in touch" },
    linkedin: {
      label: "Contact me on LinkedIn",
      href: "https://www.linkedin.com/in/syliane-saadbouzid-a9278a395/",
    },
    github: { label: "See my GitHub", href: "https://github.com/0xSyliane" },
  },
  footer: {},
};
