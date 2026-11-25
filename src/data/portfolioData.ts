export type ProjectCategory = 'all' | 'game' | 'app' | 'web' | 'tool' | 'hardware';

export type ProjectPreviewKind =
  | 'apogex'
  | 'flowscope'
  | 'knowledge-explorer'
  | 'agent-widget'
  | 'mindbench'
  | 'ggpartner'
  | 'arduino-lock';

export interface ProjectScreenshot {
  src: string;
  caption: string;
  aspect?: 'wide' | 'portrait';
}

export interface ProjectItem {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  category: Exclude<ProjectCategory, 'all'>;
  categoryLabel: string;
  status: string;
  year: string;
  offlineCapable: boolean;
  accent: string;
  accentSoft: string;
  previewKind: ProjectPreviewKind;
  summary: string;
  description: string;
  highlights: string[];
  stack: string[];
  metrics: Array<{ label: string; value: string }>;
  screenshots?: ProjectScreenshot[];
  links?: Array<{ label: string; href: string; external?: boolean }>;
  note?: { label: string; body: string };
}

export interface HardwareNode {
  id: string;
  label: string;
  shortRole: string;
  pinInfo: string;
  detail: string;
}

export interface ChronicleMilestone {
  era: string;
  badge: string;
  title: string;
  institution: string;
  highlight?: string;
  summary: string;
  tags: string[];
}

export interface ArsenalDivision {
  id: string;
  code: string;
  title: string;
  description: string;
  skills: Array<{ name: string; context: string }>;
}

export const PROFILE = {
  name: 'Minn Thant Ko',
  monogram: 'MTK',
  title: 'VibeCoder',
  subtitle: 'Websites · Apps · Offline-First Games',
  tagline:
    'Second-year Computer Science student at UIT Yangon building self-contained games, cross-platform apps, interactive web systems, and native desktop instruments.',
  location: 'Yangon, Myanmar',
  coordinates: '16.8661° N, 96.1951° E',
  university: 'University of Information Technology (UIT), Yangon',
  academicYear: 'Second Year',
  matricScore: '486',
  matricDetails: 'Grade 12 · CAE Naypyidaw (NPT)',
  email: 'mtkstorage1@gmail.com',
  githubHandle: 'mtkstorage1-web',
  githubUrl: 'https://github.com/mtkstorage1-web',
  facebookName: 'Minn Ye Kyaw Htin',
  ggPartnerLiveUrl: 'https://ggpartner.netlify.app',
};

export const HERO_STATS = [
  {
    value: '486',
    label: 'Grade 12 Marks',
    detail: 'CAE Naypyidaw (NPT)',
  },
  {
    value: 'UIT Y2',
    label: 'Computer Science',
    detail: 'Year 1 Complete · Year 2 Active',
  },
  {
    value: '07',
    label: 'Shipped Builds',
    detail: '6 Software · 1 Hardware',
  },
];

