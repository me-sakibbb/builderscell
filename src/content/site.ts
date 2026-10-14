/**
 * Every piece of copy, price, date and link on the landing page lives here.
 *
 * Values marked DUMMY are placeholders: prices, dates, venues and contact
 * details have not been decided yet. Replace them before launch.
 */

export const nav = {
  links: [
    { label: "Bootcamp", href: "#bootcamp" },
    { label: "Campaigns", href: "/campaigns" },
    // Temporarily hidden along with their sections.
    // { label: "The Cell", href: "#cell" },
    // { label: "Shop", href: "#shop" },
    { label: "Mentors", href: "#mentors" },
    // { label: "For Teams", href: "#teams" },
  ],
  cta: { label: "Register", href: "/campaigns" },
};

export const hero = {
  title: "Bangladesh's robotics revolution starts in one room.",
  sub: "Pick up a kit. Make something move in four sessions. Spend nine months turning that first spark into a portfolio.",
  primary: { label: "Join Builders' Bootcamp", href: "/signup" },
  /** Swapped in for members, who have no use for the sign-up form. */
  primaryMember: { label: "Your dashboard", href: "/dashboard" },
  secondary: { label: "Get your kit", href: "#kit" },
  hint: "Click the robot to say hi",
  /** What the hero robot says for each gesture. */
  robotLines: {
    Wave: "Hi, builder!",
    Dance: "Beep boop, dance time!",
    Jump: "Wheee!",
    Spin: "Whoa, I'm dizzy…",
    Nod: "Yes! Let's build.",
  },
};

export const numbers = [
  { value: 4, pad: 2, label: "Bootcamp sessions to your first moving build" },
  { value: 4, pad: 2, label: "Fun builds" },
  { value: 3, pad: 2, label: "Friends can split one kit" },
];

export const marquee = ["Sense", "Decide", "Act", "Build", "Break", "Debug", "Ship"];

export const myths = {
  statement:
    "Robotics isn't a factory line. It isn't a toy either. It's the most useful thing you haven't learned yet.",
  cards: [
    {
      myth: "“It's only for industrial engineers.”",
      truth:
        "You start with one motor and one sensor. The university-level work comes later, once you've earned it.",
      image: "/images/arm-lab.jpg",
      alt: "An industrial robot arm placing a component inside a glass lab cell",
    },
    {
      myth: "“It's just building games.”",
      truth:
        "The parts on your bench are the same ones running farms, clinics and warehouses. The problems are real.",
      image: "/images/multimeter.jpg",
      alt: "Multimeter probes testing an LED circuit on a breadboard",
    },
    {
      myth: "“It costs too much to be worth it.”",
      truth:
        "Components cost what they cost everywhere. The skill you build with them is one Bangladesh needs far more of.",
      image: "/images/mcu-macro.jpg",
      alt: "Macro photograph of a microcontroller chip on a green circuit board",
    },
  ],
};

export const journey = {
  eyebrow: "The path",
  title: "Five stops from curious to capable.",
  steps: [
    {
      id: "inspire",
      tag: "01",
      title: "Inspire Session",
      body: "We come to your campus. Part talk, part demo, always honest about what robotics really takes.",
    },
    {
      id: "kit",
      tag: "02",
      title: "The Kit",
      body: "You start by opening a box, not a textbook. Every part is picked to get you moving fast.",
    },
    {
      id: "bootcamp",
      tag: "03",
      title: "Bootcamp",
      body: "Four sessions. Your first real build that moves, senses and responds.",
    },
    {
      id: "cell",
      tag: "04",
      title: "The Cell",
      body: "Nine months on a real bench, with mentors a message away.",
    },
    {
      id: "next",
      tag: "05",
      title: "What's next",
      body: "A certificate, bigger projects matched to your level, and a shot at competition stages.",
    },
  ],
};

export const kit = {
  eyebrow: "The Kit",
  title: "You start by opening a box.",
  body: "Registering for the Bootcamp means picking up a robo-kit first. Every wire, motor and board inside has one job: getting you to your first build that actually moves.",
  note: "Kit contents shown are illustrative.",
  parts: [
    { id: "board", name: "Microcontroller board", spec: "Uno-compatible · USB-B" },
    { id: "shield", name: "Component board", spec: "Resistors, ICs, capacitors" },
    { id: "motors", name: "Gear motors × 2", spec: "3–6 V DC · 1:48" },
    { id: "wheels", name: "Wheels × 2", spec: "65 mm rubber tread" },
    { id: "sensor", name: "Ultrasonic sensor", spec: "2–400 cm range" },
    { id: "power", name: "Battery pack", spec: "2 × cells + holder" },
    { id: "wires", name: "Jumper wires", spec: "M–M · M–F · 40 pcs" },
  ],
  // Bootcamp registration fees (BDT). The campaign row in the database is the source of truth.
  plans: [
    { id: "single", label: "Individual", sub: "Build it solo", price: 5000, per: "one Build Box" },
    { id: "group", label: "Team of 3", sub: "Split it with friends", price: 7500, per: "৳2,500 each" },
  ],
  cta: { label: "Register now", href: "/campaigns/builders-bootcamp" },
};

