import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BellRing,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Clock3,
  Compass,
  Earth,
  Flame,
  Gamepad2,
  HandHelping,
  HeartPulse,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  PhoneCall,
  Play,
  Radio,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  Waves,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";
import { startGoogleLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type View = "learn" | "practice" | "assistant" | "progress";
type CourseId = "foundation" | "communication" | "fire" | "flood" | "earthquake" | "firstAid" | "help";
type Feedback = "correct" | "incorrect" | null;
type ProgressState = Record<CourseId, number>;

type Lesson = {
  kicker: string;
  title: string;
  body: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  takeaway: string;
};

type Course = {
  id: CourseId;
  index: string;
  title: string;
  short: string;
  description: string;
  color: string;
  icon: LucideIcon;
  lessons: Lesson[];
};

type PracticeQuestion = { prompt: string; options: string[]; answer: number; why: string };
type PracticeGame = { id: string; title: string; subtitle: string; meta: string; color: string; icon: LucideIcon; kind: "choice" | "sequence"; description: string; questions?: PracticeQuestion[]; steps?: string[] };

const emptyProgress: ProgressState = { foundation: 0, communication: 0, fire: 0, flood: 0, earthquake: 0, firstAid: 0, help: 0 };
const readLocal = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};

const rawCourses: Course[] = [
  {
    id: "foundation", index: "01", title: "Preparedness basics", short: "Start here", description: "Build a simple plan you can actually remember under stress.", color: "mint", icon: Compass,
    lessons: [
      { kicker: "Lesson 1 · Make a plan", title: "Know your first move.", body: "Preparedness is not about predicting every emergency. It is about deciding a few important things before your brain is busy.", question: "What makes an emergency plan useful?", options: ["It has clear actions and a meeting place", "It includes every possible disaster", "It stays secret so nobody worries", "It depends on one person"], answer: 0, explanation: "Simple, shared plans are easier to follow when people are tired, scared or separated.", takeaway: "Choose one nearby meeting place and one out-of-area contact." },
      { kicker: "Lesson 2 · Gather supplies", title: "Pack for the first hours.", body: "A small kit buys you time while services are busy. Keep it somewhere everyone can reach.", question: "Which item is most useful in a basic emergency kit?", options: ["Water and a flashlight", "A scented candle", "Only spare clothes", "A heavy decoration"], answer: 0, explanation: "Water, light, a first aid kit, medication and a way to receive alerts cover common early needs.", takeaway: "Check your kit twice a year and replace expired items." },
      { kicker: "Lesson 3 · Information", title: "Use reliable information.", body: "In a fast-moving situation, repeated rumors can make a safe response harder. Pause before forwarding anything.", question: "Which source should guide your next step?", options: ["Official emergency alerts", "An unverified screenshot", "A random comment", "A forwarded voice note"], answer: 0, explanation: "Official alerts and responders are responsible for current instructions in your area.", takeaway: "Save your local emergency alert and utility numbers." },
      { kicker: "Lesson 4 · Practice", title: "Make the plan familiar.", body: "A plan is more useful when people have rehearsed the first 30 seconds, not just read a checklist.", question: "What is a good way to practice?", options: ["Walk through the plan together", "Wait for a real emergency", "Keep the plan in your head", "Change the meeting place every week"], answer: 0, explanation: "A short, calm walkthrough helps children, visitors and older adults know what to do.", takeaway: "Practice one scenario with your household this week." },
    ],
  },
  {
    id: "communication", index: "02", title: "Clear communication", short: "Share what matters", description: "Send calm, useful information when every word needs to count.", color: "sky", icon: Radio,
    lessons: [
      { kicker: "Lesson 1 · Be specific", title: "Say where you are.", body: "A clear message answers the questions a responder or loved one needs first.", question: "Which message is most useful?", options: ["I am safe at the library on 4th Street", "Everything is crazy", "Come here now", "You will never believe this"], answer: 0, explanation: "Location and condition help people decide what support is needed.", takeaway: "Lead with your location, your condition and your immediate need." },
      { kicker: "Lesson 2 · Check sources", title: "Slow the rumor loop.", body: "Sharing unconfirmed information can send people toward danger or overload phone lines.", question: "Before sharing an alert, what should you do?", options: ["Check the official source and time", "Add a dramatic headline", "Forward it to everyone", "Assume it is true"], answer: 0, explanation: "Alerts change. Check the source, date, location and exact instruction.", takeaway: "A calm correction is better than a fast rumor." },
      { kicker: "Lesson 3 · Accessibility", title: "Make messages usable.", body: "People may be driving, frightened, hard of hearing or using a different language. Short words and repeatable facts help.", question: "Which message is easiest to act on?", options: ["Evacuate east via Oak Street; meet at the park", "This is a total disaster!!!", "Maybe go somewhere else", "I heard the road is bad"], answer: 0, explanation: "A direction, route and meeting point reduce guesswork.", takeaway: "Use plain language and repeat the action, not the drama." },
      { kicker: "Lesson 4 · Network", title: "Choose a contact.", body: "When local networks are busy, a trusted contact outside the area can help your household reconnect.", question: "Why choose an out-of-area contact?", options: ["They can collect updates from separated people", "They always know what happened", "They replace emergency services", "They make calls unnecessary"], answer: 0, explanation: "One contact can reduce repeated calls and give everyone a shared update.", takeaway: "Write the contact on paper as well as saving it in your phone." },
    ],
  },
  {
    id: "fire", index: "03", title: "Fire safety", short: "Leave safely", description: "Spot danger early, move away from smoke and never re-enter for belongings.", color: "coral", icon: Flame,
    lessons: [
      { kicker: "Lesson 1 · Alarm", title: "Fire spreads quickly.", body: "Your first priority is getting yourself and others away from immediate danger. Leave first and call from a safe place.", question: "The fire alarm starts ringing. What should you do first?", options: ["Leave the building safely", "Search for your belongings", "Wait and see what happens", "Use the elevator"], answer: 0, explanation: "Move away from immediate danger before calling or gathering anything.", takeaway: "If you see smoke, alert others as you leave." },
      { kicker: "Lesson 2 · Smoke", title: "Read the door.", body: "Heat and smoke can make a familiar exit unsafe. Use the back of your hand to check a door and look for another route if it feels hot.", question: "A door feels hot. What is safest?", options: ["Choose another exit", "Open it quickly", "Kick it down", "Hide in the room"], answer: 0, explanation: "A hot door may lead directly into fire. Find another safe route and stay low if there is smoke.", takeaway: "Keep two ways out of sleeping areas when possible." },
      { kicker: "Lesson 3 · Extinguishers", title: "Know your limit.", body: "Extinguishers are only for a small, contained fire when you have a clear exit behind you and the right extinguisher.", question: "When should you leave instead of fighting a fire?", options: ["When it is spreading or your exit could be blocked", "When you are curious", "When someone else has called", "When you have a phone"], answer: 0, explanation: "People should never trade a safe escape route for property. Evacuate and let trained responders handle it.", takeaway: "Never use water on an electrical or grease fire." },
      { kicker: "Lesson 4 · Re-entry", title: "Stay out.", body: "After leaving, responders need a clear scene. Smoke, heat and structural damage can remain even when flames are no longer visible.", question: "When can you go back inside?", options: ["Only when emergency services say it is safe", "When you remember your phone", "When the alarm stops", "When a neighbor says it is fine"], answer: 0, explanation: "An official all-clear is the safest signal; do not re-enter for belongings or pets.", takeaway: "Tell responders about anyone or any pet still inside." },
    ],
  },
  {
    id: "flood", index: "04", title: "Flood safety", short: "Find high ground", description: "Treat moving water as powerful, unpredictable and never worth crossing.", color: "blue", icon: Waves,
    lessons: [
      { kicker: "Lesson 1 · Move up", title: "Go to higher ground.", body: "Floodwater can rise quickly and hide holes, debris and live electricity. Move away from low ground early.", question: "What is the safest first move during a rising flood?", options: ["Move to higher ground", "Walk into the water to check it", "Wait in a basement", "Drive through it"], answer: 0, explanation: "Higher ground creates distance from moving water and gives responders more options.", takeaway: "Follow evacuation notices before roads become difficult." },
      { kicker: "Lesson 2 · Roads", title: "Turn around.", body: "Depth is hard to judge and a vehicle can lose traction in surprisingly little moving water.", question: "What should you do at a flooded road?", options: ["Turn around and find another route", "Drive faster", "Follow the car ahead", "Open the door to measure"], answer: 0, explanation: "Turn around, do not drown. Find an official alternate route.", takeaway: "Never move a barricade or drive around a closure." },
      { kicker: "Lesson 3 · Electricity", title: "Keep your distance.", body: "Water and electricity are a dangerous combination. Fallen wires may still be energized even when the power seems out.", question: "What should you do near a fallen wire?", options: ["Stay away and report it", "Move it with a stick", "Pour water on it", "Step over it"], answer: 0, explanation: "Stay far away and keep others away until trained crews make the area safe.", takeaway: "Leave wet electrical equipment alone." },
      { kicker: "Lesson 4 · Return", title: "Wait for clearance.", body: "Returning too soon can expose you to contaminated water, unstable buildings and hidden hazards.", question: "When should you return home?", options: ["After official clearance", "When the rain stops", "When neighbors return", "When the street looks dry"], answer: 0, explanation: "Official clearance accounts for roads, utilities, water quality and structural safety.", takeaway: "Photograph damage from a safe distance for your records." },
    ],
  },
  {
    id: "earthquake", index: "05", title: "Earthquake ready", short: "Drop, cover, hold", description: "Protect your head during shaking, then check for hazards before moving.", color: "amber", icon: Earth,
    lessons: [
      { kicker: "Lesson 1 · Shaking", title: "Drop, cover, hold on.", body: "Most injuries happen when people run or are hit by falling objects. Protect your head and neck under sturdy furniture.", question: "What is the best response during shaking?", options: ["Drop, cover and hold on", "Run outside immediately", "Stand in a doorway", "Use the stairs"], answer: 0, explanation: "Stay inside, get low, cover your head and hold the furniture until the shaking stops.", takeaway: "Stay away from windows and tall furniture." },
      { kicker: "Lesson 2 · Aftershocks", title: "Expect another shake.", body: "The first shaking may not be the last. Check yourself, then others, and be ready to drop, cover and hold again.", question: "What should you do after the shaking stops?", options: ["Check injuries and hazards carefully", "Light a candle immediately", "Use an elevator", "Rush into a damaged building"], answer: 0, explanation: "Check for fire, gas leaks, broken glass and structural damage before moving through a space.", takeaway: "Use a flashlight instead of an open flame." },
      { kicker: "Lesson 3 · Utilities", title: "Treat lines as live.", body: "Damage can affect gas, water and power. If you smell gas, leave immediately and call from outside.", question: "What should you do if you smell gas?", options: ["Leave and call from outside", "Turn on a light", "Search for the leak", "Use a match"], answer: 0, explanation: "Avoid switches, flames and phones near the leak. Move to fresh air first.", takeaway: "Know where your utility shutoffs are, but only use them if instructed and safe." },
      { kicker: "Lesson 4 · Buildings", title: "Leave damage behind.", body: "A building can look fine and still be unsafe. Cracks, shifting walls and unusual noises are warning signs.", question: "What is safest around a damaged building?", options: ["Stay out and follow official instructions", "Go in for valuables", "Stand under the damaged wall", "Ignore the damage"], answer: 0, explanation: "Structural damage can worsen during aftershocks. Let trained people inspect it.", takeaway: "Expect blocked roads and keep shoes, water and a radio close." },
    ],
  },
  {
    id: "firstAid", index: "06", title: "First aid basics", short: "Help safely", description: "Start with scene safety, call for help and give simple care within your training.", color: "pink", icon: HeartPulse,
    lessons: [
      { kicker: "Lesson 1 · Scene safety", title: "Check before helping.", body: "You cannot help if you become another casualty. Look for traffic, fire, electricity or violence before approaching.", question: "What comes before first aid?", options: ["Check that the scene is safe", "Move the person immediately", "Give them food", "Take a photo"], answer: 0, explanation: "Scan the scene, use gloves if available and ask for emergency help early.", takeaway: "Point to someone and give them a specific task: call emergency services." },
      { kicker: "Lesson 2 · Bleeding", title: "Use firm pressure.", body: "Severe bleeding needs direct, continuous pressure with clean cloth or gauze. Do not keep lifting the cloth to check.", question: "What helps control heavy bleeding?", options: ["Firm direct pressure", "Rinsing for several minutes", "Removing every clot", "Waiting to see if it stops"], answer: 0, explanation: "Keep pressure on and add more material on top if needed while help is coming.", takeaway: "Follow dispatcher instructions for life-threatening bleeding." },
      { kicker: "Lesson 3 · Burns", title: "Cool the burn.", body: "For a minor thermal burn, cool running water can reduce heat in the tissue. Avoid ice, butter and breaking blisters.", question: "What is a safe first step for a minor burn?", options: ["Cool it with clean running water", "Apply ice directly", "Put butter on it", "Pop the blister"], answer: 0, explanation: "Cool running water is safer than ice and helps remove residual heat.", takeaway: "Get urgent care for large, deep or electrical burns." },
      { kicker: "Lesson 4 · CPR", title: "Call and follow prompts.", body: "If someone is unresponsive and not breathing normally, call emergency services, use speakerphone and follow the dispatcher's instructions.", question: "What should you do for an unresponsive person?", options: ["Call emergency services and follow instructions", "Give them water", "Leave to find a blanket", "Wait for family"], answer: 0, explanation: "Fast activation of emergency care matters. Dispatchers can coach CPR while help is moving.", takeaway: "Use an AED if available and follow its voice prompts." },
    ],
  },
  {
    id: "help", index: "07", title: "Help others", short: "Be a good neighbor", description: "Support people without adding risk, confusion or pressure to a stressful scene.", color: "purple", icon: HandHelping,
    lessons: [
      { kicker: "Lesson 1 · Assess", title: "Help without harm.", body: "Start by checking your own safety and asking what the person needs. Respect a clear no unless there is immediate danger.", question: "What is the best first step when helping a neighbor?", options: ["Ask what they need after checking safety", "Pull them away without warning", "Assume everyone needs the same thing", "Promise everything will be fine"], answer: 0, explanation: "A calm question preserves dignity and reveals the useful next step.", takeaway: "Ask about medication, mobility, pets and communication needs." },
      { kicker: "Lesson 2 · Vulnerability", title: "Notice who needs time.", body: "Children, older adults, disabled people and people who do not speak your language may need extra time or a different way to receive information.", question: "How can you make evacuation more accessible?", options: ["Give clear, patient instructions", "Shout louder", "Leave people behind", "Hide the reason"], answer: 0, explanation: "Use plain language, visual cues and a buddy system without taking away choice.", takeaway: "Include accessibility needs in your household plan." },
      { kicker: "Lesson 3 · Teamwork", title: "Give one clear task.", body: "People act more effectively when responsibilities are specific. Ask one person to call, one to check, one to bring supplies.", question: "Which instruction is clearest?", options: ["Sam, call emergency services and use speakerphone", "Someone call", "Everybody do something", "Can anyone help?"], answer: 0, explanation: "Naming a person and a task reduces the bystander effect and duplication.", takeaway: "Confirm when the task is done and report back." },
      { kicker: "Lesson 4 · Recovery", title: "Check back in.", body: "Help does not end when the immediate danger passes. A follow-up message, meal or ride can support recovery.", question: "What is a useful follow-up?", options: ["Check in and offer a specific practical help", "Avoid them completely", "Share their story publicly", "Promise a perfect recovery"], answer: 0, explanation: "Specific offers such as a grocery trip or a phone call are easier to accept than vague promises.", takeaway: "Protect privacy and let people choose what support they want." },
    ],
  },
];

