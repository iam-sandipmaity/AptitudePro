import { TopicCategory, Topic } from "@/lib/types";

const QUESTION_COUNT = 220;

function createTopic(
  id: string,
  title: string,
  categoryId: string,
  family: Topic["family"],
  description: string,
  tagline: string
): Topic {
  return {
    id,
    title,
    categoryId,
    family,
    description,
    tagline,
    questionCount: QUESTION_COUNT
  };
}

export const topicCategories: TopicCategory[] = [
  {
    id: "general-aptitude",
    title: "General Aptitude",
    description: "Core speed-math and interpretation drills designed for daily repetition.",
    topics: [
      createTopic("arithmetic-aptitude", "Arithmetic Aptitude", "general-aptitude", "quant", "Percentages, ratios, averages, profit-loss, and time-work under pressure.", "Fast-paced quantitative reasoning"),
      createTopic("data-interpretation", "Data Interpretation", "general-aptitude", "data-interpretation", "Chart reading, comparisons, and ratio-based inference from compact datasets.", "Crunch numbers from tables and mini-charts"),
      createTopic("online-aptitude-test", "Online Aptitude Test", "general-aptitude", "quant", "Mixed aptitude mock questions with exam-style option traps.", "Mixed quant simulation set"),
      createTopic("data-interpretation-test", "Data Interpretation Test", "general-aptitude", "data-interpretation", "Timed DI sets focused on percentage changes and trend comparisons.", "Timed DI practice bank")
    ]
  },
  {
    id: "verbal-reasoning",
    title: "Verbal and Reasoning",
    description: "Language clarity, analytical deduction, and pattern recognition in one tight loop.",
    topics: [
      createTopic("verbal-ability", "Verbal Ability", "verbal-reasoning", "verbal", "Grammar, vocabulary, usage, and sentence completion with close distractors.", "Language precision with exam pressure"),
      createTopic("logical-reasoning", "Logical Reasoning", "verbal-reasoning", "reasoning", "Series, coding-decoding, statements, and elimination-based logic.", "Pattern recognition and logic traps"),
      createTopic("verbal-reasoning-topic", "Verbal Reasoning", "verbal-reasoning", "reasoning", "Inference, sequence, and relationship-based reasoning questions.", "Argument and sequence analysis"),
      createTopic("non-verbal-reasoning", "Non Verbal Reasoning", "verbal-reasoning", "reasoning", "Visual and abstract pattern logic represented in text-first form for speed practice.", "Abstract patterns without clutter")
    ]
  },
  {
    id: "current-affairs-gk",
    title: "Current Affairs and GK",
    description: "General awareness, science literacy, and fact recall with decision-making style options.",
    topics: [
      createTopic("current-affairs", "Current Affairs", "current-affairs-gk", "awareness", "General-awareness style MCQs inspired by competitive-exam current affairs patterns.", "Recent-affairs style recall drills"),
      createTopic("basic-general-knowledge", "Basic General Knowledge", "current-affairs-gk", "awareness", "Geography, polity, economy, history, and general awareness essentials.", "Broad GK with close choices"),
      createTopic("general-science", "General Science", "current-affairs-gk", "science", "Physics, chemistry, biology, and everyday scientific reasoning.", "Science fundamentals for tests")
    ]
  },
  {
    id: "interview",
    title: "Interview",
    description: "Placement readiness, communication choices, and hiring-scenario judgment calls.",
    topics: [
      createTopic("placement-papers", "Placement Papers", "interview", "interview", "Company-style screening questions and decision scenarios.", "Placement-focused decision making"),
      createTopic("group-discussion", "Group Discussion", "interview", "interview", "Best-response situations for collaboration, clarity, and structure.", "Discussion strategy and presence"),
      createTopic("hr-interview", "HR Interview", "interview", "interview", "Behavioral and situational MCQs around professional judgment.", "HR-style situational practice")
    ]
  },
  {
    id: "engineering",
    title: "Engineering",
    description: "Domain-specific fundamentals for technical screening and knowledge retention.",
    topics: [
      createTopic("mechanical-engineering", "Mechanical Engineering", "engineering", "engineering", "Thermodynamics, mechanics, materials, and manufacturing basics.", "Mechanical core revision"),
      createTopic("civil-engineering", "Civil Engineering", "engineering", "engineering", "Structures, surveying, materials, and construction planning concepts.", "Civil screening question bank"),
      createTopic("ece-eee-cse", "ECE, EEE, CSE", "engineering", "technical", "Mixed electronics, electrical, and core CS screening questions.", "Cross-discipline technical mix"),
      createTopic("chemical-engineering", "Chemical Engineering", "engineering", "engineering", "Process, heat transfer, reaction engineering, and plant basics.", "Chemical process fundamentals")
    ]
  },
  {
    id: "programming",
    title: "Programming",
    description: "Language-first MCQs for syntax, semantics, output prediction, and concepts.",
    topics: [
      createTopic("c-programming", "C Programming", "programming", "programming", "Pointers, memory, operators, and output-based C questions.", "C fundamentals and tricky outputs"),
      createTopic("cpp-programming", "C++ Programming", "programming", "programming", "OOP, STL, memory model, and inheritance concepts.", "C++ interview-style MCQs"),
      createTopic("csharp-programming", "C# Programming", "programming", "programming", "CLR, collections, async basics, and type-system questions.", "C# concepts with close options"),
      createTopic("java-programming", "Java Programming", "programming", "programming", "JVM, collections, OOP, exceptions, and concurrency essentials.", "Java screening practice")
    ]
  },
  {
    id: "online-tests",
    title: "Online Tests",
    description: "Focused mock tests with preset themes for rapid drill sessions.",
    topics: [
      createTopic("aptitude-test", "Aptitude Test", "online-tests", "quant", "Compact quantitative aptitude simulations for placement prep.", "Quick aptitude mocks"),
      createTopic("verbal-ability-test", "Verbal Ability Test", "online-tests", "verbal", "Short verbal simulations with grammar and vocab pressure.", "Short verbal mock bank"),
      createTopic("logical-reasoning-test", "Logical Reasoning Test", "online-tests", "reasoning", "Test-style reasoning sections with pattern-heavy questions.", "Reasoning mock section"),
      createTopic("c-programming-test", "C Programming Test", "online-tests", "programming", "Output prediction and concept MCQs in a timed format.", "C-focused coding test")
    ]
  },
  {
    id: "technical-mcqs",
    title: "Technical MCQs",
    description: "Short-form technical screening across systems, databases, and electronics.",
    topics: [
      createTopic("networking-questions", "Networking Questions", "technical-mcqs", "technical", "OSI, TCP/IP, routing, switching, and troubleshooting basics.", "Networking core MCQs"),
      createTopic("database-questions", "Database Questions", "technical-mcqs", "technical", "Normalization, indexing, joins, and transaction properties.", "Database concept drills"),
      createTopic("basic-electronics", "Basic Electronics", "technical-mcqs", "technical", "Semiconductors, diodes, transistors, and circuit behavior basics.", "Electronics fundamentals"),
      createTopic("digital-electronics", "Digital Electronics", "technical-mcqs", "technical", "Boolean logic, combinational circuits, and memory elements.", "Digital design screening")
    ]
  },
  {
    id: "technical-short-answers",
    title: "Technical Short Answers",
    description: "Short-answer style technical understanding converted into sharp multiple-choice practice.",
    topics: [
      createTopic("software-testing", "Software Testing", "technical-short-answers", "technical", "Testing principles, defect life cycle, and quality strategies.", "QA fundamentals at speed"),
      createTopic("c-language-basics", "The C Language Basics", "technical-short-answers", "programming", "Foundational C concepts, declarations, operators, and storage classes.", "C essentials refresher"),
      createTopic("sql-server", "SQL Server", "technical-short-answers", "technical", "T-SQL basics, indexes, transactions, and SQL Server behavior.", "SQL Server focused drill"),
      createTopic("networking-short-answers", "Networking", "technical-short-answers", "technical", "Practical network concepts re-framed as close-option MCQs.", "Networking quick recall")
    ]
  },
  {
    id: "medical-science",
    title: "Medical Science",
    description: "Life science fundamentals for factual recall and conceptual distinction.",
    topics: [
      createTopic("microbiology", "Microbiology", "medical-science", "medical", "Microbes, staining, immunity, and lab fundamentals.", "Microbiology rapid recall"),
      createTopic("biochemistry", "Biochemistry", "medical-science", "medical", "Metabolism, enzymes, biomolecules, and energy systems.", "Biochemistry concept bank"),
      createTopic("biotechnology", "Biotechnology", "medical-science", "medical", "Genetic engineering, fermentation, and molecular biology basics.", "Biotech screening drill"),
      createTopic("biochemical-engineering", "Biochemical Engineering", "medical-science", "medical", "Bioprocess design, reactors, downstream processing, and scale-up basics.", "Bioprocess aptitude set")
    ]
  },
  {
    id: "puzzles",
    title: "Puzzles",
    description: "Slow-thinking puzzle styles recast for fast, repeatable MCQ practice.",
    topics: [
      createTopic("sudoku", "Sudoku", "puzzles", "puzzle", "Grid logic, elimination, and constraint-based reasoning in bite-size form.", "Constraint puzzle training"),
      createTopic("number-puzzles", "Number Puzzles", "puzzles", "puzzle", "Number pattern recognition, balance logic, and equation puzzles.", "Number pattern workouts"),
      createTopic("missing-letters-puzzles", "Missing Letters Puzzles", "puzzles", "puzzle", "Alphabet movement, coded words, and letter progression drills.", "Letter-sequence puzzle bank"),
      createTopic("logical-puzzles", "Logical Puzzles", "puzzles", "puzzle", "Order, arrangement, and elimination-style puzzle logic.", "Pure logic puzzle practice"),
      createTopic("clock-puzzles", "Clock Puzzles", "puzzles", "puzzle", "Clock angle, meeting-time, and hand-position questions.", "Clock reasoning under time")
    ]
  }
];

export const allTopics = topicCategories.flatMap((category) => category.topics);

export const topicsById = Object.fromEntries(allTopics.map((topic) => [topic.id, topic]));

export function getTopicById(topicId: string) {
  return topicsById[topicId];
}

export function getCategoryById(categoryId: string) {
  return topicCategories.find((category) => category.id === categoryId);
}