export const playground = {
  eyebrow: "Try it now",
  title: "Make it move.",
  body: "This is Session 2 in your browser. The same parts from the box, wired into a rover. Drive it, sweep the sensor, then let it think for itself.",
};

export const bootcamp = {
  eyebrow: "Builders' Bootcamp",
  title: "Four sessions. Your first real build.",
  body: "The Bootcamp is where parts in a box become a working machine. It's your first real taste of robotics, and an honest way to find out whether you want the full nine months.",
  sessions: [
    { tag: "Session 01", title: "Open the kit", body: "Parts, purpose, and your first circuit. An LED blinks because you told it to." },
    { tag: "Session 02", title: "Make it move", body: "Motors, power and basic control. The rover rolls off the table for the first time." },
    { tag: "Session 03", title: "Give it senses", body: "Wire the ultrasonic sensor so your build notices the world around it." },
    { tag: "Session 04", title: "Ship the build", body: "Put it all together, debug it, and watch it work in front of everyone." },
  ],
};

export const cell = {
  eyebrow: "The Cell",
  title: "Nine months. Any level. No lecture hall.",
  body: "The Cell is our offline working space. Walk in, and the equipment becomes your classroom. Finish the nine months and a college or high-school student can hold their own against someone learning robotics at university.",
  // DUMMY opening hours
  badge: "Open bench · hours TBA",
  kicker: "Start early enough and what you build here doesn't have to stop at a grade. Some of these projects could grow into real companies.",
  specs: [
    { k: "Workstations", v: "High-spec machines for CAD, simulation and code" },
    { k: "Parts library", v: "Sensors, motors and boards you can test without buying" },
    { k: "Bench time", v: "Open hours to build, break and rebuild" },
    { k: "Mentors", v: "Reachable for the whole nine months, not one lecture" },
  ],
  images: [
    { src: "/images/printer-farm.jpg", alt: "Shelves of 3D printers in a maker space" },
    { src: "/images/soldering.jpg", alt: "A compact USB-C soldering iron on a blue bench mat" },
    { src: "/images/circuit-hands.jpg", alt: "A hand holding a connector cable next to electronics" },
  ],
};

export const curriculum = {
  eyebrow: "Curriculum",
  title: "Four phases. Each one ends in something that runs.",
  body: "No phase ends with an exam that gets filed away. Each ends with a build that moves, senses or responds.",
  phases: [
    { tag: "Phase 01", title: "Foundations", body: "Electronics, circuits and the logic behind them.", art: "wave" },
    { tag: "Phase 02", title: "Systems", body: "Sensors and mechanisms working together as one build.", art: "gears" },
    { tag: "Phase 03", title: "Autonomy", body: "Machines that sense, decide and act on their own.", art: "radar" },
    { tag: "Phase 04", title: "Capstone", body: "One original project, mentor-guided from start to finish.", art: "flag" },
  ],
};

export const mentors = {
  eyebrow: "Mentors",
  title: "Taught by people who've competed for Bangladesh.",
  body: "Our mentors have represented Bangladesh at international robotics competitions, and they stay reachable throughout the Cell.",
  pending: "Mentor profiles announced soon",
  tracks: [
    { title: "Applied robotics", body: "Mentors who've built and deployed working systems outside a classroom.", icon: "bot" },
    { title: "Embedded systems", body: "The electronics and firmware beneath every build.", icon: "chip" },
    { title: "Autonomy & control", body: "The software that lets a machine decide for itself.", icon: "radar" },
  ],
};

export const shop = {
  eyebrow: "The Shop",
  title: "Genuine parts, shipped anywhere in Bangladesh.",
  body: "The same components we use in the Cell, available to every builder. Drag to browse.",
  note: "Prices are placeholders.",
  cta: { label: "Visit the shop", href: "#" },
  // DUMMY products and prices (BDT)
  products: [
    { name: "Uno-compatible board", cat: "Microcontrollers", price: 950, icon: "chip" },
    { name: "Ultrasonic sensor", cat: "Sensors", price: 180, icon: "radar" },
    { name: "TT gear motor pair", cat: "Motors & drivers", price: 320, icon: "cog" },
    { name: "Dual H-bridge driver", cat: "Motors & drivers", price: 260, icon: "zap" },
    { name: "Li-ion battery pack", cat: "Power", price: 650, icon: "battery" },
    { name: "Smart soldering iron", cat: "Tools", price: 3200, icon: "wrench" },
    { name: "Digital multimeter", cat: "Tools", price: 1450, icon: "gauge" },
    { name: "Jumper wire set", cat: "Wiring", price: 150, icon: "cable" },
  ],
};