type QuestionLike = { options: string[]; answer: number };

function jumbleQuestion<T extends QuestionLike>(question: T, seed: number): T {
  const shift = seed % question.options.length;
  const options = question.options.slice(shift).concat(question.options.slice(0, shift));
  return { ...question, options, answer: (question.answer - shift + question.options.length) % question.options.length };
}

const courseCatalog: Course[] = rawCourses.map((course, courseIndex) => ({
  ...course,
  lessons: course.lessons.map((lesson, lessonIndex) => jumbleQuestion(lesson, courseIndex * 2 + lessonIndex + 1)),
}));

const rawPracticeGames: PracticeGame[] = [
  { id: "quick", title: "Quick decisions", subtitle: "Choose the safest next move", meta: "4 min", color: "mint", icon: ShieldCheck, kind: "choice", description: "Four scenarios from across the READY catalog.", questions: [
    { prompt: "You smell gas in a kitchen. What comes first?", options: ["Leave and call from outside", "Turn on a light", "Search for the leak", "Light a candle"], answer: 0, why: "Avoid sparks and move to fresh air before calling." },
    { prompt: "A flooded road is ahead. What should you do?", options: ["Turn around", "Drive faster", "Follow the car ahead", "Walk into the water"], answer: 0, why: "Moving water can sweep away vehicles and people." },
    { prompt: "Shaking starts indoors. What is safest?", options: ["Drop, cover and hold on", "Run to the stairs", "Stand by the window", "Use the elevator"], answer: 0, why: "Protect your head and neck from falling objects." },
  ] },
  { id: "hazard", title: "Spot the hazard", subtitle: "Find the hidden risk", meta: "3 min", color: "amber", icon: Search, kind: "choice", description: "Build the habit of noticing risk before it becomes an emergency.", questions: [
    { prompt: "Which setup is unsafe?", options: ["A candle beside a curtain", "A flashlight in a kit", "Shoes by the bed", "Water stored in a bottle"], answer: 0, why: "Heat sources need distance from anything that can burn." },
    { prompt: "Which detail is a flood warning?", options: ["Water moving across a road", "A clear sky", "A full phone battery", "A dry backpack"], answer: 0, why: "Never walk or drive through moving floodwater." },
    { prompt: "Which is an electrical hazard?", options: ["A fallen power line", "A labeled flashlight", "A charged radio", "A closed first aid kit"], answer: 0, why: "Treat fallen lines as live and keep people away." },
  ] },
  { id: "plan", title: "What would you do?", subtitle: "Make a calm plan", meta: "5 min", color: "sky", icon: Target, kind: "choice", description: "Practice turning information into one clear action.", questions: [
    { prompt: "Your household is separated after an evacuation. What helps?", options: ["Use the shared meeting place/contact", "Make everyone drive around", "Forward rumors", "Wait without telling anyone"], answer: 0, why: "A shared plan reduces confusion and unnecessary calls." },
    { prompt: "A neighbor needs help leaving. What is best?", options: ["Ask what they need and assign a clear task", "Pull them without warning", "Assume the answer", "Ignore them"], answer: 0, why: "Respectful, specific support preserves safety and dignity." },
    { prompt: "A responder gives new instructions. What should you do?", options: ["Follow the official update", "Keep using an old screenshot", "Argue with the messenger", "Forward both versions"], answer: 0, why: "Current official guidance should replace older information." },
  ] },
  { id: "sequence", title: "Build the sequence", subtitle: "Put the response in order", meta: "2 min", color: "coral", icon: ListChecks, kind: "sequence", description: "Order the first actions for a calm, safe response.", steps: ["Check the scene is safe", "Call for the right help", "Give simple first aid", "Stay and monitor"] },
];

