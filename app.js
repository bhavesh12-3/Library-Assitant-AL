// ===== AI-POWERED LIBRARY BOOK FINDER – app.js =====

// ══════════════════════════════════════════════
//  STATE MANAGEMENT
// ══════════════════════════════════════════════
const state = {
  selectedBook: null,
  searchQuery: "",
  assistantResults: [],
  trendingBooks: [],
  popularity: {}   // bookId → click count
};

// Load persisted popularity from sessionStorage
(function loadPopularity() {
  try {
    const saved = sessionStorage.getItem("bookPopularity");
    if (saved) state.popularity = JSON.parse(saved);
  } catch(e) { /* ignore */ }
})();

function savePopularity() {
  try { sessionStorage.setItem("bookPopularity", JSON.stringify(state.popularity)); }
  catch(e) { /* ignore */ }
}

function trackBookClick(bookId) {
  state.popularity[bookId] = (state.popularity[bookId] || 0) + 1;
  savePopularity();
  buildPopular(); // refresh trending list live
}

// ══════════════════════════════════════════════
//  SYNONYM / INTENT MAPPINGS
// ══════════════════════════════════════════════
const synonymMap = {
  easy:["beginner","intro","basic","simple","starter","fundamentals","accessible","friendly","quick"],
  beginner:["easy","intro","basic","simple","starter","fundamentals","accessible","friendly"],
  hard:["advanced","complex","deep","theory","comprehensive","math"],
  advanced:["hard","complex","deep","theory","comprehensive","expert"],
  intermediate:["moderate","practical","applied","hands-on"],
  ml:["machine learning","ml","predictive","classification","regression"],
  "machine learning":["ml","predictive","classification","regression","supervised","unsupervised"],
  ai:["artificial intelligence","ai","smart","intelligent","cognitive"],
  "artificial intelligence":["ai","smart","intelligent","cognitive"],
  dl:["deep learning","neural network","cnn","rnn","transformer"],
  "deep learning":["dl","neural network","cnn","rnn","transformer","keras","pytorch","tensorflow"],
  python:["python","py","scripting"],
  web:["web development","html","css","javascript","frontend","backend","react","node"],
  "data science":["data","analytics","visualization","pandas","numpy","statistics"],
  database:["sql","nosql","mongodb","relational","queries"],
  security:["cybersecurity","hacking","crypto","ethical","penetration"],
  cloud:["aws","azure","docker","kubernetes","devops","containers"],
  mobile:["android","ios","flutter","swift","app"],
  java:["java","jvm","object oriented","oop"],
  "c++":["cpp","c plus plus"],
  algorithm:["algorithms","data structures","sorting","searching","complexity"],
  nlp:["natural language processing","text","language","transformers","bert","gpt"],
  math:["mathematics","calculus","linear algebra","discrete","statistics","probability"],
  robot:["robotics","automation","control","mechanical"],
  iot:["internet of things","sensors","embedded","connected"],
};

const difficultyPhrases = {
  beginner:["easy","simple","beginner","basic","intro","introductory","starter","for beginners","getting started","first","quick","friendly","accessible"],
  intermediate:["intermediate","moderate","practical","hands-on","applied","working"],
  advanced:["advanced","hard","complex","difficult","deep","expert","comprehensive","in-depth","theory","theoretical","math heavy"]
};