export const HARDWARE_NODES: HardwareNode[] = [
  {
    id: 'sensor',
    label: 'Fingerprint Sensor',
    shortRole: 'Biometric Optical Scanner',
    pinInfo: 'TX → D2 · RX → D3 · VCC → 5V · GND → GND',
    detail:
      'Mounted flush through the front faceplate of the plastic box; captures ridge scans, matches against stored templates, and reports match confidence to the Uno.',
  },
  {
    id: 'uno',
    label: 'Arduino Uno R3',
    shortRole: 'Central Microcontroller',
    pinInfo: 'D2/D3 (SoftwareSerial) · D9 (Lock Drive) · 5V/GND',
    detail:
      'Coordinates fingerprint verification packets over UART, evaluates authorized ID matches, and triggers the lock actuation pulse with timeout re-lock.',
  },
  {
    id: 'actuator',
    label: 'Lock Mechanism',
    shortRole: 'Servo / Solenoid Latch',
    pinInfo: 'Control Signal → D9 · External/Relay Power Stage',
    detail:
      'Physical latch mounted to the enclosure lid that disengages upon valid biometric match and automatically secures once the access window closes.',
  },
  {
    id: 'enclosure',
    label: 'Plastic Enclosure',
    shortRole: 'Chassis & Feedback LEDs',
    pinInfo: 'Green / Red LED Indicators · Strain-Relieved Wiring',
    detail:
      'Protective plastic housing cut and fitted to seat the optical lens cleanly, organize jumper harnesses, and surface instant visual grant/deny status.',
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'apogex',
    index: '01',
    title: 'T-MINUS / Apogex',
    subtitle: '3D Space-to-Surface Action & Flag Warfare Game',
    category: 'game',
    categoryLabel: '3D Game',
    status: 'Godot 4.7 · Forward Plus',
    year: '2026',
    offlineCapable: true,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.08)',
    previewKind: 'apogex',
    summary:
      'Multi-planet 3D sci-fi game spanning two Earth spaceports, open deep space, and a three-lane Moon combat arena — with modular ship assembly, walkable interiors, and full offline AI squads.',
    description:
      'Built in Godot 4.7 using Forward Plus rendering and editable .tscn levels, T-MINUS / Apogex lets players order reactors, engines, and bridge modules at the Parts Shop, launch past 650 m into open space at up to 6,200 m/s boost, switch between 4 crew stations (Pilot, Engineer, Gunner, Raider), and battle for Science Flags across Earth and the Moon — playable completely offline with AI or via ENet multiplayer.',
    highlights: [
      'Seamless surface-to-space flight: 60° auto-leveling atmospheric roll transitioning to full 360° zero-G space flight',
      'Four game modes: Arena Clash, Offline Science Flag Practice, Planetary Empire & Flag Warfare, and Mission Control Simulator',
      'Modular Kestrel spacecraft with walkable interior cabin to service power, cooling, and hull systems mid-flight',
      'Dual input architecture supporting desktop keyboard/mouse plus responsive touch controls and automated headless test suites',
    ],
    stack: ['Godot 4.7', 'GDScript', 'Forward Plus 3D', 'Custom Shaders', 'ENet Multiplayer', 'Offline AI'],
    metrics: [
      { label: 'Worlds', value: '3 Planets + Space' },
      { label: 'Max Boost', value: '6,200 m/s' },
      { label: 'Crew Roles', value: '4 Stations' },
    ],
    screenshots: [
      {
        src: './projects/apogex/12_flight_pilot.webp',
        caption: 'Deep Space Outbound — Kestrel twin-thruster transit with live hull & crew telemetry',
        aspect: 'wide',
      },
      {
        src: './projects/apogex/05_build.webp',
        caption: 'Earth Spaceport — Parts Shop, pad docking ring, and live spacecraft systems check',
        aspect: 'wide',
      },
      {
        src: './projects/apogex/19_blaster.webp',
        caption: 'Frontier Surface — Squad gunplay and glowing Science Flag extraction on Moon arena',
        aspect: 'wide',
      },
      {
        src: './projects/apogex/sp09_liftoff.webp',
        caption: 'Mission Control — Multi-stage rocket assembly and full-thrust orbital liftoff',
        aspect: 'wide',
      },
    ],
  },
  {
    id: 'flowscope',
    index: '02',
    title: 'FlowScope',
    subtitle: 'Cross-Platform Focus, Mood & Wellbeing Suite',
    category: 'app',
    categoryLabel: 'Multi-Platform App',
    status: 'iOS · macOS · Android · Windows',
    year: '2026',
    offlineCapable: true,
    accent: '#059669',
    accentSoft: 'rgba(5, 150, 105, 0.08)',
    previewKind: 'flowscope',
    summary:
      'Local-first focus timer that tracks how you felt while working — unified with sleep, food, Myanmar Kyat (MMK) expense logging, and a custom additive-blended particle theme engine.',
    description:
      'Engineered natively for iOS and macOS with a shared SwiftUI/SwiftData source tree (plus Kotlin/Jetpack Compose Android and WinUI 3 Windows ports sharing a unified JSON theme schema). FlowScope replaces raw stopwatch guilt with mood-weighted focus streaks, wall-clock drift-proof timing that survives app termination, AlarmKit sleep alarms, and nine handcrafted live particle themes.',
    highlights: [
      'Mood-weighted focus streaks, 0–100 satisfaction dial, GitHub-style feeling heatmap, and sleep/mood correlation insights',
      'Built-in Money tracker defaulting to Myanmar Kyat (MMK) with instant live parsing ("Clay - 33,500ks")',
      'Unified ThemeConfiguration engine drawing multi-pass additive-blended particle canvases with WCAG AA contrast checks',
      'Wall-clock session timing model across Apple, Android, and Windows with WidgetKit, Live Activities, and CSV/JSON export',
    ],
    stack: ['SwiftUI', 'SwiftData', 'WidgetKit & AlarmKit', 'Kotlin / Compose', 'WinUI 3 (.NET 8)', 'Canvas Particles'],
    metrics: [
      { label: 'Platforms', value: '4 Native Targets' },
      { label: 'Live Themes', value: '9 Particle Sets' },
      { label: 'Currency', value: 'MMK Native' },
    ],
    screenshots: [
      {
        src: './projects/flowscope/theme-preview-grid.webp',
        caption: 'Theme Engine — Live preview grid with independent particle fields, rings & sound profiles',
        aspect: 'portrait',
      },
      {
        src: './projects/flowscope/satisfaction-hub.webp',
        caption: 'Satisfaction Hub — Mood, Sleep, and Food unified on one seven-day wellbeing dial',
        aspect: 'portrait',
      },
      {
        src: './projects/flowscope/focus.webp',
        caption: 'Focus Surface — Drift-proof timer ring with live mood trace and streak summary',
        aspect: 'portrait',
      },
      {
        src: './projects/flowscope/history-heatmap.webp',
        caption: 'Work Log — Satisfaction heatmap and session history filtered by mood tags',
        aspect: 'portrait',
      },
      {
        src: './projects/flowscope/money.webp',
        caption: 'Money Tab — Out/in/net tracking in Myanmar Kyat (MMK) correlated with daily mood',
        aspect: 'portrait',
      },
    ],
  },
  {
    id: 'knowledge-explorer',
    index: '03',
    title: 'Knowledge Explorer',
    subtitle: 'Offline Visual Learning Atlas & 11 Interactive Labs',
    category: 'web',
    categoryLabel: 'Interactive Web PWA',
    status: 'Offline PWA · React 19',
    year: '2026',
    offlineCapable: true,
    accent: '#4F46E5',
    accentSoft: 'rgba(79, 70, 229, 0.08)',
    previewKind: 'knowledge-explorer',
    summary:
      'Offline-first interactive learning workspace built with React 19 and Motion — uniting a clickable star constellation, spatial knowledge graph, tree diagram, ⌘K search, and eleven live simulations.',
    description:
      'Originating as a visual atlas for linked concepts, Knowledge Explorer lets learners switch seamlessly between Directory Grid, Spatial Knowledge Map, and Tree Diagram modes. Every topic unlocks a hands-on visual lab — from GPU shader pipelines and orbital mechanics to neural networks, logic circuits, sorting algorithms, and cryptography — complete with synthesized tactile audio.',
    highlights: [
      '11 live interactive visual labs: shader pipeline, orbital mechanics, wave interference, neural nets, logic circuits, ciphers & sorting',
      'Three spatial exploration modes (Discipline Grid, Constellation Map, Expandable Tree) plus instant ⌘K command palette',
      'Fully offline-capable PWA with local progress persistence, saved trails, and Web Audio tactile feedback',
      'Crafted with React 19, TypeScript, Tailwind CSS v4, and hardware-accelerated Motion animations',
    ],
    stack: ['React 19', 'TypeScript', 'Tailwind CSS v4', 'Motion', 'Vite PWA', 'Web Audio API'],
    metrics: [
      { label: 'Visual Labs', value: '11 Live Labs' },
      { label: 'Views', value: 'Grid / Map / Tree' },
      { label: 'Mode', value: '100% Offline PWA' },
    ],
  },
  {
    id: 'agent-widget',
    index: '04',
    title: 'Agent Widget',
    subtitle: 'Native macOS Hardware Telemetry & AI Quota HUD',
    category: 'tool',
    categoryLabel: 'macOS Utility',
    status: 'Swift AppKit · IOKit · Python',
    year: '2026',
    offlineCapable: true,
    accent: '#0F172A',
    accentSoft: 'rgba(15, 23, 42, 0.06)',
    previewKind: 'agent-widget',
    summary:
      'Floating macOS HUD written in raw Swift AppKit & IOKit tracking Apple Silicon temps, GPU, CPU, RAM, and network alongside live token & quota bars for Claude Code, Codex, and Antigravity.',
    description:
      'Built directly on macOS low-level frameworks without Electron bloat, Agent Widget reads Mach CPU ticks, Apple Silicon AGXAccelerator GPU utilization, IOHID thermal sensors (CPU die & NAND SSD), battery telemetry, and local JSONL agent session logs. It toggles effortlessly between a compact top-corner pill and an expanded command panel via click, menu bar icon, or global Ctrl+Opt+M hotkey.',
    highlights: [
      'Direct IOKit, IOHID & Mach kernel polling for live CPU, Apple Silicon GPU, RAM/swap, die/SSD temperatures, and network throughput',
      'Unified real-time usage rings, 5h/7d reset timers, and daily token counters across Claude Code, Codex, and Antigravity',
      'Compact pill & expanded floating NSPanel modes controlled via menu bar item or global Carbon hotkey (Ctrl+Opt+M)',
      'Zero-bloat native Swift binary paired with a lightweight Python telemetry collector',
    ],
    stack: ['Swift', 'AppKit', 'IOKit / IOHID', 'Carbon Hotkeys', 'Python 3', 'macOS HUD'],
    metrics: [
      { label: 'Hotkey', value: 'Ctrl+Opt+M' },
      { label: 'Sensors', value: 'CPU / GPU / Die / SSD' },
      { label: 'Runtime', value: 'Native Binary' },
    ],
  },
  {
    id: 'mindbench',
    index: '05',
    title: 'MindBench Pro Max',
    subtitle: '3,291-Line C++ Offline Terminal Neuro-Arcade RPG',
    category: 'game',
    categoryLabel: 'C++ Terminal Game',
    status: 'Single-File C++ · Offline',
    year: '2025',
    offlineCapable: true,
    accent: '#D97706',
    accentSoft: 'rgba(217, 119, 6, 0.08)',
    previewKind: 'mindbench',
    summary:
      'Sprawling 3,291-line single-file C++ terminal RPG fusing seven cognitive mini-games, persistent multi-user save files, 9 exponential brain upgrade tiers, 12 achievements, and a luxury economy.',
    description:
      'Engineered purely in standard C++ as a self-contained offline terminal experience, MindBench casts you as a Net-Runner earning NeuroCredits through cognitive challenges and high-stakes casino games. Progress scales from a 1× Normal Brain up to a 1-trillion-multiplier Neutronite Brain, unlocking supercars, mansions, yachts, private jets, and horological collectibles saved locally per account.',
    highlights: [
      '7 cognitive mini-games: Riddle Shop (with tiered hints), Memory Test, Rapid-Fire Math, Code Breaker, Grid Memory, Memory Challenge & RPS',
      '9 Brain Upgrade tiers (Normal → Titanium → Adamantium → Uru → Neutronite) plus 7 cybernetic implants & XP ranking',
      'Persistent local account login & auto-save (.dat files), 12 unlockable achievements, and a 30+ item luxury collector shop',
      'Zero external dependencies — compiles cleanly with any C++ compiler for instant offline play',
    ],
    stack: ['C++', 'STL / File I/O', 'Game Economy Design', 'CLI / Terminal UX', 'Save Serialization'],
    metrics: [
      { label: 'Codebase', value: '3,291 Lines' },
      { label: 'Mini-Games', value: '7 Cognitive + Casino' },
      { label: 'Brain Tiers', value: '9 (Up to 1T×)' },
    ],
  },
  {
    id: 'ggpartner',
    index: '06',
    title: 'GGPartner',
    subtitle: 'Live Web Platform & Native iOS SwiftUI Wrapper',
    category: 'app',
    categoryLabel: 'Web + iOS App',
    status: 'Deployed · Netlify + SwiftUI',
    year: '2025',
    offlineCapable: false,
    accent: '#E11D48',
    accentSoft: 'rgba(225, 29, 72, 0.08)',
    previewKind: 'ggpartner',
    summary:
      'Deployed web application hosted on Netlify paired with a native iOS SwiftUI WKWebView shell configured for inline media playback, camera/mic permissions, and seamless auth popups.',
    description:
      'GGPartner bridges rapid web iteration with native iOS distribution. The lightweight SwiftUI app wraps ggpartner.netlify.app inside a full-bleed dark WKWebView supporting native swipe back/forward gestures, automatic media capture permission forwarding, and in-view handling for OAuth / Firebase sign-in popups.',
    highlights: [
      'Live web frontend deployed globally on Netlify (ggpartner.netlify.app)',
      'Native iOS SwiftUI wrapper with full-screen safe-area handling and zero white-flash dark canvas',
      'Custom WKUIDelegate coordinator granting WebRTC camera/microphone permissions and intercepting target=_blank auth popups',
      'Inline HTML5 media playback without user-gesture lockouts and native back/forward gesture navigation',
    ],
    stack: ['SwiftUI', 'WKWebView', 'iOS WebKit', 'Web App', 'Netlify'],
    metrics: [
      { label: 'Hosting', value: 'Netlify Live' },
      { label: 'Mobile Shell', value: 'iOS SwiftUI' },
      { label: 'Media', value: 'Cam / Mic Ready' },
    ],
    links: [
      {
        label: 'Visit Live Site',
        href: PROFILE.ggPartnerLiveUrl,
        external: true,
      },
    ],
  },
  {
    id: 'arduino-lock',
    index: '07',
    title: 'Biometric Lock System',
    subtitle: 'Arduino Uno R3 Optical Fingerprint Access Unit',
    category: 'hardware',
    categoryLabel: 'University Hardware',
    status: 'UIT Yangon · Physical Build',
    year: '2025',
    offlineCapable: true,
    accent: '#0D9488',
    accentSoft: 'rgba(13, 148, 136, 0.08)',
    previewKind: 'arduino-lock',
    summary:
      'Standalone biometric lock unit built at UIT Yangon — pairing an Arduino Uno R3, optical fingerprint scanner, locking actuator, and status LEDs inside a custom-drilled plastic enclosure.',
    description:
      'Built for my university hardware project at UIT Yangon. The physical assembly integrates an ATmega328P Arduino Uno R3 talking over UART (D2/D3) to an optical biometric fingerprint scanner and driving a physical lock latch on D9 with regulated 5V power distribution and instant grant/deny visual LEDs.',
    highlights: [
      'Physical pinout mapping and clean wiring harness connecting UART optical scanner (D2/D3) and lock drive (D9)',
      'Custom-drilled plastic project box seating the optical biometric lens flush on the front faceplate',
      'Regulated 5V rail & common ground harness with green/red LED feedback indicators for grant/deny states',
      'Interactive wiring schematic right inside this slide — click any module to inspect its pinout and role',
    ],
    stack: ['Arduino Uno R3', 'ATmega328P', 'UART Optical Scanner', 'Lock Actuator', 'Enclosure Wiring'],
    metrics: [
      { label: 'Controller', value: 'Arduino Uno R3' },
      { label: 'Interface', value: 'UART D2/D3 · D9' },
      { label: 'Chassis', value: 'Fitted Plastic Box' },
    ],
    note: {
      label: 'Hands-On Role',
      body: 'My primary focus on this build was the hands-on hardware assembly: mapping pinouts, wiring the microcontroller, optical sensor, locking actuator, and power rails cleanly inside the plastic enclosure so the physical unit operated reliably.',
    },
  },
];