const practiceExtras: Record<string, PracticeQuestion[]> = {
  quick: [
    { prompt: "A door feels hot during a fire alarm. What should you do?", options: ["Use another exit", "Open it quickly", "Wait by the door", "Kick it down"], answer: 0, why: "A hot door may lead directly into fire; choose another safe route." },
    { prompt: "Someone is unresponsive and not breathing normally. What comes first?", options: ["Call emergency services and follow instructions", "Give them water", "Leave to find a blanket", "Wait for family"], answer: 0, why: "Activating emergency care quickly gives the person the best chance." },
    { prompt: "A fallen wire is near a sidewalk. What is safest?", options: ["Keep away and report it", "Move it with a stick", "Step over it", "Pour water on it"], answer: 0, why: "Treat fallen wires as live and keep other people away." },
    { prompt: "A household member is hard of hearing during an evacuation. What helps?", options: ["Use clear visual cues and plain instructions", "Shout from far away", "Leave without explaining", "Assume they know"], answer: 0, why: "Accessible, specific instructions help everyone act safely." },
    { prompt: "After a flood, when should you return home?", options: ["After official clearance", "When the street looks dry", "When neighbors return", "When the rain stops"], answer: 0, why: "Clearance accounts for utilities, roads, water quality and structural safety." },
  ],
  hazard: [
    { prompt: "Which item should not be used on a grease fire?", options: ["Water", "A proper extinguisher", "An evacuation plan", "A clear exit"], answer: 0, why: "Water can spread burning grease." },
    { prompt: "Which location is a poor flood refuge?", options: ["A basement", "A sturdy upper floor", "Higher ground", "An official shelter"], answer: 0, why: "Basements can fill quickly and make escape difficult." },
    { prompt: "Which detail makes a building unsafe after an earthquake?", options: ["Shifting walls or unusual noises", "A charged flashlight", "A labeled kit", "A clear meeting point"], answer: 0, why: "Structural warning signs mean you should stay out and follow official guidance." },
    { prompt: "Which message is a communication hazard?", options: ["An unverified screenshot with no time or source", "An official dated alert", "A plain-language route", "A named meeting place"], answer: 0, why: "Unverified, context-free information can send people toward danger." },
    { prompt: "Which first-aid action can create another casualty?", options: ["Approaching an unsafe scene", "Calling for help", "Using gloves", "Checking the area"], answer: 0, why: "Scene safety comes before contact with an injured person." },
  ],
  plan: [
    { prompt: "What should be written on a household plan?", options: ["Meeting place and out-of-area contact", "Only a list of worries", "A secret code nobody knows", "One route for every situation"], answer: 0, why: "A shared meeting place and contact make reconnection easier." },
    { prompt: "What is the best way to give a helper a task?", options: ["Name the person and the exact task", "Ask everybody at once", "Use a vague request", "Wait silently"], answer: 0, why: "Specific assignments reduce duplication and the bystander effect." },
    { prompt: "A road is closed by responders. What is the calm plan?", options: ["Follow the official alternate route", "Move the barricade", "Follow an old map", "Drive through slowly"], answer: 0, why: "Closures protect people from hazards responders can see." },
    { prompt: "What is a helpful follow-up after an emergency?", options: ["Offer a specific practical help", "Share their story publicly", "Promise everything is fixed", "Avoid checking in"], answer: 0, why: "Specific offers respect choice and make recovery support practical." },
    { prompt: "What should you do when an alert changes?", options: ["Use the newest official instruction", "Keep forwarding both versions", "Ignore all updates", "Choose the most dramatic version"], answer: 0, why: "Current official guidance should replace older information." },
  ],
};