// Subject name → keywords people might type
const subjectAliases = {
  "Python":["python","py"],
  "Machine Learning":["machine learning","ml"],
  "AI":["ai","artificial intelligence"],
  "Deep Learning":["deep learning","dl","neural"],
  "Data Science":["data science","data","analytics"],
  "Algorithms":["algorithm","algorithms","data structures"],
  "Web Development":["web","html","css","javascript","react","frontend","backend"],
  "Software Engineering":["software","engineering","clean code","testing","agile"],
  "Java":["java"],
  "Databases":["database","sql","nosql","mongodb"],
  "NLP":["nlp","natural language","text processing"],
  "Computer Vision":["computer vision","image","visual"],
  "Statistics":["statistics","stats","probability"],
  "Cybersecurity":["security","cyber","hacking","ethical"],
  "Cloud Computing":["cloud","aws","docker","kubernetes","devops"],
  "Mobile Development":["mobile","android","ios","flutter","app"],
  "Mathematics":["math","calculus","linear algebra","discrete"],
  "Programming":["programming","c","c++","rust","go"],
  "Operating Systems":["os","operating system","linux"],
  "Networking":["networking","network","protocols"],
  "Computer Science":["computer science","cs","theory","computation"],
  "Robotics":["robot","robotics"],
  "IoT":["iot","internet of things","sensors"],
  "Blockchain":["blockchain","crypto"],
  "Quantum Computing":["quantum"],
  "Design":["ux","ui","design"],
  "Embedded Systems":["embedded","microcontroller"],
  "Data Structures":["data structures","linked list","arrays"]
};

// ══════════════════════════════════════════════
//  UTILITY HELPERS
// ══════════════════════════════════════════════
function normalize(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
}

function expandQuery(query) {
  const words = normalize(query).split(/\s+/);
  const expanded = new Set(words);
  words.forEach(w => {
    if (synonymMap[w]) synonymMap[w].forEach(s => expanded.add(s));
    Object.keys(synonymMap).forEach(k => {
      if (k.includes(w) || w.includes(k)) synonymMap[k].forEach(s => expanded.add(s));
    });
  });
  return expanded;
}

// ══════════════════════════════════════════════
//  INTENT EXTRACTION  (for AI Assistant)
// ══════════════════════════════════════════════
function extractQueryIntent(query) {
  const q = normalize(query);
  const intent = { subjects: [], difficulty: null, keywords: [], raw: q };

  // Extract difficulty
  for (const [level, phrases] of Object.entries(difficultyPhrases)) {
    if (phrases.some(p => q.includes(p))) { intent.difficulty = level; break; }
  }

  // Extract subjects
  for (const [subject, aliases] of Object.entries(subjectAliases)) {
    if (aliases.some(a => q.includes(a))) intent.subjects.push(subject);
  }

  // Extract remaining keywords (words that aren't stop words)
  const stopWords = new Set(["i","want","a","an","the","me","for","to","about","on","in","with","that","is","of","and","or","some","any","good","book","books","find","show","give","get","need","looking","recommend","please"]);
  q.split(/\s+/).forEach(w => {
    if (w.length > 1 && !stopWords.has(w)) intent.keywords.push(w);
  });

  return intent;
}

// ══════════════════════════════════════════════
//  SCORING ENGINE
// ══════════════════════════════════════════════
function scoreBook(book, query) {
  const expanded = expandQuery(query);
  const wantedDiff = extractQueryIntent(query).difficulty;
  let score = 0;

  // Title match (high weight)
  const titleNorm = normalize(book.title);
  expanded.forEach(term => { if (titleNorm.includes(term)) score += 15; });

  // Subject match (+3 base, boosted)
  const subjNorm = normalize(book.subject);
  expanded.forEach(term => { if (subjNorm.includes(term)) score += 12; });

  // Keyword match (+1 to +2)
  book.keywords.forEach(kw => {
    const kwn = normalize(kw);
    expanded.forEach(term => {
      if (kwn === term) score += 10;
      else if (kwn.includes(term) || term.includes(kwn)) score += 5;
    });
  });

  // Description match
  const descNorm = normalize(book.description);
  expanded.forEach(term => { if (descNorm.includes(term)) score += 3; });

  // Difficulty bonus (+2 concept, implemented as +20 for strong signal)
  if (wantedDiff && book.difficulty === wantedDiff) score += 20;

  // Small bonus for available books
  if (book.availability === "available") score += 2;

  return score;
}