export const CHRONICLE_MILESTONES: ChronicleMilestone[] = [
  {
    era: '2026 — PRESENT',
    badge: 'Active',
    title: 'Second Year Undergraduate & Independent VibeCoder',
    institution: 'University of Information Technology (UIT), Yangon',
    highlight: 'Year 2 · Active',
    summary:
      'Building ambitious offline-capable software across genres — from a 3D multi-planet Godot 4.7 game (T-MINUS / Apogex) and 4-platform Focus suite (FlowScope) to an 11-lab React visual learning atlas and low-level macOS Swift HUD utilities.',
    tags: ['Godot 4.7', 'SwiftUI / AppKit', 'React 19', 'Offline-First'],
  },
  {
    era: 'FIRST YEAR',
    badge: 'Completed',
    title: 'First Year Completed — Systems, C++ & Hardware',
    institution: 'University of Information Technology (UIT), Yangon',
    highlight: 'Year 1 · Cleared',
    summary:
      'Completed First Year coursework while shipping a 3,291-line C++ terminal neuro-arcade RPG (MindBench Pro Max) and assembling a working Arduino Uno R3 biometric fingerprint lock inside a plastic enclosure for a university project.',
    tags: ['C++ Systems', 'Arduino Uno R3', 'Hardware Wiring', 'Core CS'],
  },
  {
    era: 'GRADE 12',
    badge: 'Distinction',
    title: '486 Marks — Myanmar Matriculation Exam',
    institution: 'CAE Naypyidaw (NPT), Myanmar',
    highlight: '486 Marks',
    summary:
      'Achieved 486 marks in Grade 12 at CAE Naypyidaw, earning admission to the University of Information Technology (UIT) in Yangon to pursue computing and software creation.',
    tags: ['486 Marks', 'CAE NPT', 'UIT Admission'],
  },
];