const practiceBank: PracticeGame[] = rawPracticeGames.map((game, gameIndex) => ({
  ...game,
  questions: game.kind === "choice" ? [...(game.questions || []), ...(practiceExtras[game.id] || [])].map((question, questionIndex) => jumbleQuestion(question, gameIndex * 3 + questionIndex + 1)) : game.questions,
}));

function Logo() { return <div className="brand-mark" aria-label="READY home"><div className="brand-shield"><ShieldCheck size={20} strokeWidth={2.6} /></div><div><div className="brand-name">READY</div><div className="brand-tag">learn to be prepared</div></div></div>; }

function TopBar({ view, setView, xp, streak, user, authLoading, onOpenAuth, onLogout }: { view: View; setView: (view: View) => void; xp: number; streak: number; user: { name?: string | null; email?: string | null } | null; authLoading: boolean; onOpenAuth: () => void; onLogout: () => void }) {
  const [accountOpen, setAccountOpen] = useState(false);
  return <header className="topbar"><Logo /><nav className="desktop-nav" aria-label="Main navigation">{(["learn", "practice", "assistant", "progress"] as View[]).map((item) => <button key={item} className={`nav-link ${view === item ? "active" : ""}`} onClick={() => setView(item)}>{item === "learn" && <BookOpen size={17} />}{item === "practice" && <Gamepad2 size={17} />}{item === "assistant" && <ShieldAlert size={17} />}{item === "progress" && <Trophy size={17} />}<span>{item[0].toUpperCase() + item.slice(1)}</span></button>)}</nav><div className="top-stats">{user && <><div className="stat-pill"><Flame size={17} fill="currentColor" /><span>{streak}</span><small>day streak</small></div><div className="stat-pill xp-pill"><Sparkles size={17} /><span>{xp}</span><small>XP</small></div></>}{authLoading ? <span className="auth-loading">Checking account…</span> : user ? <div className="account-wrap"><button className="profile-chip" aria-label="Open account" onClick={() => setAccountOpen((open) => !open)}><CircleUserRound size={21} /><span>{user.name || user.email || "Account"}</span><ChevronDown size={14} /></button>{accountOpen && <div className="account-menu"><b>{user.name || "READY learner"}</b><small>{user.email || "Progress sync is on"}</small><button onClick={onLogout}><LogOut size={15} /> Sign out</button></div>}</div> : <button className="signin-button" onClick={onOpenAuth}><LogIn size={16} /> Sign in</button>}</div></header>;
}