function searchBooks(query) {
  if (!query.trim()) return [];
  return books.map(b => ({ ...b, score: scoreBook(b, query) }))
    .filter(b => b.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ══════════════════════════════════════════════
//  INTELLIGENT REASON GENERATOR
// ══════════════════════════════════════════════
function getReason(book, intent) {
  const reasons = [];

  // Difficulty-based reason
  if (intent.difficulty) {
    if (book.difficulty === intent.difficulty) {
      const diffLabels = {
        beginner: "Good for beginners — easy to follow",
        intermediate: "Balanced mix of theory and practice",
        advanced: "In-depth and comprehensive coverage"
      };
      reasons.push(diffLabels[book.difficulty]);
    }
  }

  // Subject-based reason
  if (intent.subjects.length > 0) {
    const matchedSubj = intent.subjects.find(s =>
      normalize(book.subject).includes(normalize(s)) || normalize(s).includes(normalize(book.subject))
    );
    if (matchedSubj) {
      reasons.push(`Matches your interest in ${book.subject}`);
    }
  }

  // Keyword-based reasons
  const matchedKws = [];
  intent.keywords.forEach(kw => {
    book.keywords.forEach(bkw => {
      if (normalize(bkw).includes(kw) || kw.includes(normalize(bkw))) {
        matchedKws.push(bkw);
      }
    });
  });
  if (matchedKws.length > 0) {
    const unique = [...new Set(matchedKws)].slice(0, 2);
    reasons.push(`Covers ${unique.join(" & ")}`);
  }

  // Pages-based reason
  if (intent.difficulty === "beginner" && book.pages < 400) {
    reasons.push("Short and concise read");
  }

  // Availability bonus
  if (book.availability === "available") {
    reasons.push("Currently available in library");
  }

  // Fallback
  if (reasons.length === 0) {
    reasons.push("Relevant to your query");
  }

  // Return the top 2 most relevant reasons
  return reasons.slice(0, 2).join(" · ");
}

// ══════════════════════════════════════════════
//  DETAILED MATCH REASONS (For AI Assistant)
// ══════════════════════════════════════════════
function getDetailedMatchReasons(book, intent, score) {
  const reasons = [];
  const kws = new Set(book.keywords.map(k => k.toLowerCase()));
  
  // Subject-specific detailed reasons
  if (book.subject === "Python") {
    if (kws.has("beginner")) {
      reasons.push(`✓ Python fundamentals with practical examples`);
      if (kws.has("automation") || kws.has("scripting")) {
        reasons.push(`✓ Learn scripting & automation techniques`);
      } else {
        reasons.push(`✓ Covers basics, functions, and object-oriented programming`);
      }
    } else if (kws.has("advanced") || kws.has("idiomatic")) {
      reasons.push(`✓ Advanced Python patterns & Pythonic code style`);
      reasons.push(`✓ Deep understanding of decorators, generators, metaclasses`);
    } else {
      reasons.push(`✓ Comprehensive Python language reference`);
      reasons.push(`✓ Covers all standard library modules`);
    }
  } 
  else if (book.subject === "Machine Learning") {
    if (kws.has("scikit") || kws.has("tensorflow")) {
      reasons.push(`✓ Hands-on with scikit-learn, Keras & TensorFlow`);
      reasons.push(`✓ Covers supervised, unsupervised & reinforcement learning`);
    } else if (kws.has("beginner")) {
      reasons.push(`✓ ML concepts explained in simple terms`);
      reasons.push(`✓ Practical Python implementation with sklearn`);
    } else if (kws.has("advanced")) {
      reasons.push(`✓ Advanced ML algorithms & mathematical theory`);
      reasons.push(`✓ Pattern recognition, Bayesian methods & optimization`);
    } else {
      reasons.push(`✓ Complete guide to machine learning theory & practice`);
    }
  }
  else if (book.subject === "Deep Learning") {
    if (kws.has("beginner")) {
      reasons.push(`✓ Neural networks built from scratch`);
      reasons.push(`✓ Understand backpropagation & activation functions`);
    } else if (kws.has("keras")) {
      reasons.push(`✓ Practical deep learning with Keras framework`);
      reasons.push(`✓ CNNs, RNNs & transfer learning techniques`);
    } else {
      reasons.push(`✓ Deep learning theory & advanced architectures`);
      reasons.push(`✓ Includes GANs, RNNs, attention mechanisms & optimization`);
    }
  }
  else if (book.subject === "Data Science") {
    if (kws.has("pandas") || kws.has("data")) {
      reasons.push(`✓ Data wrangling with pandas & NumPy`);
      reasons.push(`✓ Data cleaning, transformation & exploration techniques`);
    } else if (kws.has("statistics")) {
      reasons.push(`✓ Statistical foundations for data science`);
      reasons.push(`✓ Probability, hypothesis testing & distributions`);
    } else if (kws.has("systems") || kws.has("distributed")) {
      reasons.push(`✓ Designing large-scale data systems & architecture`);
      reasons.push(`✓ Understanding databases, streams & storage systems`);
    } else {
      reasons.push(`✓ Core data science with Python & statistics`);
    }
  }
  else if (book.subject === "Algorithms") {
    if (kws.has("beginner")) {
      reasons.push(`✓ Algorithms explained with visual illustrations`);
      reasons.push(`✓ Sorting, searching, graphs & dynamic programming basics`);
    } else if (kws.has("design") || kws.has("problem solving")) {
      reasons.push(`✓ Algorithm design techniques & optimization`);
      reasons.push(`✓ Real-world problem solving strategies`);
    } else {
      reasons.push(`✓ Complete algorithmic foundations & complexity analysis`);
      reasons.push(`✓ Covers all major algorithms & data structures`);
    }
  }
  else if (book.subject === "Web Development") {
    if (kws.has("html") || kws.has("css")) {
      reasons.push(`✓ HTML5 & CSS3 with modern design practices`);
      reasons.push(`✓ Responsive design & layouts`);
    } else if (kws.has("javascript") && kws.has("beginner")) {
      reasons.push(`✓ JavaScript fundamentals & DOM manipulation`);
      reasons.push(`✓ Event handling & asynchronous programming basics`);
    } else if (kws.has("react") || kws.has("framework")) {
      reasons.push(`✓ React.js for building modern user interfaces`);
      reasons.push(`✓ Components, state management & hooks`);
    } else if (kws.has("advanced")) {
      reasons.push(`✓ Advanced JavaScript patterns & deep language features`);
      reasons.push(`✓ Closures, prototypes & functional programming`);
    }
  }
  else if (book.subject === "Software Engineering") {
    if (kws.has("clean code") || kws.has("readable")) {
      reasons.push(`✓ Writing clean, maintainable code`);
      reasons.push(`✓ Naming conventions, functions & code organization`);
    } else if (kws.has("design patterns")) {
      reasons.push(`✓ 23 classical design patterns & their applications`);
      reasons.push(`✓ Creational, structural & behavioral patterns`);
    } else if (kws.has("best practices")) {
      reasons.push(`✓ Industry best practices & programming wisdom`);
      reasons.push(`✓ Career advice & professional development`);
    }
  }
  else if (book.subject === "AI") {
    if (kws.has("beginner") || kws.has("non-technical")) {
      reasons.push(`✓ AI concepts without heavy mathematics`);
      reasons.push(`✓ Understanding neural networks, NLP & computer vision`);
    } else {
      reasons.push(`✓ Comprehensive coverage of all AI domains`);
      reasons.push(`✓ Search algorithms, logic, knowledge representation & robotics`);
    }
  }
  else if (book.subject === "NLP") {
    if (kws.has("beginner")) {
      reasons.push(`✓ Text processing with NLTK toolkit`);
      reasons.push(`✓ Tokenization, stemming, lemmatization & sentiment analysis`);
    } else {
      reasons.push(`✓ Advanced NLP with transformers & deep learning`);
      reasons.push(`✓ Language models, parsing & machine translation`);
    }
  }
  else if (book.subject === "Databases") {
    if (kws.has("sql") && kws.has("beginner")) {
      reasons.push(`✓ SQL queries & relational database design`);
      reasons.push(`✓ JOINs, subqueries & optimization`);
    } else if (kws.has("mongodb") || kws.has("nosql")) {
      reasons.push(`✓ NoSQL with MongoDB document database`);
      reasons.push(`✓ BSON, aggregation & index optimization`);
    } else {
      reasons.push(`✓ Complete database system concepts & design`);
      reasons.push(`✓ Normalization, transactions & query optimization`);
    }
  }
  else if (book.subject === "Statistics") {
    reasons.push(`✓ Statistics & probability theory`);
    if (kws.has("practical")) {
      reasons.push(`✓ Practical applications in data science`);
    } else {
      reasons.push(`✓ Distributions, hypothesis testing & regression`);
    }
  }
  else if (book.subject === "Java") {
    if (kws.has("beginner")) {
      reasons.push(`✓ Java fundamentals & object-oriented programming`);
      reasons.push(`✓ Classes, inheritance & polymorphism`);
    } else {
      reasons.push(`✓ Best practices & advanced Java patterns`);
      reasons.push(`✓ Generics, concurrency & effective Java techniques`);
    }
  }
  else if (book.subject === "Operating Systems") {
    reasons.push(`✓ OS architecture, processes & memory management`);
    reasons.push(`✓ Concurrency, I/O & system calls`);
  }
  
  // Add difficulty match
  if (intent.difficulty && book.difficulty === intent.difficulty) {
    const diffLabels = {
      beginner: "✓ Perfect for getting started",
      intermediate: "✓ Balanced theory and practice",
      advanced: "✓ In-depth comprehensive coverage"
    };
    if (!reasons.some(r => r.includes("Perfect") || r.includes("Balanced") || r.includes("comprehensive"))) {
      reasons.push(diffLabels[book.difficulty]);
    }
  }
  
  // Add length/readability (only if not already added)
  if (book.pages < 300 && !reasons.some(r => r.includes("Quick") || r.includes("concise"))) {
    reasons.push(`✓ Quick reference (${book.pages} pages)`);
  }
  
  // Add availability
  if (book.availability === "available" && !reasons.some(r => r.includes("available"))) {
    reasons.push(`✓ Available in library`);
  }
  
  // Return top 3-4 most relevant reasons
  return reasons.slice(0, 4);
}

// ══════════════════════════════════════════════
//  CONFIDENCE SCORE CALCULATOR
// ══════════════════════════════════════════════
function getConfidenceScore(score) {
  // Convert raw score to confidence percentage (0-100)
  const confidence = Math.min(99, Math.round((score / 100) * 95) + 5);
  return confidence;
}

// ══════════════════════════════════════════════
//  DOM REFERENCES
// ══════════════════════════════════════════════
const $ = id => document.getElementById(id);
const searchInput = $("searchInput"), searchBtn = $("searchBtn"),
  suggestionsEl = $("suggestions"), bookGrid = $("bookGrid"),
  loading = $("loading"), noResults = $("noResults"),
  resultsTitle = $("resultsTitle"), detailOverlay = $("detailOverlay"),
  detailContent = $("detailContent"), detailClose = $("detailClose"),
  assistantInput = $("assistantInput"), assistantBtn = $("assistantBtn"),
  assistantResults = $("assistantResults"), mapGrid = $("mapGrid"),
  popularList = $("popularList");

// ══════════════════════════════════════════════
//  RENDER BOOK CARD
// ══════════════════════════════════════════════
function renderCard(book, showScore = false) {
  const diffClass = `tag-${book.difficulty}`;
  const availClass = book.availability;
  const scoreHtml = showScore && book.score
    ? `<div class="match-score">${Math.min(99, Math.round(book.score))}% match</div>` : "";
  return `
    <div class="book-card" data-id="${book.id}">
      ${scoreHtml}
      <div class="title">${book.title}</div>
      <div class="author">${book.author}</div>
      <div class="desc">${book.description}</div>
      <div class="tags">
        <span class="tag tag-subject">${book.subject}</span>
        <span class="tag ${diffClass}">${book.difficulty}</span>
      </div>
      <div class="meta">
        <span class="availability ${availClass}"><span class="dot"></span> ${book.availability === "available" ? "Available" : "Issued"}</span>
        <span class="rack-loc"><i class="fa-solid fa-location-dot"></i> Rack <strong>${book.rack}</strong></span>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
//  DISPLAY BOOKS + CARD CLICK HANDLING
// ══════════════════════════════════════════════
function displayBooks(list, showScore = false) {
  noResults.style.display = list.length ? "none" : "block";
  bookGrid.innerHTML = list.map(b => renderCard(b, showScore)).join("");
  attachCardListeners();
}

function attachCardListeners() {
  bookGrid.querySelectorAll(".book-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = +card.dataset.id;
      selectBook(id);
      openDetail(id);
    });
  });
}

// ══════════════════════════════════════════════
//  BOOK SELECTION (state + map + trending)
// ══════════════════════════════════════════════
function selectBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  state.selectedBook = book;
  highlightRack(book.rack);
  trackBookClick(id);
}

// ══════════════════════════════════════════════
//  DETAIL PANEL
// ══════════════════════════════════════════════
function openDetail(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  state.selectedBook = book;
  highlightRack(book.rack);

  const similar = books
    .filter(b => b.id !== id && (b.subject === book.subject || book.keywords.some(k => b.keywords.includes(k))))
    .map(b => ({ ...b, simScore: (b.subject === book.subject ? 3 : 0) + book.keywords.filter(k => b.keywords.includes(k)).length }))
    .sort((a, b) => b.simScore - a.simScore)
    .slice(0, 3);

  const reasonMap = { beginner: "Beginner-friendly", intermediate: "Good follow-up", advanced: "Deep dive" };

  detailContent.innerHTML = `
    <h2>${book.title}</h2>
    <div class="author">by ${book.author}</div>
    <div class="tags" style="margin:12px 0">
      <span class="tag tag-subject">${book.subject}</span>
      <span class="tag tag-${book.difficulty}">${book.difficulty}</span>
    </div>
    <p class="desc-full">${book.description}</p>
    <div class="detail-info">
      <div class="info-item"><label>Pages</label><span>${book.pages}</span></div>
      <div class="info-item"><label>Rack</label><span>${book.rack}</span></div>
      <div class="info-item"><label>Status</label><span style="color:${book.availability === "available" ? "var(--success)" : "var(--danger)"}">${book.availability === "available" ? "Available" : "Issued"}</span></div>
      <div class="info-item"><label>Difficulty</label><span>${book.difficulty}</span></div>
    </div>
    ${similar.length ? `
    <div class="similar-section">
      <h3><i class="fa-solid fa-sparkles" style="color:var(--accent)"></i> You may also like</h3>
      <div class="similar-books">
        ${similar.map(s => `
          <div class="similar-card" data-id="${s.id}">
            <div class="info"><div class="title">${s.title}</div><div class="author">${s.author}</div></div>
            <div class="reason">${reasonMap[s.difficulty] || "Related"}</div>
          </div>`).join("")}
      </div>
    </div>` : ""}`;

  detailOverlay.classList.add("show");

  detailContent.querySelectorAll(".similar-card").forEach(c => {
    c.addEventListener("click", () => {
      const simId = +c.dataset.id;
      selectBook(simId);
      openDetail(simId);
    });
  });
}

detailClose.addEventListener("click", () => detailOverlay.classList.remove("show"));
detailOverlay.addEventListener("click", e => {
  if (e.target === detailOverlay) detailOverlay.classList.remove("show");
});

// ══════════════════════════════════════════════
//  SEARCH EXECUTION
// ══════════════════════════════════════════════
function executeSearch(query) {
  if (!query.trim()) { showDefault(); return; }
  state.searchQuery = query;
  loading.classList.add("show");
  bookGrid.innerHTML = "";
  noResults.style.display = "none";
  resultsTitle.textContent = `Results for "${query}"`;
  suggestionsEl.classList.remove("show");

  setTimeout(() => {
    const results = searchBooks(query);
    loading.classList.remove("show");
    displayBooks(results, true);
  }, 600);
}

searchBtn.addEventListener("click", () => executeSearch(searchInput.value));
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") executeSearch(searchInput.value); });

// ── Suggestion chips ──
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    searchInput.value = chip.dataset.query;
    executeSearch(chip.dataset.query);
  });
});

// ── Live suggestions ──
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();
  if (q.length < 2) { suggestionsEl.classList.remove("show"); return; }
  const results = searchBooks(q).slice(0, 5);
  if (!results.length) { suggestionsEl.classList.remove("show"); return; }
  suggestionsEl.innerHTML = results.map(b => `
    <div class="suggestion-item" data-id="${b.id}">
      <span class="icon"><i class="fa-solid fa-book"></i></span>
      <span>${b.title} <span style="color:var(--text-muted)">– ${b.author}</span></span>
    </div>`).join("");
  suggestionsEl.classList.add("show");
  suggestionsEl.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      searchInput.value = books.find(b => b.id === +item.dataset.id).title;
      suggestionsEl.classList.remove("show");
      executeSearch(searchInput.value);
    });
  });
});

document.addEventListener("click", e => {
  if (!$("searchWrap").contains(e.target)) suggestionsEl.classList.remove("show");
});

// ══════════════════════════════════════════════
//  AI ASSISTANT — "Find Me a Book"
// ══════════════════════════════════════════════
function runAssistant(query) {
  if (!query.trim()) return;

  // 1. Extract user intent
  const intent = extractQueryIntent(query);

  // 2. Score and rank books — LIMIT TO TOP 3 PICKS
  let results = searchBooks(query).slice(0, 3);
  state.assistantResults = results;

  // 3. Fallback: if no strong match, return closest books by subject or popularity
  if (results.length === 0) {
    // Try to find ANY books related to detected subjects
    if (intent.subjects.length > 0) {
      results = books
        .filter(b => intent.subjects.some(s => normalize(b.subject).includes(normalize(s))))
        .slice(0, 3);
    }
    // Ultimate fallback: show most popular
    if (results.length === 0) {
      results = getPopularBooks().slice(0, 3);
    }
  }

  if (!results.length) {
    assistantResults.innerHTML = `<p style="font-size:13px;color:var(--text-muted);margin-top:8px">No matching books found. Try rephrasing!</p>`;
    return;
  }

  // 4. Generate AI picks with confidence score and detailed match reasons
  assistantResults.innerHTML = results.map((b, i) => {
    const confidence = getConfidenceScore(b.score);
    const detailedReasons = getDetailedMatchReasons(b, intent, b.score);
    const reasonsHtml = detailedReasons.length > 0 
      ? `<div class="match-details">${detailedReasons.join("<br>")}</div>`
      : "";
    
    return `
    <div class="assistant-card" data-id="${b.id}">
      <div class="ai-pick-header">
        <div class="rank">${i === 0 ? "🎯" : "#" + (i + 1)}</div>
        <div class="confidence">🎯 ${confidence}% match</div>
      </div>
      <div class="info">
        <div class="title">${b.title}</div>
        <div class="author">${b.author}</div>
        ${reasonsHtml}
      </div>
    </div>`;
  }).join("");

  assistantResults.querySelectorAll(".assistant-card").forEach(c => {
    c.addEventListener("click", () => {
      const id = +c.dataset.id;
      selectBook(id);
      openDetail(id);
    });
  });
}

assistantBtn.addEventListener("click", () => runAssistant(assistantInput.value));
assistantInput.addEventListener("keydown", e => { if (e.key === "Enter") runAssistant(assistantInput.value); });

// ══════════════════════════════════════════════
//  LIBRARY MAP — Dynamic Rack Highlighting
// ══════════════════════════════════════════════
const rackSections = [
  { id: "A", label: "Programming", racks: ["A1","A2","A3","A4","A5","A6","A7"] },
  { id: "B", label: "Machine Learning", racks: ["B1","B2"] },
  { id: "C", label: "AI / DL / NLP", racks: ["C1","C2","C3","C4","C5"] },
  { id: "D", label: "Data Science", racks: ["D1","D2"] },
  { id: "E", label: "CS / Systems", racks: ["E1","E2","E3","E4","E5"] },
  { id: "F", label: "Math / SE", racks: ["F1","F2","F3","F4"] }
];

function buildMap() {
  mapGrid.innerHTML = rackSections.map(s => `
    <div class="map-cell" data-section="${s.id}" data-racks="${s.racks.join(",")}">
      <div class="rack-id">${s.id}</div>
      <div class="rack-label">${s.label}</div>
    </div>`).join("");

  // Make map cells clickable — show books in that section
  mapGrid.querySelectorAll(".map-cell").forEach(cell => {
    cell.addEventListener("click", () => {
      const section = cell.dataset.section;
      const sectionBooks = books.filter(b => b.rack.charAt(0) === section);
      resultsTitle.textContent = `Books in Section ${section} — ${rackSections.find(s => s.id === section).label}`;
      displayBooks(sectionBooks);
      // Highlight clicked section
      mapGrid.querySelectorAll(".map-cell").forEach(c => c.classList.remove("highlight"));
      cell.classList.add("highlight");
    });
  });
}

function highlightRack(rack) {
  const section = rack.charAt(0);
  mapGrid.querySelectorAll(".map-cell").forEach(c => {
    c.classList.toggle("highlight", c.dataset.section === section);
  });

  // Smooth scroll map into view if not visible
  const mapEl = $("libMap");
  if (mapEl) {
    const rect = mapEl.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) {
      mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

// ══════════════════════════════════════════════
//  TRENDING / POPULAR BOOKS (Popularity-based)
// ══════════════════════════════════════════════

// Base popularity scores (simulated real-world data)
const basePopularity = {
  1: 42, 2: 38, 5: 45, 6: 36, 8: 50, 9: 40, 10: 55,
  11: 35, 12: 33, 14: 30, 17: 28, 18: 47, 20: 44,
  21: 32, 23: 29, 25: 26, 29: 24, 45: 48, 51: 37, 57: 31,
  71: 43, 96: 52
};

function getBookPopularity(bookId) {
  const base = basePopularity[bookId] || 10;
  const clicks = state.popularity[bookId] || 0;
  return base + (clicks * 5); // each click adds 5 to score
}

function getPopularBooks() {
  return [...books]
    .map(b => ({ ...b, pop: getBookPopularity(b.id) }))
    .sort((a, b) => b.pop - a.pop);
}

function buildPopular() {
  const popular = getPopularBooks().slice(0, 6);
  state.trendingBooks = popular;

  popularList.innerHTML = popular.map((b, i) => `
    <div class="popular-item" data-id="${b.id}">
      <div class="popular-rank">${i + 1}</div>
      <div class="popular-info">
        <div class="title">${b.title}</div>
        <div class="author">${b.author} <span class="trending-badge">🔥 Trending</span></div>
      </div>
    </div>`).join("");

  popularList.querySelectorAll(".popular-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = +item.dataset.id;
      selectBook(id);
      openDetail(id);
    });
  });
}

// ══════════════════════════════════════════════
//  HEADER STATS
// ══════════════════════════════════════════════
function updateStats() {
  $("totalBooks").textContent = books.length;
  $("availCount").textContent = books.filter(b => b.availability === "available").length;
  $("subjectCount").textContent = new Set(books.map(b => b.subject)).size;
}

// ══════════════════════════════════════════════
//  DEFAULT VIEW
// ══════════════════════════════════════════════
function showDefault() {
  resultsTitle.textContent = "Popular Books";
  const popular = getPopularBooks().slice(0, 12);
  displayBooks(popular);
}

// ══════════════════════════════════════════════
//  INITIALIZATION
// ══════════════════════════════════════════════
function init() {
  updateStats();
  buildMap();
  buildPopular();
  showDefault();
}

init();