export const ARSENAL_DIVISIONS: ArsenalDivision[] = [
  {
    id: 'games',
    code: '01',
    title: 'Games & 3D Worlds',
    description: 'Offline-first playable worlds, 3D flight physics, custom shaders, and terminal RPG systems.',
    skills: [
      { name: 'Godot 4.7', context: 'T-MINUS / Apogex' },
      { name: 'GDScript', context: 'Flight, AI & Arenas' },
      { name: 'Forward Plus 3D', context: 'Multi-planet scenes' },
      { name: 'ENet Multiplayer', context: 'Empire & Flag modes' },
      { name: 'C++ Game Loops', context: 'MindBench Pro Max' },
    ],
  },
  {
    id: 'native',
    code: '02',
    title: 'Apple & Cross-Platform',
    description: 'Native Swift apps, low-level macOS telemetry widgets, and multi-OS architecture.',
    skills: [
      { name: 'Swift & SwiftUI', context: 'FlowScope & GGPartner' },
      { name: 'AppKit & IOKit', context: 'Agent Widget HUD' },
      { name: 'SwiftData & WidgetKit', context: 'Local persistence' },
      { name: 'Kotlin / Jetpack Compose', context: 'FlowScope Android' },
      { name: 'WinUI 3 / .NET 8', context: 'FlowScope Windows' },
    ],
  },
  {
    id: 'web',
    code: '03',
    title: 'Web & Interactive UI',
    description: 'Offline PWAs, tactile micro-interactions, spatial graphs, and live interactive labs.',
    skills: [
      { name: 'React 19 & TypeScript', context: 'Knowledge Explorer' },
      { name: 'Tailwind CSS v4', context: 'Design systems' },
      { name: 'Motion / Animations', context: 'Fluid interfaces' },
      { name: 'Vite & Offline PWAs', context: 'Zero-network apps' },
      { name: 'Canvas & Web Audio', context: 'Visual labs & SFX' },
    ],
  },
  {
    id: 'systems',
    code: '04',
    title: 'Systems, CLI & Hardware',
    description: 'Bridging local scripts, telemetry collectors, and physical microcontroller wiring.',
    skills: [
      { name: 'Python 3', context: 'Agent telemetry bridge' },
      { name: 'Arduino Uno R3', context: 'Biometric Lock Build' },
      { name: 'Sensor Wiring & UART', context: 'Fingerprint integration' },
      { name: 'Git & Local Testing', context: 'Headless test suites' },
      { name: 'AI-Assisted VibeCoding', context: 'Rapid end-to-end shipping' },
    ],
  },
];
