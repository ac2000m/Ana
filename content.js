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

  // ---------- RESUME, PHOTOS & CREDENTIALS ----------
  // These are now best managed from the Edit page (admin.html) — log in
  // there and use the "Upload" buttons. Uploaded files get saved to the
  // site automatically, no code edits needed.
  // The values below are just the starting defaults before anything's
  // been uploaded.
  resume: "",

  // ---------- PHOTOS ----------
  // First photo should be the headshot — it shows by default.
  // Add more photos to the array and visitors can click the arrow to see them.
  // Put each photo file inside the assets/photos folder, then list its file name here.
  photos: [
    "assets/photos/ana-headshot.jpg" // starting default — replace via the Edit page
  ],

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

  // ---------- CREDENTIALS (starting defaults) ----------
  // Certifications, diploma, transcript — anything you want people to view.
  // Best managed from the Edit page (admin.html) now — upload files there
  // and they get added automatically. These are just the starting defaults.
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
    // Example — uncomment and fill in once you've added the file:
    // {
    //   name: "Loras College Diploma",
    //   issuer: "Loras College",
    //   date: "May 2025",
    //   file: "assets/certifications/loras-diploma.pdf"
    // },
    // {
    //   name: "Official Transcript",
    //   issuer: "Loras College",
    //   date: "",
    //   file: "assets/certifications/loras-transcript.pdf"
    // }
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
