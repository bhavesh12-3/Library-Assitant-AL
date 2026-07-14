# 📚 AI-Powered Library Book Finder

> A smart library assistant that uses natural language search to help students find the right books quickly.

[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)]()
[![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

---

## 📌 Problem Statement

Traditional library management systems have significant limitations that affect the student experience:

- **Exact keyword dependency** — Students must know the precise title or author to search for a book. Vague or exploratory queries return no results.
- **No intelligent guidance** — Existing systems do not suggest alternatives, recommend similar books, or account for difficulty level.
- **Poor discoverability** — Students often struggle to find relevant books for a topic, especially when they are beginners and don't know the standard textbook names.
- **No location assistance** — Even after finding a book in the catalog, students have no visual guidance on where it is physically located in the library.

These issues lead to wasted time, frustration, and underutilization of library resources.

---

## 💡 Solution

The **AI-Powered Library Book Finder** addresses these problems by acting as a smart discovery tool:

- **Natural Language Understanding** — Users can type queries like *"I want an easy machine learning book"* or *"beginner Python"* instead of exact titles.
- **Semantic Search Engine** — The system expands queries using synonym mappings and intent detection to find relevant books even without exact keyword matches.
- **Intelligent Ranking** — Books are scored and ranked based on subject relevance, difficulty match, keyword overlap, and availability.
- **Contextual Recommendations** — Each result includes a human-readable reason explaining why it was recommended (e.g., *"Good for beginners — easy to follow"*).
- **Visual Rack Locator** — A library map highlights the physical location of the selected book's rack.

---

## ✨ Features

### Core Features

| Feature | Description |
|---|---|
| 🔍 **Natural Language Search** | Type queries in plain English — no exact keywords needed |
| 🤖 **"Find Me a Book" AI Assistant** | Describe what you need and get ranked recommendations with reasons |
| 📇 **Smart Book Cards** | Each card shows title, author, subject, difficulty, availability, and rack location |
| 🗺️ **Library Rack Visualization** | Interactive map highlights the rack section when a book is selected |
| 📖 **Similar Book Recommendations** | "You may also like" section shows related books based on subject and keywords |

### Additional Features

| Feature | Description |
|---|---|
| 🏷️ **Difficulty Classification** | Books tagged as Beginner (green), Intermediate (yellow), or Advanced (red) |
| 🔥 **Trending Books Section** | Popularity-based ranking that updates dynamically as users interact |
| ⌨️ **Live Search Suggestions** | Dropdown suggestions appear as the user types |
| 🏷️ **Suggestion Chips** | Quick-access filters for common searches like "Beginner ML" or "Python basics" |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile screens |

---

## 🧠 AI / ML Components

This prototype simulates AI-powered search using lightweight, rule-based techniques:

### 1. Semantic Search Engine
- **Synonym Expansion** — Maps related terms (e.g., *"easy"* → *beginner*, *"ML"* → *machine learning*) to broaden query coverage.
- **Multi-field Matching** — Scores are computed across title, subject, keywords, and description fields.

### 2. Intent Extraction
- **`extractQueryIntent()`** — Parses natural language queries to detect:
  - **Subject** (Python, AI, ML, etc.)
  - **Difficulty** (beginner, intermediate, advanced)
  - **Keywords** (filtered from stop words)

### 3. Scoring & Ranking Algorithm
Each book receives a relevance score based on:

| Match Type | Score Weight |
|---|---|
| Title match | +15 per term |
| Subject match | +12 per term |
| Exact keyword match | +10 per keyword |
| Partial keyword match | +5 per keyword |
| Description match | +3 per term |
| Difficulty match | +20 bonus |
| Availability bonus | +2 |

Books are sorted by descending score, and the top results are displayed.

### 4. Reason Generation
- **`getReason()`** — Generates human-readable explanations for each recommendation based on which fields matched (e.g., *"Matches your interest in AI · Short and concise read"*).

### 5. Recommendation System
- Similar books are identified by matching **subject** and **keyword overlap**.
- Results are ranked by a similarity score and displayed in the detail panel.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Structure** | HTML5 |
| **Styling** | CSS3 (custom, no frameworks) |
| **Logic** | Vanilla JavaScript (ES6+) |
| **Fonts** | Google Fonts (Inter, Poppins) |
| **Icons** | Font Awesome 6 |
| **Data** | Static JSON dataset (100 books) |

> **Note:** This is a fully client-side prototype. No backend server or external API is required. All AI logic runs in the browser.

---

## 📁 Project Structure

```
AI-Library-Book-Finder/
│
├── index.html          # Main HTML page — layout and structure
├── index.css           # Complete stylesheet — light theme, responsive
├── app.js              # Core application logic — search, assistant, map, state
├── data.js             # Mock dataset — 100 books with metadata
└── README.md           # Project documentation
```

### File Descriptions

| File | Purpose |
|---|---|
| `index.html` | Page structure with header, hero search bar, book grid, sidebar (assistant, map, trending), and detail modal |
| `index.css` | Light theme with card-based design, soft shadows, color-coded tags, smooth transitions, and responsive breakpoints |
| `app.js` | Search engine, intent extraction, scoring algorithm, reason generator, state management, map highlighting, popularity tracking |
| `data.js` | Array of 100 book objects covering 20+ subjects across all difficulty levels |

---

## 📊 Dataset

The prototype uses a custom static dataset of **100 books** stored in `data.js`.

### Fields per Book

| Field | Type | Description |
|---|---|---|
| `id` | Number | Unique identifier |
| `title` | String | Book title |
| `author` | String | Author name |
| `subject` | String | Subject area (e.g., Python, AI, Machine Learning) |
| `keywords` | Array | Relevant search terms |
| `difficulty` | String | `beginner` / `intermediate` / `advanced` |
| `pages` | Number | Page count |
| `rack` | String | Physical location (e.g., A1, B2, C3) |
| `availability` | String | `available` / `issued` |
| `description` | String | Short book summary |

### Subject Coverage

The dataset spans **20+ subjects** including: Python, Machine Learning, AI, Deep Learning, Data Science, Algorithms, Web Development, Databases, NLP, Cybersecurity, Cloud Computing, Mobile Development, and more.

---

## ⚙️ How It Works

The system follows a 5-step pipeline for every query:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. User     │ ──▸ │  2. Intent   │ ──▸ │  3. Score &  │ ──▸ │  4. Display  │ ──▸ │  5. Map      │
│  Enters      │     │  Extraction  │     │  Rank Books  │     │  Results     │     │  Highlights  │
│  Query       │     │              │     │              │     │  + Reasons   │     │  Rack        │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Step-by-Step Flow

1. **User enters a query** — either via the search bar, suggestion chips, or the AI assistant input.
2. **Intent extraction** — the system parses the query to identify subject, difficulty, and keywords using `extractQueryIntent()`.
3. **Scoring & ranking** — every book in the dataset is scored using `scoreBook()` based on term matches across multiple fields. Results are sorted by descending score.
4. **Results displayed** — matching books appear as cards with relevance scores. The AI assistant also shows human-readable reasons via `getReason()`.
5. **Map highlights rack** — when a book is clicked, its rack section is highlighted on the library map via `highlightRack()`.

---

## 📸 Screenshots

### Home Page
> *Main interface with search bar, suggestion chips, and popular books grid.*

![Home Page](screenshots/home.png)

### Search Results
> *Results for "python basics" showing relevance scores and color-coded tags.*

![Search Results](screenshots/search-results.png)

### AI Assistant Results
> *"Find Me a Book" assistant showing ranked recommendations with intelligent reasons.*

![Assistant Results](screenshots/assistant-results.png)

### Book Detail & Map View
> *Expanded book detail with similar recommendations and highlighted rack on the library map.*

![Detail View](screenshots/detail-map.png)

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Edge, Safari)
- No installation or server required

### Run Locally

```bash
# Option 1: Simply open the file
# Double-click index.html to open in your browser

# Option 2: Use a local server (recommended)
npx http-server . -p 8080
# Then visit http://localhost:8080
```

---

## 🔮 Future Improvements

| Improvement | Description |
|---|---|
| 🏫 **Real Library Integration** | Connect to actual library databases via APIs for live book data |
| 📷 **Barcode Scanner** | Scan book barcodes using device camera for instant lookup |
| 🧠 **Advanced ML Models** | Implement TF-IDF, Word2Vec, or transformer-based embeddings for true semantic search |
| 👤 **User Personalization** | Track reading history and preferences to provide personalized recommendations |
| 🔐 **Authentication** | Add student login for borrowing history and saved favorites |
| 📊 **Analytics Dashboard** | Track popular searches, most-accessed books, and usage patterns |
| 🌐 **Multi-language Support** | Extend search to support queries in regional languages |

---

## 📝 Conclusion

The **AI-Powered Library Book Finder** demonstrates how simple AI techniques can dramatically improve the library experience:

- ✅ **Improves book discovery** — Students find relevant books without knowing exact titles
- ✅ **Saves time** — Natural language search eliminates trial-and-error browsing
- ✅ **Enhances library usability** — Rack visualization and availability status reduce physical search effort
- ✅ **Provides intelligent guidance** — Difficulty tags and recommendations help students choose the right book for their level

Even with a simple rule-based approach, the system delivers an experience that feels intelligent and modern — proving that practical AI doesn't always require complex models.

---

## 👥 Team

| Name | Role |
|---|---|
| *Your Name* | Developer & Designer |

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for smarter libraries**

</div>