function BottomNav({ view, setView }: { view: View; setView: (view: View) => void }) { return <nav className="bottom-nav" aria-label="Mobile navigation">{(["learn", "practice", "assistant", "progress"] as View[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "learn" && <BookOpen size={20} />}{item === "practice" && <Gamepad2 size={20} />}{item === "assistant" && <ShieldAlert size={20} />}{item === "progress" && <Trophy size={20} />}<span>{item}</span></button>)}</nav>; }
function SectionTitle({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) { return <div className="section-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>; }
function ProgressRail({ value, color = "teal" }: { value: number; color?: string }) { return <div className={`progress-rail rail-${color}`}><div style={{ width: `${value}%` }}></div></div>; }
function FeedbackBox({ feedback, copy }: { feedback: Feedback; copy: string }) { return <div className={`feedback-box feedback-${feedback}`}><div className="feedback-mark">{feedback === "correct" ? <Check size={17} /> : <AlertTriangle size={17} />}</div><div><b>{feedback === "correct" ? "NICE WORK" : "TRY THAT AGAIN"}</b><p>{copy}</p></div></div>; }

function LearnView({ progress, dailyDone, onOpenCourse, onOpenDaily, courseQuery, setCourseQuery }: { progress: ProgressState; dailyDone: boolean; onOpenCourse: (course: Course) => void; onOpenDaily: () => void; courseQuery: string; setCourseQuery: (value: string) => void }) {
  const totalDone = Object.values(progress).reduce((sum, value) => sum + value, 0);
  const nextCourse = courseCatalog.find((course) => progress[course.id] < course.lessons.length) || courseCatalog[0];
  const visibleCourses = courseCatalog.filter((course) => `${course.title} ${course.description}`.toLowerCase().includes(courseQuery.toLowerCase()));
  return <main className="page-shell learn-page"><section className="learn-hero"><div className="hero-copy"><div className="eyebrow eyebrow-teal"><Sparkles size={14} /> YOUR PREPAREDNESS PATH</div><h1>Small steps.<br /><em>Big difference.</em></h1><p>Learn what to do in the moments that matter — one clear idea at a time.</p><div className="hero-actions"><button className="button button-primary" onClick={() => onOpenCourse(nextCourse)}><Play size={17} fill="currentColor" /> {totalDone === 0 ? "Start with the basics" : `Continue ${nextCourse.title}`} <ChevronRight size={17} /></button><span className="micro-note"><CheckCheck size={15} /> {totalDone} lessons complete</span></div></div><div className="hero-progress-card"><div className="hero-progress-ring"><span>{Math.round((totalDone / (courseCatalog.length * 4)) * 100)}%</span></div><div><b>Your readiness</b><span>{totalDone === 0 ? "Start anywhere, go at your pace." : `${courseCatalog.filter((course) => progress[course.id] === 4).length} courses completed`}</span></div></div></section><section className="daily-card"><div className="daily-icon"><Timer size={24} /></div><div className="daily-copy"><div className="eyebrow eyebrow-orange">TODAY'S PREP <span className="mini-pill">2 MIN</span></div><h2>Can you identify the safest response?</h2><p>A daily scenario keeps your instincts fresh across every course.</p></div><button className={`button ${dailyDone ? "button-success" : "button-ghost"}`} onClick={onOpenDaily}>{dailyDone ? <><CheckCircle2 size={17} /> Done for today</> : <>Start challenge <ArrowRight size={17} /></>}</button></section><section className="catalog-section"><div className="catalog-heading"><div><div className="eyebrow eyebrow-teal">THE FULL CATALOG</div><h2>Choose a course</h2><p>Every course is open. Start with the foundation or jump to what matters today.</p></div><label className="search-box"><Search size={17} /><input aria-label="Search courses" value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} placeholder="Search courses" /></label></div><div className="course-grid">{visibleCourses.map((course) => { const Icon = course.icon; const done = progress[course.id]; const percent = Math.round((done / course.lessons.length) * 100); return <article key={course.id} className={`course-card course-${course.color}`}><div className="course-card-top"><div className="course-icon"><Icon size={24} /></div><span className="course-index">{course.index}</span></div><div className="course-copy"><div className="eyebrow">{course.short}</div><h3>{course.title}</h3><p>{course.description}</p></div><div className="course-progress"><div><span>{done === 0 ? "Not started" : `${done} of ${course.lessons.length} lessons`}</span><b>{percent}%</b></div><ProgressRail value={percent} color={course.color} /></div><button className="button button-course" onClick={() => onOpenCourse(course)}>{done === 0 ? "Start course" : done === course.lessons.length ? "Review course" : "Continue"} <ArrowRight size={16} /></button></article>; })}</div>{visibleCourses.length === 0 && <div className="empty-state"><Search size={22} /><h3>No course found</h3><p>Try “fire”, “first aid” or “communication”.</p></div>}</section></main>;
}

function DailyChallenge({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [choice, setChoice] = useState<number | null>(null);
  const options = ["Move away and call from outside", "Go back to investigate", "Use the elevator to leave"];
  const correct = choice === 0;
  return <div className="modal-backdrop"><div className="modal-card daily-modal"><button className="close-modal" onClick={onClose} aria-label="Close">×</button><div className="modal-kicker"><Timer size={18} /> TODAY'S PREP · 2 MINUTES <b>+10 XP</b></div><h2>What is the safest response?</h2><div className="scenario-card"><small>SCENARIO</small><p>You notice smoke coming from a room. The alarm is sounding.</p></div><div className="option-list">{options.map((option, index) => <button key={option} className={`option-button ${choice === index ? (index === 0 ? "selected-correct" : "selected-wrong") : ""}`} onClick={() => setChoice(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{choice === index && (index === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />)}</button>)}</div>{choice !== null && <FeedbackBox feedback={correct ? "correct" : "incorrect"} copy={correct ? "Leave the danger area first, then call from somewhere safe." : "Do not investigate or use an elevator during a fire alarm."} />}<button className={`button ${correct ? "button-success" : "button-primary"} button-wide`} disabled={choice === null} onClick={correct ? onComplete : () => setChoice(null)}>{correct ? "Claim +10 XP" : "Try again"} <ArrowRight size={18} /></button></div></div>;
}

function LessonModal({ course, startingAt, onClose, onComplete }: { course: Course; startingAt: number; onClose: () => void; onComplete: (courseId: CourseId, lessonIndex: number) => void }) {
  const [lessonIndex, setLessonIndex] = useState(Math.min(startingAt, course.lessons.length - 1));
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const lesson = course.lessons[lessonIndex];
  const Icon = course.icon;
  const answer = (index: number) => { setSelected(index); setFeedback(index === lesson.answer ? "correct" : "incorrect"); };
  const next = () => { if (feedback !== "correct") return; onComplete(course.id, lessonIndex); if (lessonIndex < course.lessons.length - 1) { setLessonIndex((value) => value + 1); setSelected(null); setFeedback(null); } else { onClose(); } };
  return <div className="modal-backdrop lesson-backdrop"><div className="lesson-modal"><div className="lesson-modal-head"><button className="icon-button" onClick={onClose} aria-label="Close course"><ArrowLeft size={20} /></button><div className="lesson-course-label"><span className={`course-icon small icon-${course.color}`}><Icon size={17} /></span><b>{course.title.toUpperCase()}</b><small>Course {course.index}</small></div><span className="lesson-count">{lessonIndex + 1}/{course.lessons.length}</span></div><div className="lesson-bar"><div style={{ width: `${((lessonIndex + (feedback === "correct" ? 1 : 0)) / course.lessons.length) * 100}%` }}></div></div><div className="lesson-modal-content"><div className={`lesson-illustration lesson-art-${course.color}`}><Icon size={54} /></div><div className="eyebrow eyebrow-teal">{lesson.kicker}</div><h1>{lesson.title}</h1><p className="lesson-body">{lesson.body}</p><div className="question-card"><div className="question-label"><BellRing size={16} /> CHECK YOUR INSTINCT</div><h2>{lesson.question}</h2><div className="option-list">{lesson.options.map((option, index) => <button key={option} className={`option-button ${selected === index ? `selected-${feedback}` : ""}`} onClick={() => answer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{selected === index && (feedback === "correct" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />)}</button>)}</div></div>{feedback && <FeedbackBox feedback={feedback} copy={feedback === "correct" ? lesson.explanation : "Read the situation again and choose the action that protects people first."} />}{feedback === "correct" && <div className="takeaway"><Lightbulb size={17} /><span><b>Remember:</b> {lesson.takeaway}</span></div>}<button className="button button-primary button-wide" disabled={feedback !== "correct"} onClick={next}>{lessonIndex === course.lessons.length - 1 ? "Finish course" : "Next lesson"} <ArrowRight size={18} /></button></div></div></div>;
}

function PracticeModal({ game, onClose, onFinish }: { game: PracticeGame; onClose: () => void; onFinish: (xp: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [order, setOrder] = useState(() => game.steps ? [...game.steps].sort(() => Math.random() - 0.5) : []);
  const [finished, setFinished] = useState(false);
  const [questions] = useState<PracticeQuestion[]>(() => game.questions ? [...game.questions].sort(() => Math.random() - 0.5).slice(0, Math.min(5, game.questions.length)) : []);
  const question = questions[current] || { prompt: "", options: [], answer: 0, why: "" };
  const choose = (index: number) => { setSelected(index); setFeedback(index === question.answer ? "correct" : "incorrect"); };
  const move = (index: number, direction: number) => { const next = [...order]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setOrder(next); };
  const checkOrder = () => { const right = game.steps?.every((step, index) => step === order[index]); setFeedback(right ? "correct" : "incorrect"); };
  const advance = () => { const last = game.kind === "sequence" || current === questions.length - 1; if (last) setFinished(true); else { setCurrent((value) => value + 1); setSelected(null); setFeedback(null); } };
  return <div className="modal-backdrop"><div className="modal-card practice-modal"><button className="close-modal" onClick={onClose} aria-label="Close">×</button>{finished ? <div className="practice-complete"><div className="complete-icon"><Trophy size={32} /></div><div className="eyebrow eyebrow-teal">CHALLENGE COMPLETE</div><h2>Nice work.</h2><p>You made {game.kind === "sequence" ? "a safe sequence" : `${score} correct choices`} and kept your instincts sharp.</p><div className="xp-reward"><Sparkles size={19} /> +{game.kind === "sequence" ? 10 : Math.max(10, score * 5)} XP</div><button className="button button-primary button-wide" onClick={() => { onFinish(game.kind === "sequence" ? 10 : Math.max(10, score * 5)); onClose(); }}>Add XP and close <Check size={18} /></button></div> : <><div className="practice-modal-head"><div className={`practice-icon icon-${game.color}`}><game.icon size={25} /></div><div><div className="eyebrow eyebrow-teal">{game.meta.toUpperCase()} PRACTICE</div><h2>{game.title}</h2></div><span className="practice-counter">{game.kind === "sequence" ? "1/1" : `${current + 1}/${questions.length}`}</span></div><p className="practice-description">{game.description}</p>{game.kind === "sequence" ? <><div className="mini-prompt"><small>ORDER THE RESPONSE</small><p>Put the safest first-aid response in the right order.</p></div><div className="sequence-list">{order.map((step, index) => <div className="sequence-item" key={step}><span>{index + 1}</span><b>{step}</b><div><button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">⌃</button><button onClick={() => move(index, 1)} disabled={index === order.length - 1} aria-label="Move down">⌄</button></div></div>)}</div></> : <><div className="mini-prompt"><small>SCENARIO {current + 1}</small><p>{question.prompt}</p></div><div className="option-list">{question.options.map((option, index) => <button key={option} className={`option-button ${selected === index ? `selected-${feedback}` : ""}`} onClick={() => choose(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{selected === index && (feedback === "correct" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />)}</button>)}</div></>}{feedback && <FeedbackBox feedback={feedback} copy={feedback === "correct" ? (game.kind === "sequence" ? "The sequence keeps the helper safe and gets the right help moving." : question.why) : "Try the sequence again. Put the action that protects people first."} />}<button className="button button-primary button-wide" disabled={!feedback || feedback === "incorrect"} onClick={game.kind === "sequence" ? (feedback ? advance : checkOrder) : advance}>{feedback === "correct" ? (current === questions.length - 1 || game.kind === "sequence" ? "Finish challenge" : "Next question") : "Check answer"} <ArrowRight size={18} /></button></>}</div></div>;
}

function PracticeView({ onOpenGame }: { onOpenGame: (game: PracticeGame) => void }) { return <main className="page-shell practice-page"><SectionTitle eyebrow="PRACTICE" title="Keep your instincts fresh" copy="Short, repeatable games built from the same safety ideas in your courses." action={<div className="practice-stats"><div><Gamepad2 size={16} /> 4 games</div><div><Clock3 size={16} /> 2–5 min</div></div>} /><div className="practice-grid">{practiceBank.map((game) => { const Icon = game.icon; return <button key={game.id} className="practice-card" onClick={() => onOpenGame(game)}><div className={`practice-icon icon-${game.color}`}><Icon size={25} /></div><div className="practice-card-copy"><div className="practice-meta"><span>{game.meta}</span><ChevronRight size={16} /></div><h2>{game.title}</h2><p>{game.subtitle}</p></div><span className="practice-arrow"><ArrowRight size={16} /></span></button>; })}</div><div className="practice-banner"><div className="banner-art"><Target size={35} /></div><div><div className="eyebrow eyebrow-orange">THE POINT OF PRACTICE</div><h2>Fast choices become calmer choices.</h2><p>Repeat a little today so the first move feels familiar tomorrow.</p></div><CheckCircle2 size={34} className="banner-check" /></div></main>; }

function AssistantView() {
  const [issue, setIssue] = useState<string | null>(null); const [step, setStep] = useState(0); const [callPrompt, setCallPrompt] = useState(false);
  const issues = [{ id: "fire", label: "Fire", icon: Flame, color: "coral" }, { id: "flood", label: "Flood", icon: Waves, color: "blue" }, { id: "quake", label: "Earthquake", icon: Earth, color: "amber" }, { id: "medical", label: "Medical emergency", icon: HeartPulse, color: "pink" }, { id: "electrical", label: "Electrical hazard", icon: Zap, color: "purple" }, { id: "other", label: "Other", icon: CircleHelp, color: "sky" }];
  const steps: Record<string, { title: string; steps: string[]; tips: string[] }> = { fire: { title: "Fire", steps: ["Move away from smoke and flames.", "Leave by the nearest safe exit. Do not use the elevator.", "Call your local emergency number from a safe place.", "Stay out until emergency services say it is safe."], tips: ["If a door feels hot, choose another route.", "Stay low if there is smoke."] }, flood: { title: "Flood", steps: ["Move to higher ground and away from moving water.", "Turn around if you see water across a road or path.", "Follow local alerts and instructions.", "Wait for official clearance before returning."], tips: ["Six inches of moving water can knock you down.", "Keep children and pets close."] }, quake: { title: "Earthquake", steps: ["Drop, cover and hold on.", "Stay inside until the shaking stops.", "Check yourself and others for injuries.", "Leave damaged buildings and expect aftershocks."], tips: ["Protect your head and neck.", "Avoid windows and heavy objects."] }, medical: { title: "Medical emergency", steps: ["Check that the scene is safe.", "Call emergency services and put the phone on speaker.", "Follow the dispatcher's instructions.", "Stay with the person and monitor changes."], tips: ["Do not move someone unless there is immediate danger.", "Use a first aid kit if it is safe to do so."] }, electrical: { title: "Electrical hazard", steps: ["Keep people away from the hazard.", "Do not touch a person in contact with electricity.", "Switch off power only if you can do so safely.", "Call emergency services or the utility provider."], tips: ["Treat fallen wires as live.", "Never use water near electrical equipment."] }, other: { title: "Other situation", steps: ["Pause and move to a safer position.", "Notice what is happening and who may need help.", "Call emergency services if someone is at risk.", "Follow official instructions and check on others when safe."], tips: ["Trust clear, official information.", "Small calm actions help people think clearly."] } };
  if (!issue) return <main className="page-shell assistant-page"><section className="assistant-banner"><div><div className="eyebrow eyebrow-coral">PRACTICAL TOOL</div><h1>Emergency<br /><em>Assistant</em></h1><p>Clear next steps for when you need them. No XP. No noise.</p></div><div className="assistant-art"><PhoneCall size={42} /></div></section><div className="assistant-picker"><div className="eyebrow eyebrow-teal">FIRST, TELL US</div><h2>What is happening?</h2><p>Choose the closest match. You can change your answer.</p><div className="issue-grid">{issues.map((item) => { const Icon = item.icon; return <button key={item.id} className="issue-card" onClick={() => { setIssue(item.id); setStep(0); setCallPrompt(false); }}><span className={`issue-icon icon-${item.color}`}><Icon size={21} /></span><b>{item.label}</b><ArrowRight size={16} /></button>; })}</div><div className="assistant-disclaimer"><Lightbulb size={16} /> If someone is in immediate danger, contact your local emergency services now.</div></div></main>;
  const guide = steps[issue]; const percent = Math.round(((step + 1) / guide.steps.length) * 100);
  return <main className="page-shell assistant-page"><div className="assistant-active-head"><button className="text-button" onClick={() => setIssue(null)}><ArrowLeft size={16} /> Change situation</button><span className="issue-active"><span className={`issue-icon icon-${issues.find((item) => item.id === issue)?.color}`}><ShieldAlert size={16} /></span>{guide.title}</span></div><div className="assistant-progress-head"><span>STEP {step + 1} OF {guide.steps.length}</span><b>{percent}%</b></div><ProgressRail value={percent} color="teal" /><section className="assistant-step-card"><div className="step-number">{step + 1}</div><div><div className="eyebrow eyebrow-coral">NEXT BEST STEP</div><h2>{guide.steps[step]}</h2><p>Keep your focus on this one thing for now.</p></div></section><button className="button button-primary" onClick={() => setStep((value) => Math.min(value + 1, guide.steps.length - 1))} disabled={step === guide.steps.length - 1}>{step === guide.steps.length - 1 ? "You have the final step" : "I've done this"} <ArrowRight size={17} /></button><div className="assistant-tips"><div className="eyebrow eyebrow-teal">KEEP IN MIND</div>{guide.tips.map((tip) => <p key={tip}><Lightbulb size={15} /> {tip}</p>)}</div><div className="assistant-callout"><PhoneCall size={16} /><span>{callPrompt ? "Use your phone to call your local emergency number now." : "Need urgent help? Call your local emergency number."}</span><button onClick={() => setCallPrompt(true)} aria-label="Call emergency services"><ArrowRight size={17} /></button></div></main>;
}

function ProgressView({ progress, xp, streak, user, onKeepLearning, onOpenAuth }: { progress: ProgressState; xp: number; streak: number; user: { name?: string | null; email?: string | null } | null; onKeepLearning: () => void; onOpenAuth: () => void }) {
  const completedLessons = Object.values(progress).reduce((sum, value) => sum + value, 0); const totalLessons = courseCatalog.length * 4; const percent = Math.round((completedLessons / totalLessons) * 100); const completedCourses = courseCatalog.filter((course) => progress[course.id] === course.lessons.length);
  return <main className="page-shell progress-page"><SectionTitle eyebrow="YOUR PROGRESS" title={user ? `Keep going, ${user.name || "learner"}.` : "Your readiness, in one place."} copy={user ? "Your account keeps this progress synced across sessions." : "You can learn as a guest. Sign in when you want to sync progress."} action={!user && <button className="button button-ghost" onClick={onOpenAuth}><LogIn size={17} /> Sign in to sync</button>} /><section className="progress-overview"><div className="readiness-ring"><span>{percent}%</span><small>ready</small></div><div className="overview-copy"><div className="eyebrow eyebrow-teal">OVERALL PREPAREDNESS</div><h2>{completedLessons === 0 ? "A clean start" : completedCourses.length === courseCatalog.length ? "Full catalog complete" : "Building a solid foundation"}</h2><p>{completedLessons === 0 ? "Start any of the seven open courses to begin." : `${completedLessons} of ${totalLessons} lessons complete across the catalog.`}</p></div><div className="overview-stats"><div><Flame size={17} /><b>{streak}</b><small>day streak</small></div><div><Sparkles size={17} /><b>{xp}</b><small>XP earned</small></div><div><Award size={17} /><b>{completedCourses.length}</b><small>courses done</small></div></div></section><div className="progress-columns"><section className="progress-card"><div className="card-heading"><div><div className="eyebrow eyebrow-teal">COURSES</div><h2>Learning path</h2></div><button className="text-button" onClick={onKeepLearning}>Browse all <ArrowRight size={15} /></button></div>{courseCatalog.map((course) => { const Icon = course.icon; const value = progress[course.id]; return <div className="module-progress" key={course.id}><span className={`module-mini-icon icon-${course.color}`}><Icon size={16} /></span><div className="module-progress-main"><div><b>{course.title}</b><span>{value === 0 ? "Not started" : `${value} of ${course.lessons.length} lessons`}</span></div><ProgressRail value={(value / course.lessons.length) * 100} color={course.color} /></div></div>; })}</section><section className="progress-card"><div className="card-heading"><div><div className="eyebrow eyebrow-orange">COLLECTION</div><h2>Badges</h2></div><Trophy size={20} className="heading-icon" /></div><div className="badge-grid">{courseCatalog.map((course) => { const Icon = course.icon; const done = progress[course.id] === course.lessons.length; return <div key={course.id} className={`badge-card ${done ? "badge-earned" : ""}`}><Icon size={23} /><b>{course.title}</b><small>{done ? "Unlocked" : `${progress[course.id]}/4 lessons`}</small>{done ? <CheckCircle2 size={14} /> : <LockKeyhole size={14} />}</div>; })}</div></section></div><section className="progress-cta"><div className="cta-icon"><Users size={21} /></div><div><b>{user ? "Your account is ready to sync." : "Learning as a guest is fine."}</b><span>{user ? "Keep going and your course history will be available next time." : "Sign in later if you want your progress on every device."}</span></div><button className="button button-primary" onClick={user ? onKeepLearning : onOpenAuth}>{user ? "Keep learning" : "Sign in"} <ArrowRight size={16} /></button></section></main>;
}

function AuthModal({ onClose }: { onClose: () => void }) { return <div className="modal-backdrop"><div className="modal-card auth-modal"><button className="close-modal" onClick={onClose} aria-label="Close">×</button><div className="auth-mark"><ShieldCheck size={28} /></div><div className="eyebrow eyebrow-teal">OPTIONAL ACCOUNT</div><h2>Save your readiness.</h2><p>Keep learning as a guest, or sign in with your Google account to sync courses, XP and badges across sessions.</p><button className="button button-primary button-wide" onClick={() => startGoogleLogin()}><LogIn size={18} /> Continue with Google</button><button className="text-button auth-guest" onClick={onClose}>Continue as guest</button><small className="auth-note">No password is stored by READY. You can sign out at any time.</small></div></div>; }

export default function App() {
  const [view, setView] = useState<View>("learn");
  const [progress, setProgress] = useState<ProgressState>(() => readLocal("ready-progress", emptyProgress));
  const [xp, setXp] = useState(() => readLocal("ready-xp", 0));
  const [streak, setStreak] = useState(() => readLocal("ready-streak", 0));
  const [dailyDone, setDailyDone] = useState(() => readLocal("ready-daily", false));
  const [courseQuery, setCourseQuery] = useState("");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activePractice, setActivePractice] = useState<PracticeGame | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [remoteHydrated, setRemoteHydrated] = useState(false);
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const remoteProgress = trpc.progress.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const saveProgress = trpc.progress.save.useMutation();

  useEffect(() => { localStorage.setItem("ready-progress", JSON.stringify(progress)); }, [progress]);
  useEffect(() => { localStorage.setItem("ready-xp", JSON.stringify(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem("ready-streak", JSON.stringify(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem("ready-daily", JSON.stringify(dailyDone)); }, [dailyDone]);
  useEffect(() => { if (!isAuthenticated) { setRemoteHydrated(false); return; } if (remoteProgress.data && !remoteHydrated) { setProgress({ ...emptyProgress, ...remoteProgress.data.progress } as ProgressState); setXp(remoteProgress.data.xp); setStreak(remoteProgress.data.streak); setDailyDone(remoteProgress.data.dailyDone); setRemoteHydrated(true); } }, [isAuthenticated, remoteProgress.data, remoteHydrated]);

  const persist = (nextProgress: ProgressState, nextXp: number, nextStreak: number, nextDaily: boolean) => { if (isAuthenticated) saveProgress.mutate({ progress: nextProgress, xp: nextXp, streak: nextStreak, dailyDone: nextDaily }); };
  const completeLesson = (courseId: CourseId, lessonIndex: number) => { const nextProgress = { ...progress, [courseId]: Math.max(progress[courseId], lessonIndex + 1) }; const nextXp = lessonIndex < progress[courseId] ? xp : xp + 10; setProgress(nextProgress); setXp(nextXp); persist(nextProgress, nextXp, streak, dailyDone); };
  const completeDaily = () => { if (dailyDone) { setDailyOpen(false); return; } const nextXp = xp + 10; const nextStreak = streak + 1; setDailyDone(true); setXp(nextXp); setStreak(nextStreak); setDailyOpen(false); persist(progress, nextXp, nextStreak, true); };
  const completePractice = (earned: number) => { const nextXp = xp + earned; setXp(nextXp); persist(progress, nextXp, streak, dailyDone); };
  const logoutAndReset = async () => { await logout(); setAuthOpen(false); };
  const page = useMemo(() => { if (view === "practice") return <PracticeView onOpenGame={setActivePractice} />; if (view === "assistant") return <AssistantView />; if (view === "progress") return <ProgressView progress={progress} xp={xp} streak={streak} user={user} onKeepLearning={() => setView("learn")} onOpenAuth={() => setAuthOpen(true)} />; return <LearnView progress={progress} dailyDone={dailyDone} onOpenCourse={setActiveCourse} onOpenDaily={() => setDailyOpen(true)} courseQuery={courseQuery} setCourseQuery={setCourseQuery} />; }, [view, progress, xp, streak, dailyDone, user, courseQuery]);
  return <div className="app"><TopBar view={view} setView={setView} xp={xp} streak={streak} user={user} authLoading={authLoading} onOpenAuth={() => setAuthOpen(true)} onLogout={logoutAndReset} />{page}<BottomNav view={view} setView={setView} />{activeCourse && <LessonModal course={activeCourse} startingAt={progress[activeCourse.id] === activeCourse.lessons.length ? 0 : progress[activeCourse.id]} onClose={() => setActiveCourse(null)} onComplete={completeLesson} />}{activePractice && <PracticeModal game={activePractice} onClose={() => setActivePractice(null)} onFinish={completePractice} />}{dailyOpen && <DailyChallenge onClose={() => setDailyOpen(false)} onComplete={completeDaily} />}{authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}</div>;
}
