import { allTopics, getTopicById } from "@/data/topic-catalog";
import { Question, QuestionDifficulty, QuestionMedia, Topic } from "@/lib/types";

const QUESTION_COUNT_PER_TOPIC = 220;

type DraftQuestion = {
  prompt: string;
  correct: string;
  distractors: [string, string, string];
  explanation: string;
  difficulty: QuestionDifficulty;
  estimatedSeconds: number;
  media?: QuestionMedia;
};

type Fact = Omit<DraftQuestion, "difficulty" | "estimatedSeconds">;

function hashSeed(input: string) {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function createRng(seed: string) {
  const seedFn = hashSeed(seed);
  let a = seedFn();
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle<T>(values: T[], rng: () => number) {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function difficultyFromIndex(index: number): QuestionDifficulty {
  if (index % 5 === 0) return "Hard";
  if (index % 2 === 0) return "Medium";
  return "Easy";
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createBarChartMedia(title: string, labels: string[], values: number[]): QuestionMedia {
  const max = Math.max(...values, 1);
  const barWidth = 34;
  const gap = 16;
  const chartHeight = 140;
  const chartTop = 34;
  const chartLeft = 28;
  const svgWidth = 300;
  const svgHeight = 220;

  const bars = values.map((value, index) => {
    const height = Math.round((value / max) * chartHeight);
    const x = chartLeft + index * (barWidth + gap);
    const y = chartTop + chartHeight - height;
    const fill = index === values.indexOf(max) ? "#72e4b8" : "#80cfff";
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="8" fill="${fill}" opacity="0.92" />
      <text x="${x + barWidth / 2}" y="${chartTop + chartHeight + 22}" text-anchor="middle" fill="#c4ccda" font-size="12" font-family="Segoe UI, Arial, sans-serif">${labels[index]}</text>
      <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="#f6f7fb" font-size="12" font-family="Segoe UI, Arial, sans-serif">${value}</text>
    `;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" rx="24" fill="#111722" />
      <text x="24" y="24" fill="#f6f7fb" font-size="16" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${title}</text>
      <line x1="${chartLeft}" y1="${chartTop + chartHeight}" x2="272" y2="${chartTop + chartHeight}" stroke="#415066" stroke-width="1.5" />
      <line x1="${chartLeft}" y1="${chartTop - 6}" x2="${chartLeft}" y2="${chartTop + chartHeight}" stroke="#415066" stroke-width="1.5" />
      ${bars}
    </svg>
  `;

  return {
    kind: "image",
    src: svgToDataUri(svg),
    alt: `${title}. Bars for ${labels.map((label, index) => `${label}=${values[index]}`).join(", ")}.`,
    caption: title,
    width: svgWidth,
    height: svgHeight
  };
}

function createClockMedia(hour: number, minute: number): QuestionMedia {
  const hourAngle = ((hour % 12) * 30 + minute * 0.5 - 90) * (Math.PI / 180);
  const minuteAngle = (minute * 6 - 90) * (Math.PI / 180);
  const hourX = 110 + Math.cos(hourAngle) * 42;
  const hourY = 110 + Math.sin(hourAngle) * 42;
  const minuteX = 110 + Math.cos(minuteAngle) * 66;
  const minuteY = 110 + Math.sin(minuteAngle) * 66;
  const labels = ["12", "3", "6", "9"];
  const positions = [
    [110, 36],
    [184, 114],
    [110, 192],
    [34, 114]
  ];

  const markers = labels.map((label, index) => `<text x="${positions[index][0]}" y="${positions[index][1]}" text-anchor="middle" fill="#c4ccda" font-size="14" font-family="Segoe UI, Arial, sans-serif">${label}</text>`).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
      <rect width="100%" height="100%" rx="28" fill="#111722" />
      <circle cx="110" cy="110" r="78" fill="#152032" stroke="#415066" stroke-width="2" />
      ${markers}
      <line x1="110" y1="110" x2="${hourX.toFixed(1)}" y2="${hourY.toFixed(1)}" stroke="#72e4b8" stroke-width="6" stroke-linecap="round" />
      <line x1="110" y1="110" x2="${minuteX.toFixed(1)}" y2="${minuteY.toFixed(1)}" stroke="#80cfff" stroke-width="4" stroke-linecap="round" />
      <circle cx="110" cy="110" r="6" fill="#f6f7fb" />
    </svg>
  `;

  return {
    kind: "image",
    src: svgToDataUri(svg),
    alt: `Analog clock showing ${hour}:${minute.toString().padStart(2, "0")}.`,
    caption: `Clock face for ${hour}:${minute.toString().padStart(2, "0")}`,
    width: 220,
    height: 220
  };
}
function finalizeQuestion(topicId: string, index: number, draft: DraftQuestion): Question {
  const rng = createRng(`${topicId}-${index}-options`);
  const options = shuffle([draft.correct, ...draft.distractors], rng);
  return {
    id: `${topicId}-${index + 1}`,
    topicId,
    prompt: draft.prompt,
    options,
    answerIndex: options.indexOf(draft.correct),
    explanation: draft.explanation,
    difficulty: draft.difficulty,
    estimatedSeconds: draft.estimatedSeconds,
    media: draft.media
  };
}

const factBanks: Record<string, Fact[]> = {
  awareness: [
    { prompt: "Which institution regulates monetary policy in India?", correct: "Reserve Bank of India", distractors: ["SEBI", "Finance Commission", "NABARD"], explanation: "The RBI controls policy rates, liquidity, and broader monetary policy." },
    { prompt: "Which Article of the Indian Constitution protects freedom of speech and expression?", correct: "Article 19", distractors: ["Article 14", "Article 21", "Article 32"], explanation: "Article 19(1)(a) guarantees freedom of speech and expression." },
    { prompt: "Which body is chiefly responsible for maintaining international peace and security in the UN system?", correct: "Security Council", distractors: ["UNESCO", "ECOSOC", "UNDP"], explanation: "The Security Council is the principal UN body for peace and security matters." },
    { prompt: "Which index is most commonly used to track retail inflation?", correct: "Consumer Price Index", distractors: ["Index of Industrial Production", "Repo Rate", "Balance of Trade"], explanation: "CPI is a widely used measure of consumer-level inflation." }
  ],
  science: [
    { prompt: "Which organelle is known as the powerhouse of the cell?", correct: "Mitochondria", distractors: ["Nucleus", "Golgi apparatus", "Ribosome"], explanation: "Mitochondria generate ATP for most cellular energy needs." },
    { prompt: "Which gas is most abundant in Earth's atmosphere?", correct: "Nitrogen", distractors: ["Oxygen", "Argon", "Carbon dioxide"], explanation: "Nitrogen makes up the largest portion of Earth's atmosphere." },
    { prompt: "Which lens is used to correct myopia?", correct: "Concave lens", distractors: ["Convex lens", "Cylindrical lens", "Plano-convex lens"], explanation: "A concave lens diverges light to correct nearsightedness." },
    { prompt: "Which blood component primarily transports oxygen?", correct: "Red blood cells", distractors: ["Platelets", "Plasma", "White blood cells"], explanation: "Red blood cells carry oxygen using hemoglobin." }
  ],
  interview: [
    { prompt: "In a group discussion, what is usually the strongest opening move?", correct: "Frame the topic clearly and give it structure", distractors: ["Speak longest without pause", "Challenge someone immediately", "Wait silently for the end"], explanation: "A strong opener adds structure and control without sounding aggressive." },
    { prompt: "When asked about failure in an interview, the best answer should primarily show:", correct: "Ownership, learning, and changed behavior", distractors: ["Blame on others", "Only the emotional impact", "A vague answer with no example"], explanation: "Good answers show reflection and concrete growth, not deflection." },
    { prompt: "Under time pressure in placement tests, what is the best exam strategy?", correct: "Leave time sinks and protect scoring momentum", distractors: ["Double-check every easy question first", "Attempt every question blindly", "Solve only in printed order"], explanation: "Momentum matters; protecting time for solvable questions improves outcomes." },
    { prompt: "A good closing question to an interviewer usually focuses on:", correct: "Role expectations and success signals", distractors: ["Office gossip", "Vacation policy only", "What other candidates scored"], explanation: "Thoughtful closing questions show intent to contribute and understand the role." }
  ],
  c: [
    { prompt: "Which storage class preserves a local variable between function calls in C?", correct: "static", distractors: ["auto", "register", "extern"], explanation: "A static local variable retains its value across calls." },
    { prompt: "Which operator dereferences a pointer in C?", correct: "*", distractors: ["&", "->", "%"], explanation: "The `*` operator accesses the value stored at a pointer address." },
    { prompt: "Which header declares `malloc`?", correct: "stdlib.h", distractors: ["string.h", "math.h", "ctype.h"], explanation: "Dynamic allocation functions are declared in `stdlib.h`." },
    { prompt: "Which loop runs its body at least once?", correct: "do-while", distractors: ["for", "while", "switch"], explanation: "A do-while checks its condition after one iteration." }
  ],
  oop: [
    { prompt: "Which OOP principle allows one interface to have many implementations?", correct: "Polymorphism", distractors: ["Encapsulation", "Compilation", "Serialization"], explanation: "Polymorphism lets different types respond through the same interface." },
    { prompt: "Which keyword prevents a class from being inherited in Java?", correct: "final", distractors: ["static", "extends", "const"], explanation: "A final class cannot be subclassed." },
    { prompt: "Which smart pointer supports shared ownership in modern C++?", correct: "std::shared_ptr", distractors: ["std::unique_ptr", "std::raw_ptr", "std::stack_ptr"], explanation: "`shared_ptr` uses reference counting for shared ownership." },
    { prompt: "What does `async` primarily enable in C#?", correct: "Awaitable asynchronous workflows", distractors: ["Compile-time code generation", "Automatic memory pinning", "Unsafe pointer arithmetic"], explanation: "`async` and `await` simplify asynchronous programming." }
  ],
  networking: [
    { prompt: "Which protocol provides connection-oriented reliable transport?", correct: "TCP", distractors: ["UDP", "ARP", "ICMP"], explanation: "TCP provides reliability through sequencing and retransmission." },
    { prompt: "Which OSI layer handles routing between networks?", correct: "Network layer", distractors: ["Transport layer", "Presentation layer", "Physical layer"], explanation: "Logical addressing and routing belong to the network layer." },
    { prompt: "Which service translates domain names into IP addresses?", correct: "DNS", distractors: ["DHCP", "SNMP", "NAT"], explanation: "DNS resolves names to IP addresses." },
    { prompt: "Which port is commonly associated with HTTPS?", correct: "443", distractors: ["80", "25", "110"], explanation: "HTTPS commonly uses TCP port 443." }
  ],
  database: [
    { prompt: "Which transaction property guarantees all-or-nothing execution?", correct: "Atomicity", distractors: ["Consistency", "Isolation", "Durability"], explanation: "Atomicity ensures a transaction fully completes or fully rolls back." },
    { prompt: "Which join returns only matching rows from both tables?", correct: "INNER JOIN", distractors: ["LEFT JOIN", "FULL JOIN", "CROSS JOIN"], explanation: "INNER JOIN returns only rows satisfying the join condition in both tables." },
    { prompt: "Which clause filters grouped results?", correct: "HAVING", distractors: ["WHERE", "ORDER BY", "DISTINCT"], explanation: "`HAVING` applies conditions after grouping." },
    { prompt: "What is the main purpose of an index?", correct: "Speed up data retrieval", distractors: ["Enforce all business logic", "Compress every row", "Prevent every deadlock"], explanation: "Indexes improve lookup performance, though they add maintenance cost." }
  ],
  technical: [
    { prompt: "A diode primarily allows current to flow in:", correct: "One direction", distractors: ["Both directions equally", "No direction", "Only alternating bursts"], explanation: "A forward-biased diode conducts strongly in one direction." },
    { prompt: "Which gate outputs 1 only when all inputs are 1?", correct: "AND gate", distractors: ["OR gate", "XOR gate", "NAND gate"], explanation: "AND returns high only when every input is high." },
    { prompt: "Which data structure follows FIFO order?", correct: "Queue", distractors: ["Stack", "Tree", "Heap"], explanation: "Queues process the earliest inserted item first." },
    { prompt: "Which component stores energy in an electric field?", correct: "Capacitor", distractors: ["Inductor", "Resistor", "Transformer"], explanation: "A capacitor stores energy in the electric field between its plates." }
  ],
  engineering: [
    { prompt: "Which process occurs at constant pressure?", correct: "Isobaric", distractors: ["Adiabatic", "Isochoric", "Isothermal only"], explanation: "Isobaric processes maintain constant pressure." },
    { prompt: "What is the primary role of reinforcement in RCC?", correct: "Resist tensile stress", distractors: ["Reduce cement setting time", "Replace aggregate", "Prevent all shrinkage"], explanation: "Steel reinforcement carries tensile loads that concrete handles poorly." },
    { prompt: "Which operation separates components based on volatility differences?", correct: "Distillation", distractors: ["Filtration", "Screening", "Sedimentation"], explanation: "Distillation depends on boiling point and volatility differences." },
    { prompt: "Which machine element transmits torque between shafts?", correct: "Coupling", distractors: ["Gasket", "Bearing only", "Washer"], explanation: "Couplings connect shafts for power transmission." }
  ],
  medical: [
    { prompt: "Which stain differentiates bacteria into gram-positive and gram-negative groups?", correct: "Gram stain", distractors: ["Sudan stain", "PAS stain", "Wright stain"], explanation: "Gram staining differentiates organisms based on cell wall structure." },
    { prompt: "Which molecule is the immediate energy currency of the cell?", correct: "ATP", distractors: ["DNA", "Collagen", "Glycogen"], explanation: "ATP stores and transfers usable cellular energy." },
    { prompt: "Which tool is commonly used to amplify DNA?", correct: "PCR", distractors: ["ELISA", "Centrifugation", "Dialysis"], explanation: "PCR amplifies target DNA through thermal cycling." },
    { prompt: "What does downstream processing in bioprocessing mainly involve?", correct: "Recovery and purification of products", distractors: ["Road transport of media", "Only sterilization", "Manual bookkeeping"], explanation: "Downstream processing handles separation, purification, and final recovery." }
  ]
};

const synonymPairs = [
  ["abundant", "plentiful", ["scarce", "fragile", "hesitant"]],
  ["brief", "short", ["rigid", "urgent", "distant"]],
  ["candid", "frank", ["ornate", "timid", "abrupt"]],
  ["diligent", "hardworking", ["casual", "restless", "impulsive"]]
] as const;

const antonymPairs = [
  ["opaque", "transparent", ["careless", "fragile", "recent"]],
  ["scarce", "abundant", ["polished", "narrow", "silent"]],
  ["reluctant", "eager", ["formal", "rigid", "distant"]],
  ["tranquil", "agitated", ["measured", "gentle", "steady"]]
] as const;

const fillBlankSets = [
  {
    prompt: "Choose the best completion: The analyst was ___ impressed by the speed of the new interface.",
    correct: "genuinely",
    distractors: ["genuine", "genuineness", "more genuine"],
    explanation: "An adverb is needed to modify the adjective `impressed`."
  },
  {
    prompt: "Choose the best completion: Neither the mentor nor the trainees ___ willing to skip the review.",
    correct: "were",
    distractors: ["was", "be", "has"],
    explanation: "With `neither...nor`, the verb agrees with the nearer subject `trainees`."
  },
  {
    prompt: "Choose the best completion: The solution is simple ___ effective when used consistently.",
    correct: "yet",
    distractors: ["because", "unless", "whereas"],
    explanation: "`Yet` correctly links two contrasting but compatible qualities."
  },
  {
    prompt: "Choose the correct preposition: She is proficient ___ data-driven presentation and analysis.",
    correct: "in",
    distractors: ["on", "at", "with"],
    explanation: "The standard phrase is `proficient in`."
  }
];

function createKnowledgeQuestion(topic: Topic, index: number): DraftQuestion {
  const bankKey = getKnowledgeBankKey(topic.id);
  const bank = factBanks[bankKey];
  const fact = bank[index % bank.length];
  const style = index % 3;
  const prompt = style === 0 ? fact.prompt : style === 1 ? `In a ${topic.title} screening round, choose the most accurate option. ${fact.prompt}` : `${topic.title}: ${fact.prompt}`;
  return {
    prompt,
    correct: fact.correct,
    distractors: fact.distractors,
    explanation: fact.explanation,
    difficulty: difficultyFromIndex(index),
    estimatedSeconds: 45
  };
}

function getKnowledgeBankKey(topicId: string) {
  if (["current-affairs", "basic-general-knowledge"].includes(topicId)) return "awareness";
  if (["general-science"].includes(topicId)) return "science";
  if (["placement-papers", "group-discussion", "hr-interview"].includes(topicId)) return "interview";
  if (["c-programming", "c-language-basics", "c-programming-test"].includes(topicId)) return "c";
  if (["cpp-programming", "csharp-programming", "java-programming"].includes(topicId)) return "oop";
  if (["networking-questions", "networking-short-answers"].includes(topicId)) return "networking";
  if (["database-questions", "sql-server"].includes(topicId)) return "database";
  if (["basic-electronics", "digital-electronics", "ece-eee-cse"].includes(topicId)) return topicId === "digital-electronics" ? "technical" : "technical";
  if (["software-testing"].includes(topicId)) return "technical";
  if (["mechanical-engineering", "civil-engineering", "chemical-engineering"].includes(topicId)) return "engineering";
  if (["microbiology", "biochemistry", "biotechnology", "biochemical-engineering"].includes(topicId)) return "medical";
  return "technical";
}

function createQuantQuestion(topicId: string, index: number): DraftQuestion {
  const rng = createRng(`${topicId}-${index}`);
  const template = index % 6;

  if (template === 0) {
    const base = randInt(rng, 400, 1400);
    const rise = randInt(rng, 8, 35);
    const correct = (base * (100 + rise)) / 100;
    const display = `${correct}`;
    return {
      prompt: `A test score benchmark was ${base}. It increased by ${rise}%. What is the new benchmark?`,
      correct: display,
      distractors: [`${base + rise}`, `${Math.round(base * rise / 100)}`, `${Math.round(base * (100 + rise + 5) / 100)}`],
      explanation: `Increase = ${base} x ${rise}% = ${(base * rise) / 100}. New value = ${display}.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 50
    };
  }

  if (template === 1) {
    const a = randInt(rng, 2, 7);
    const b = randInt(rng, 3, 9);
    const total = randInt(rng, 72, 180);
    const correct = Math.round((a / (a + b)) * total);
    return {
      prompt: `A prize fund is split in the ratio ${a}:${b}. If the total is ${total}, what is the smaller share?`,
      correct: `${Math.min(correct, total - correct)}`,
      distractors: [`${Math.max(correct, total - correct)}`, `${a + b}`, `${Math.round(total / 2)}`],
      explanation: `One part = ${total} / ${a + b}. The smaller share uses the smaller ratio part.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 55
    };
  }

  if (template === 2) {
    const count = randInt(rng, 4, 8);
    const average = randInt(rng, 18, 44);
    const add = randInt(rng, 30, 70);
    const correct = Math.round((count * average + add) / (count + 1));
    return {
      prompt: `The average score of ${count} sections is ${average}. If one more section with score ${add} is included, what is the new average?`,
      correct: `${correct}`,
      distractors: [`${average + add}`, `${Math.round((average + add) / 2)}`, `${average}`],
      explanation: `Total score = ${count * average}. Add ${add} and divide by ${count + 1}.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 50
    };
  }

  if (template === 3) {
    const men = randInt(rng, 4, 12);
    const days = randInt(rng, 6, 15);
    const newMen = men + randInt(rng, 2, 6);
    const correct = Math.ceil((men * days) / newMen);
    return {
      prompt: `${men} workers can finish a task in ${days} days. How many days will ${newMen} equally efficient workers need?`,
      correct: `${correct}`,
      distractors: [`${days}`, `${Math.ceil((newMen * days) / men)}`, `${Math.max(1, correct - 1)}`],
      explanation: `Work stays constant: workers x days = ${men * days}. Divide by ${newMen}.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 60
    };
  }

  if (template === 4) {
    const speed = randInt(rng, 28, 64);
    const time = randInt(rng, 2, 6);
    const distance = speed * time;
    return {
      prompt: `A candidate travels at ${speed} km/h for ${time} hours to reach a test center. What distance is covered?`,
      correct: `${distance} km`,
      distractors: [`${speed + time} km`, `${speed * (time + 1)} km`, `${distance - speed} km`],
      explanation: `Distance = speed x time = ${distance} km.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 40
    };
  }

  const cost = randInt(rng, 120, 480);
  const profit = randInt(rng, 10, 35);
  const correct = Math.round((cost * (100 + profit)) / 100);
  return {
    prompt: `An online mock package costs ${cost}. If it is sold at a profit of ${profit}%, what is the selling price?`,
    correct: `${correct}`,
    distractors: [`${cost + profit}`, `${Math.round((cost * profit) / 100)}`, `${cost}`],
    explanation: `Selling price = cost x (100 + profit)% = ${correct}.`,
    difficulty: difficultyFromIndex(index),
    estimatedSeconds: 45
  };
}

function createDataInterpretationQuestion(topicId: string, index: number): DraftQuestion {
  const rng = createRng(`${topicId}-${index}`);
  const values = Array.from({ length: 5 }, () => randInt(rng, 35, 95));
  const labels = ["A", "B", "C", "D", "E"];
  const media = createBarChartMedia("Mini data chart", labels, values);
  const template = index % 3;

  if (template === 0) {
    const correct = values[1] + values[3];
    return {
      prompt: "Study the chart below. What is the total of B and D?",
      correct: `${correct}`,
      distractors: [`${values[0] + values[4]}`, `${values[2] + values[3]}`, `${values[1] + values[2]}`],
      explanation: `B + D = ${values[1]} + ${values[3]} = ${correct}.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 55,
      media
    };
  }

  if (template === 1) {
    const base = values[0];
    const next = values[2];
    const correct = Math.round(((next - base) / base) * 100);
    return {
      prompt: "Study the chart below. What is the approximate percentage change from A to C?",
      correct: `${correct}%`,
      distractors: [`${Math.round((next / base) * 100)}%`, `${Math.abs(next - base)}%`, `${Math.round(((base - next) / next) * 100)}%`],
      explanation: `Percentage change = ((C - A) / A) x 100 = ${correct}% approximately.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 65,
      media
    };
  }

  const max = Math.max(...values);
  return {
    prompt: "Study the chart below. Which label has the highest value?",
    correct: labels[values.indexOf(max)],
    distractors: shuffle(labels.filter((label) => label !== labels[values.indexOf(max)]), rng).slice(0, 3) as [string, string, string],
    explanation: `${labels[values.indexOf(max)]} has the largest value in the set.`,
    difficulty: difficultyFromIndex(index),
    estimatedSeconds: 40,
    media
  };
}

function createReasoningQuestion(topicId: string, index: number): DraftQuestion {
  const rng = createRng(`${topicId}-${index}`);
  const template = index % 4;

  if (template === 0) {
    const start = randInt(rng, 0, 10);
    const step = randInt(rng, 1, 3);
    const chars = Array.from({ length: 4 }, (_, i) => String.fromCharCode(65 + start + i * step));
    const correct = String.fromCharCode(65 + start + 4 * step);
    return {
      prompt: `Find the next term in the series: ${chars.join(", ")}, ?`,
      correct,
      distractors: [String.fromCharCode(correct.charCodeAt(0) + 1), String.fromCharCode(correct.charCodeAt(0) - 1), chars[3]],
      explanation: `Each letter moves forward by ${step} positions.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 35
    };
  }

  if (template === 1) {
    const shift = randInt(rng, 1, 3);
    const word = ["CODE", "MIND", "TEST", "LOGIC"][index % 4];
    const encoded = word
      .split("")
      .map((char) => String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65))
      .join("");
    return {
      prompt: `In a certain code, ${word} is written as ${encoded}. How is DATA written in that code?`,
      correct: "DATA"
        .split("")
        .map((char) => String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65))
        .join(""),
      distractors: ["DATA", "EBUB", "GBWB"],
      explanation: `Each letter is shifted forward by ${shift} positions.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 50
    };
  }

  if (template === 2) {
    return {
      prompt: "Statements: All coders are learners. Some learners are mentors. Which conclusion definitely follows?",
      correct: "Some mentors may be coders cannot be concluded",
      distractors: ["All learners are coders", "Some coders are definitely mentors", "No mentor is a learner"],
      explanation: "The statements do not guarantee overlap between coders and mentors, so that link cannot be concluded.",
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 60
    };
  }

  return {
    prompt: "A person walks 8 m north, turns right, walks 5 m, then turns right and walks 8 m. Where is the person relative to the start?",
    correct: "5 m east",
    distractors: ["5 m west", "8 m north", "At the starting point"],
    explanation: "The north and south movement cancel out, leaving a 5 m shift to the east.",
    difficulty: difficultyFromIndex(index),
    estimatedSeconds: 45
  };
}

function createVerbalQuestion(topicId: string, index: number): DraftQuestion {
  if (index % 3 === 0) {
    const entry = synonymPairs[index % synonymPairs.length];
    return {
      prompt: `Choose the word closest in meaning to '${entry[0]}'.`,
      correct: entry[1],
      distractors: entry[2] as [string, string, string],
      explanation: `'${entry[1]}' is the closest synonym of '${entry[0]}'.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 35
    };
  }

  if (index % 3 === 1) {
    const entry = antonymPairs[index % antonymPairs.length];
    return {
      prompt: `Choose the word opposite in meaning to '${entry[0]}'.`,
      correct: entry[1],
      distractors: entry[2] as [string, string, string],
      explanation: `'${entry[1]}' is the closest antonym of '${entry[0]}'.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 35
    };
  }

  const entry = fillBlankSets[index % fillBlankSets.length];
  return {
    prompt: entry.prompt,
    correct: entry.correct,
    distractors: entry.distractors as [string, string, string],
    explanation: entry.explanation,
    difficulty: difficultyFromIndex(index),
    estimatedSeconds: 40
  };
}

function createPuzzleQuestion(topicId: string, index: number): DraftQuestion {
  const rng = createRng(`${topicId}-${index}`);
  const template = index % 4;

  if (template === 0) {
    const hour = randInt(rng, 1, 11);
    const minute = [0, 5, 10, 15, 20, 25, 30][randInt(rng, 0, 6)];
    const hourAngle = (hour % 12) * 30 + minute * 0.5;
    const minuteAngle = minute * 6;
    const diff = Math.abs(hourAngle - minuteAngle);
    const correct = Math.min(diff, 360 - diff);
    return {
      prompt: `Use the clock image below. What is the smaller angle between the hands at ${hour}:${minute.toString().padStart(2, "0")}?`,
      correct: `${correct} degrees`,
      distractors: [`${Math.abs(hourAngle - minuteAngle)} degrees`, `${Math.max(0, correct - 15)} degrees`, `${Math.min(180, correct + 15)} degrees`],
      explanation: `Hour hand = ${hourAngle} degrees, minute hand = ${minuteAngle} degrees. Smaller angle = ${correct} degrees.`,
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 60,
      media: createClockMedia(hour, minute)
    };
  }

  if (template === 1) {
    const start = randInt(rng, 2, 8);
    const seq = [start, start + 3, start + 8, start + 15];
    const correct = start + 24;
    return {
      prompt: `Find the missing number in the pattern: ${seq.join(", ")}, ?`,
      correct: `${correct}`,
      distractors: [`${correct + 2}`, `${correct - 3}`, `${seq[3] + 7}`],
      explanation: "The differences are +3, +5, +7, so the next difference is +9.",
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 45
    };
  }

  if (template === 2) {
    const letters = ["B", "D", "G", "K"];
    return {
      prompt: `Find the next letter sequence term: ${letters.join(", ")}, ?`,
      correct: "P",
      distractors: ["N", "Q", "R"],
      explanation: "The jumps are +2, +3, +4, so the next jump is +5 from K to P.",
      difficulty: difficultyFromIndex(index),
      estimatedSeconds: 40
    };
  }

  return {
    prompt: "Five students P, Q, R, S, and T sit in a row. Q is left of R, S is right of T, and P is at the extreme left. Which arrangement can satisfy the clues?",
    correct: "P Q R T S",
    distractors: ["Q P R S T", "P R Q T S", "P T S Q R"],
    explanation: "P must be at the extreme left, Q must stay left of R, and S must stay right of T. Only one option satisfies all three.",
    difficulty: difficultyFromIndex(index),
    estimatedSeconds: 65
  };
}

function buildDraftQuestion(topic: Topic, index: number): DraftQuestion {
  if (topic.family === "quant") return createQuantQuestion(topic.id, index);
  if (topic.family === "data-interpretation") return createDataInterpretationQuestion(topic.id, index);
  if (topic.family === "reasoning") return createReasoningQuestion(topic.id, index);
  if (topic.family === "verbal") return createVerbalQuestion(topic.id, index);
  if (topic.family === "puzzle") return createPuzzleQuestion(topic.id, index);
  return createKnowledgeQuestion(topic, index);
}

export function getQuestionCountForTopic(topicId: string) {
  if (!getTopicById(topicId)) return 0;
  return QUESTION_COUNT_PER_TOPIC;
}

export function getQuestionsForTopic(topicId: string, count = QUESTION_COUNT_PER_TOPIC) {
  const topic = getTopicById(topicId);
  if (!topic) return [];
  return Array.from({ length: Math.min(count, QUESTION_COUNT_PER_TOPIC) }, (_, index) => finalizeQuestion(topicId, index, buildDraftQuestion(topic, index)));
}

export function pickQuestionsForTopics(topicIds: string[], totalQuestions: number, seed = `${Date.now()}`) {
  const topics = topicIds.map((topicId) => getTopicById(topicId)).filter(Boolean) as Topic[];
  if (!topics.length) return [];

  const base = Math.floor(totalQuestions / topics.length);
  const extra = totalQuestions % topics.length;
  const selection: Question[] = [];

  topics.forEach((topic, idx) => {
    const targetCount = base + (idx < extra ? 1 : 0);
    const source = getQuestionsForTopic(topic.id, QUESTION_COUNT_PER_TOPIC);
    const shuffled = shuffle(source, createRng(`${seed}-${topic.id}`));
    selection.push(...shuffled.slice(0, targetCount));
  });

  return shuffle(selection, createRng(`${seed}-final`));
}

export function getNextPracticeQuestion(topicId: string, seenQuestionIds: string[] = [], seed = `${Date.now()}`) {
  const source = getQuestionsForTopic(topicId, QUESTION_COUNT_PER_TOPIC);
  if (!source.length) {
    return null;
  }

  const seenIds = new Set(seenQuestionIds);
  const unseen = source.filter((question) => !seenIds.has(question.id));
  const pool = unseen.length ? unseen : source;
  const shuffled = shuffle(pool, createRng(`${seed}-${topicId}-${seenQuestionIds.length}`));

  return {
    question: shuffled[0],
    wrapped: unseen.length === 0 && seenQuestionIds.length > 0
  };
}

export function getRecommendedTopics() {
  return allTopics.slice(0, 8);
}









