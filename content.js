/* ============================================================
   ANA'S WEBSITE CONTENT
   ============================================================
   This is the ONLY file you should need to edit.
   Everything in quotes " " is what shows up on the website —
   change the text between the quotes, save the file, and
   refresh the page (or re-upload if hosted online) to see it.

   Don't delete commas, colons, or curly braces { } — just edit
   the text inside the quotes. If something breaks, undo your
   last change and try again.
   ============================================================ */

const SITE_CONTENT = {

  // ---------- BASIC INFO ----------
  name: "Ana Chandlee",
  tagline: "Doctor of Physical Therapy Candidate, UIC",
  location: "Chicago, Illinois",

  // ---------- CONTACT ----------
  // Update these any time your contact info changes.
  email: "ana.chandlee@example.com",
  phone: "(555) 123-4567",
  linkedin: "https://www.linkedin.com/in/ana-chandlee", // replace with your real LinkedIn URL

  // ---------- RESUME PDF ----------
  // Optional: add a PDF of your résumé to assets/certifications (or a new
  // assets/resume folder) and put its file name here. The "Résumé" button
  // will link to it. Leave as-is if you don't want a résumé button yet.
  resume: "assets/resume/ana-chandlee-resume.pdf",

  // ---------- PHOTO ----------
  // Put your photo file inside the assets/photos folder, then
  // type its file name here (must match exactly, including .jpg or .png)
  photo: "assets/photos/ana-headshot.jpg", // already added for you

  // ---------- STATS ----------
  // Shown in the stat row under the hero. Edit the number any time.
  clinicalHours: "0", // e.g. "120" — update as your clinical hours add up

  // ---------- ABOUT ----------
  // This is your intro paragraph. Write it like you're
  // introducing yourself to someone in person.
  about: "I'm a Doctor of Physical Therapy candidate at the University of Illinois Chicago, graduating from Loras College with a Kinesiology major and Spanish and Coaching minors. I previously worked as a Physical Therapy Aide at Dubuque Physical Therapy, and I'm passionate about helping people move and feel better. Outside of school, I love staying active through sports, spending time on the river, and traveling whenever I get the chance.",

  // ---------- EDUCATION ----------
  // Add or remove entries by copying/pasting a whole { ... } block.
  // Most recent first.
  education: [
    {
      school: "University of Illinois Chicago (UIC)",
      degree: "Doctor of Physical Therapy (DPT)",
      years: "Fall 2026 – Present",
      details: "Starting Fall 2026."
    },
    {
      school: "Loras College",
      degree: "Bachelor's Degree — Kinesiology major; Spanish & Coaching minors",
      years: "Aug 2022 – May 2025",
      details: "Activities and societies: Women's Basketball, CaresLab, Duthon."
    },
    {
      school: "University of Northern Iowa",
      degree: "Coursework",
      years: "Aug 2021 – May 2022",
      details: ""
    }
  ],

  // ---------- EXPERIENCE ----------
  // Add jobs, internships, clinical hours, volunteer work, etc.
  // Add or remove entries the same way as Education above.
  experience: [
    {
      title: "Physical Therapy Aide",
      organization: "Dubuque Physical Therapy — Dubuque, Iowa",
      years: "", // add dates if you'd like them shown
      details: "Assisted physical therapists with patient care, exercises, and clinic operations."
    }
  ],

  // ---------- CERTIFICATIONS ----------
  // Put each certification PDF inside assets/certifications, then
  // list it here. The website will show a button to view/download it.
  certifications: [
    {
      name: "CPR/AED for Professional Rescuers",
      issuer: "American Red Cross",
      date: "",
      file: "assets/certifications/cpr-aed-professional-rescuers.pdf" // add the PDF with this exact file name
    },
    {
      name: "Cancer and Exercise Training for Health and Fitness Professionals",
      issuer: "Thrive Health Services",
      date: "Issued Sep 2023",
      file: "assets/certifications/cancer-exercise-training.pdf" // add the PDF with this exact file name
    }
  ],

  // ---------- LANGUAGES ----------
  languages: [
    { name: "Spanish", level: "Native or bilingual proficiency" }
  ],

  // ---------- SKILLS ----------
  // Just a simple list — add or remove lines.
  skills: [
    "Patient Communication",
    "Anatomy & Physiology",
    "Teamwork",
    "Coaching",
    "Time Management",
    "Spanish (Bilingual)"
  ]

};

