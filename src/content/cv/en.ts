import type { CvCopy } from "../types.ts";

/**
 * EN CV wording. Same shape and list lengths as ./fr.ts (parity test); the CV is written to be
 * read by a client (Upwork) and by an applicant-tracking system: plain words, real text, the
 * tools named once. Only facts the owner stated: nothing is invented.
 */
export const cvEn: CvCopy = {
  meta: {
    title: "Syliane Saadbouzid CV — Web developer and automation",
    description:
      "CV of Syliane Saadbouzid, web developer in Algiers, third-year USTHB student: projects, studies, skills (TypeScript, Next.js, Python, PostgreSQL). PDF.",
  },
  headings: {
    profile: "Profile",
    projects: "Experience and projects",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    links: "Links",
  },
  place: "Algiers",
  headline: "Full-stack web developer, automation and AI",
  summary:
    "Full-stack web developer based in Algiers, working remotely. I build websites, web apps and online shops (TypeScript, Next.js, Python, PostgreSQL) and automate repetitive work with n8n, Power Automate, Python and local AI models (Ollama, llama.cpp). Self-employed; third-year computer science engineering student at USTHB (cybersecurity), with an internship at Alcodefi in web development and data management. Open to remote freelance projects.",
  downloadPdf: { label: "Download the CV (PDF)", href: "/cv/syliane-saadbouzid-cv-en.pdf" },
  entries: [
    {
      id: "alcodefi-web",
      role: "Web developer intern",
      location: "Alcodefi, vocational training institute, Algiers",
      bullets: ["Web development, including the alcodefi.org website (Next.js)."],
    },
    {
      id: "boutique",
      role: "Custom online shop",
      location: "Personal project",
      bullets: [
        "Reusable shop base: catalogue, checkout with cash on delivery, back-office, French and Arabic with right-to-left layout, strict CSP, tests, deployed on Vercel.",
      ],
    },
    {
      id: "creche",
      role: "Crèche des Anges website",
      location: "Personal project, in progress",
      bullets: ["Bilingual showcase site for a nursery and preschool, in French and Arabic (right-to-left)."],
    },
    {
      id: "shellmates",
      role: "Shellmates club website",
      location: "USTHB cybersecurity club",
      bullets: ["Team project, as a member of the club's development department."],
    },
    {
      id: "blaze-type",
      role: "Blaze Type",
      location: "Solo project",
      bullets: ["Typing-speed web app with live speed (WPM) and accuracy."],
    },
    {
      id: "alcodefi-data",
      role: "Data management intern",
      location: "Alcodefi, vocational training institute, Algiers",
      bullets: [
        "Organised paper and digital files and folders.",
        "Checked errors when paper records were keyed into digital form, and imported the data into Excel.",
      ],
    },
  ],
  education: [
    {
      id: "usthb",
      degree: "Computer science engineering, cybersecurity (3rd year)",
      note: "Algiers",
    },
    {
      id: "excel",
      degree: "Excel training course",
      note: "",
    },
  ],
  skillGroups: [
    { id: "web", label: "Web" },
    { id: "backend", label: "Back-end and data" },
    { id: "automation", label: "Automation and AI" },
    { id: "integrations", label: "Integrations" },
    { id: "data", label: "Data" },
    { id: "tools", label: "Tools (Docker used occasionally)" },
  ],
  languages: [
    { code: "fr", name: "French", levelLabel: "Excellent" },
    { code: "en", name: "English", levelLabel: "Very good" },
    { code: "ar", name: "Arabic", levelLabel: "Good" },
  ],
  linkLabels: { github: "GitHub", linkedin: "LinkedIn", portfolio: "Portfolio" },
  present: "Present",
};
