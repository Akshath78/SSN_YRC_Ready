# READY outcomes

- [x] **Logged-out first experience:** Open READY without a required sign-in, show no invented profile/streak/XP, and let a guest browse and learn immediately.
- [x] **Optional real auth:** Provide Google OAuth sign-in/sign-out, explain that auth syncs progress, preserve the application-owned session flow, and keep guest progress local.
- [x] **Complete open course catalog:** Make Preparedness Basics, Clear Communication, Fire Safety, Flood Safety, Earthquake Ready, First Aid Basics and Help Others available from the catalog, with no course locked behind another course.
- [x] **Proper course content:** Give every course four content-backed lessons with explanations, scenario questions, answer choices, correct-answer rationale and a practical takeaway.
- [x] **Course lesson progression:** Start new courses at lesson one, continue from the first incomplete lesson, gate Next lesson behind a correct answer, show progress, allow retry, award XP only for newly completed lessons, and allow completed courses to be reviewed without farming XP.
- [x] **Daily preparedness activity:** Provide a working scenario question with correct/incorrect feedback, retry behavior, +10 XP, a completion state and a streak increment.
- [x] **Working practice hub:** Provide Quick Decisions, Spot the Hazard, What Would You Do? and Build the Sequence games with real questions, answer feedback, progression and XP rewards.
- [x] **Practical Emergency Assistant:** Provide Fire, Flood, Earthquake, Medical emergency, Electrical hazard and Other flows with four clear next-step cards, tips and an emergency-call prompt without XP or streak pressure.
- [x] **Activity-derived progress:** Calculate readiness percentage, lesson counts, course completion, streak, XP and badges from actual activity state; show all seven modules in the progress view.
- [x] **Authenticated persistence:** Save signed-in user progress through protected tRPC procedures and the managed `user_progress` table, while retaining local guest state.
- [x] **Responsive visual system:** Keep the brighter Duolingo-adjacent learning-app language with original READY branding, clear hierarchy, tactile controls, course colors, mobile navigation and readable content.