export const teams = {
  eyebrow: "For teams",
  title: "Already at university? Rent the bench, not a seat.",
  body: "University students and competition teams can book the Cell's equipment by the hour. No enrollment needed, just the parts and the space to build against a deadline.",
  // DUMMY rate (BDT)
  rate: 500,
  unit: "per hour, per team",
  perks: ["Full facility access", "Parts library on hand", "No enrollment needed", "Book by the hour"],
  cta: { label: "Ask about a slot", href: "#join" },
  image: { src: "/images/first-crunch.jpg", alt: "A student robotics team working on a large competition robot chassis" },
};

export const outcome = {
  eyebrow: "The outcome",
  title: "You leave with a certificate, and a way into what comes next.",
  body: "Finish the Cell and you get a certificate and a direct line into our network of larger projects, matched to your skill level. From there it's your call.",
  paths: [
    { title: "National competitions", icon: "award" },
    { title: "International stages", icon: "globe" },
    { title: "Build your own thing", icon: "rocket" },
  ],
};

export const join = {
  eyebrow: "Join",
  title: "Nine months from now, you won't be the same builder.",
  body: "The room is open, and we're still building it, one Cell member at a time.",
  /** Temporary single CTA while the kit and the Cell buttons below are hidden. */
  bootcamp: { label: "Join Builders' Bootcamp", href: "/campaigns/builders-bootcamp" },
  primary: { label: "Get your kit", href: "#kit" },
  secondary: { label: "Visit the Cell", href: "#cell" },
  // DUMMY Inspire Session dates and venues
  sessions: [
    { date: "2026-10-08", city: "Dhaka", venue: "Campus TBA" },
    { date: "2026-10-22", city: "Chattogram", venue: "Campus TBA" },
    { date: "2026-11-05", city: "Sylhet", venue: "Campus TBA" },
    { date: "2026-11-19", city: "Rajshahi", venue: "Campus TBA" },
  ],
};

export const footer = {
  tagline: "A robotics community founded in Bangladesh in 2026.",
  // DUMMY contact details
  columns: [
    {
      title: "Visit",
      items: [{ label: "Dhaka, Bangladesh", href: "#" }],
    },
    {
      title: "Contact",
      items: [
        { label: "tech.builderscell@gmail.com", href: "mailto:tech.builderscell@gmail.com" },
        { label: "+880 1577-727793", href: "tel:+8801577727793" },
      ],
    },
    {
      title: "Company",
      items: [
        { label: "Careers", href: "#" },
        { label: "Instagram", href: "#" },
      ],
    },
  ],
};

export const credits = [
  { what: "Robot (3D)", who: "Polygonal Mind", license: "CC0 1.0", href: "https://poly.pizza/m/ejDr8lRglP" },
  { what: "Arduino Uno (3D)", who: "M Ferrieu", license: "CC BY 3.0", href: "https://poly.pizza/m/2BEJQybmqQT" },
  { what: "Circuit board 1 (3D)", who: "Bill Baran (Sirkut)", license: "CC BY 3.0", href: "https://poly.pizza/m/fxKdRjNq20j" },
  { what: "Battery (3D)", who: "Quaternius", license: "CC0 1.0", href: "https://poly.pizza/m/MYa3uWdwPU" },
  { what: "Robot arm in a lab (photo)", who: "Shixart1985", license: "CC BY 2.0", href: "https://commons.wikimedia.org/wiki/File:Robot_arm_works_on_a_small_component_in_a_lab_setting.jpg" },
  { what: "Circuit board in a workshop (photo)", who: "Shixart1985", license: "CC BY 2.0", href: "https://commons.wikimedia.org/wiki/File:Holding_a_circuit_board_close_to_electronic_components_in_a_workshop.jpg" },
  { what: "RP2350 macro (photo)", who: "Profpcde", license: "CC0", href: "https://commons.wikimedia.org/wiki/File:Macro_photograph_of_the_RP2350_microcontroller_on_a_Raspberry_Pi_Pico_2_board.jpg" },
  { what: "FIRST robotics build (photo)", who: "Steve Jurvetson", license: "CC BY 2.0", href: "https://commons.wikimedia.org/wiki/File:The_crunch_begins_to_meet_tonight%27s_FIRST_robotics_competition_deadline_(16538996086).jpg" },
  { what: "Multimeter on breadboard (photo)", who: "Zeroping", license: "CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Multimeter_probes_on_breadboard.jpg" },
  { what: "USB-C soldering iron (photo)", who: "4300streetcar", license: "CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Pinecil_USB_C_soldering_iron.jpg" },
  { what: "3D printer farm (photo)", who: "Majabojarska", license: "CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:3D_printer_farm_at_Hackerspace_Wroc%C5%82aw.jpg" },
];

export const bdt = (n: number) => "৳" + n.toLocaleString("en-US");
