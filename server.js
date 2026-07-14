require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const { WatsonXAI } = require("@ibm-cloud/watsonx-ai");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Library AI Backend Running with IBM watsonx.ai");
});

// ── Initialise watsonx client ──────────────────────────────────────────────
let watsonx = null;
const IBM_CONFIGURED =
    process.env.IBM_API_KEY &&
    process.env.IBM_API_KEY !== "your_ibm_api_key_here" &&
    process.env.IBM_PROJECT_ID &&
    process.env.IBM_PROJECT_ID !== "your_watsonx_project_id_here";

if (IBM_CONFIGURED) {
    try {
        watsonx = WatsonXAI.newInstance({
            version: "2024-05-31",
            serviceUrl: process.env.IBM_URL || "https://us-south.ml.cloud.ibm.com",
            authenticator: new (require("ibm-cloud-sdk-core").IamAuthenticator)({
                apikey: process.env.IBM_API_KEY
            })
        });
        console.log("✅ IBM watsonx.ai client initialised.");
    } catch (e) {
        console.warn("⚠️  watsonx init failed:", e.message);
    }
} else {
    console.warn("⚠️  IBM credentials not set — using local fallback mode.");
}

// ── Book dataset (mirrors data.js for local answering) ────────────────────
const BOOKS = [
  {id:1,title:"Python Crash Course",author:"Eric Matthes",subject:"Python",keywords:["python","beginner","programming","basics","easy"],difficulty:"beginner",rack:"A1",availability:"available",description:"A hands-on, project-based introduction to Python programming for absolute beginners."},
  {id:2,title:"Automate the Boring Stuff with Python",author:"Al Sweigart",subject:"Python",keywords:["python","automation","beginner","scripting","easy"],difficulty:"beginner",rack:"A1",availability:"available",description:"Practical programming for total beginners to automate everyday tasks."},
  {id:3,title:"Learning Python",author:"Mark Lutz",subject:"Python",keywords:["python","comprehensive","reference","intermediate"],difficulty:"intermediate",rack:"A2",availability:"issued",description:"A comprehensive and in-depth introduction to the Python language."},
  {id:4,title:"Fluent Python",author:"Luciano Ramalho",subject:"Python",keywords:["python","advanced","idiomatic","deep"],difficulty:"advanced",rack:"A2",availability:"available",description:"Master Python's most powerful features with clear and concise examples."},
  {id:5,title:"Hands-On Machine Learning",author:"Aurélien Géron",subject:"Machine Learning",keywords:["ml","machine learning","scikit","tensorflow","practical"],difficulty:"intermediate",rack:"B1",availability:"available",description:"Practical guide to ML using Scikit-Learn, Keras, and TensorFlow."},
  {id:6,title:"Introduction to Machine Learning with Python",author:"Andreas Müller",subject:"Machine Learning",keywords:["ml","machine learning","beginner","python","easy","intro"],difficulty:"beginner",rack:"B1",availability:"available",description:"A beginner-friendly introduction to machine learning concepts using Python."},
  {id:7,title:"Pattern Recognition and ML",author:"Christopher Bishop",subject:"Machine Learning",keywords:["ml","pattern recognition","advanced","math","statistics"],difficulty:"advanced",rack:"B2",availability:"issued",description:"A comprehensive treatment of pattern recognition and machine learning."},
  {id:8,title:"The Hundred-Page Machine Learning Book",author:"Andriy Burkov",subject:"Machine Learning",keywords:["ml","machine learning","beginner","short","concise","easy","quick"],difficulty:"beginner",rack:"B1",availability:"available",description:"A concise and accessible overview of machine learning in just 100 pages."},
  {id:9,title:"Artificial Intelligence: A Modern Approach",author:"Stuart Russell",subject:"AI",keywords:["ai","artificial intelligence","comprehensive","theory","classic"],difficulty:"advanced",rack:"C1",availability:"available",description:"The definitive textbook on artificial intelligence, covering all major topics."},
  {id:10,title:"AI for Everyone",author:"Andrew Ng",subject:"AI",keywords:["ai","beginner","non-technical","easy","intro","basics"],difficulty:"beginner",rack:"C1",availability:"available",description:"A non-technical introduction to AI for anyone wanting to understand the basics."},
  {id:11,title:"Deep Learning",author:"Ian Goodfellow",subject:"Deep Learning",keywords:["deep learning","neural networks","advanced","math","theory"],difficulty:"advanced",rack:"C2",availability:"issued",description:"The foundational textbook on deep learning theory and practice."},
  {id:12,title:"Deep Learning with Python",author:"François Chollet",subject:"Deep Learning",keywords:["deep learning","python","keras","practical","intermediate"],difficulty:"intermediate",rack:"C2",availability:"available",description:"A practical introduction to deep learning using Keras and Python."},
  {id:13,title:"Neural Networks from Scratch",author:"Harrison Kinsley",subject:"Deep Learning",keywords:["neural networks","beginner","python","scratch","easy"],difficulty:"beginner",rack:"C2",availability:"available",description:"Build neural networks from scratch to understand the fundamentals."},
  {id:14,title:"Data Science from Scratch",author:"Joel Grus",subject:"Data Science",keywords:["data science","python","beginner","statistics","easy"],difficulty:"beginner",rack:"D1",availability:"available",description:"Learn data science fundamentals by implementing algorithms from scratch."},
  {id:15,title:"Python for Data Analysis",author:"Wes McKinney",subject:"Data Science",keywords:["data analysis","pandas","python","intermediate","data"],difficulty:"intermediate",rack:"D1",availability:"available",description:"Essential guide to data wrangling with Python using pandas and NumPy."},
  {id:17,title:"Introduction to Algorithms",author:"Thomas Cormen",subject:"Algorithms",keywords:["algorithms","data structures","comprehensive","classic","theory"],difficulty:"advanced",rack:"E1",availability:"available",description:"The definitive guide to algorithms, widely used in university courses."},
  {id:18,title:"Grokking Algorithms",author:"Aditya Bhargava",subject:"Algorithms",keywords:["algorithms","beginner","visual","illustrated","easy","intro"],difficulty:"beginner",rack:"E1",availability:"available",description:"An illustrated guide to algorithms for beginners with visual explanations."},
  {id:20,title:"Clean Code",author:"Robert C. Martin",subject:"Software Engineering",keywords:["clean code","best practices","software","craftsmanship","readable"],difficulty:"intermediate",rack:"F1",availability:"available",description:"A handbook of agile software craftsmanship for writing clean, readable code."},
  {id:23,title:"Head First Java",author:"Kathy Sierra",subject:"Java",keywords:["java","beginner","visual","easy","object oriented","intro"],difficulty:"beginner",rack:"A3",availability:"available",description:"A brain-friendly guide to learning Java programming from scratch."},
  {id:25,title:"JavaScript: The Good Parts",author:"Douglas Crockford",subject:"Web Development",keywords:["javascript","web","beginner","fundamentals","frontend"],difficulty:"beginner",rack:"A4",availability:"available",description:"Discover the best features of JavaScript for elegant programming."},
  {id:29,title:"Natural Language Processing with Python",author:"Steven Bird",subject:"NLP",keywords:["nlp","python","text","language","beginner","natural language"],difficulty:"beginner",rack:"C3",availability:"available",description:"Analyze text with the Natural Language Toolkit in Python."},
  {id:35,title:"Computer Networking: A Top-Down Approach",author:"James Kurose",subject:"Networking",keywords:["networking","internet","protocols","intermediate","systems"],difficulty:"intermediate",rack:"E2",availability:"available",description:"Understanding computer networks from applications down to physical layer."},
  {id:36,title:"Operating System Concepts",author:"Abraham Silberschatz",subject:"Operating Systems",keywords:["os","operating systems","intermediate","systems","classic"],difficulty:"intermediate",rack:"E2",availability:"available",description:"The classic textbook on operating system concepts and design."},
  {id:37,title:"Database System Concepts",author:"Abraham Silberschatz",subject:"Databases",keywords:["database","sql","intermediate","relational","systems"],difficulty:"intermediate",rack:"E3",availability:"available",description:"Comprehensive introduction to database system concepts."},
  {id:45,title:"Cracking the Coding Interview",author:"Gayle McDowell",subject:"Algorithms",keywords:["interview","algorithms","data structures","beginner","practice","career"],difficulty:"beginner",rack:"E1",availability:"issued",description:"189 programming questions and solutions for coding interviews."},
  {id:54,title:"Discrete Mathematics and Its Applications",author:"Kenneth Rosen",subject:"Mathematics",keywords:["math","discrete","logic","proof","beginner","foundations"],difficulty:"beginner",rack:"F3",availability:"available",description:"A thorough introduction to discrete mathematics for CS students."},
  {id:57,title:"Practical Deep Learning for Coders",author:"Jeremy Howard",subject:"Deep Learning",keywords:["deep learning","fastai","practical","beginner","easy","coding"],difficulty:"beginner",rack:"C2",availability:"available",description:"Learn deep learning practically with fast.ai and PyTorch."},
  {id:60,title:"Data Structures Using C",author:"Reema Thareja",subject:"Data Structures",keywords:["c","data structures","beginner","arrays","linked list","easy"],difficulty:"beginner",rack:"E1",availability:"available",description:"Learn fundamental data structures using the C programming language."},
  {id:63,title:"Cyber Security Essentials",author:"Charles Brooks",subject:"Cybersecurity",keywords:["security","cyber","beginner","network","easy","intro"],difficulty:"beginner",rack:"E4",availability:"available",description:"An accessible introduction to cybersecurity concepts."},
  {id:65,title:"Cloud Computing Concepts",author:"Thomas Erl",subject:"Cloud Computing",keywords:["cloud","aws","azure","beginner","infrastructure","easy"],difficulty:"beginner",rack:"E4",availability:"available",description:"Foundational concepts of cloud computing and services."},
  {id:70,title:"Blockchain Basics",author:"Daniel Drescher",subject:"Blockchain",keywords:["blockchain","crypto","beginner","distributed","easy","intro"],difficulty:"beginner",rack:"E5",availability:"available",description:"A non-technical introduction to blockchain technology."},
  {id:71,title:"Machine Learning Yearning",author:"Andrew Ng",subject:"Machine Learning",keywords:["ml","machine learning","practical","beginner","strategy","easy"],difficulty:"beginner",rack:"B1",availability:"available",description:"A practical guide to structuring machine learning projects."},
  {id:73,title:"C Programming Language",author:"Brian Kernighan",subject:"Programming",keywords:["c","programming","classic","beginner","systems","easy"],difficulty:"beginner",rack:"A6",availability:"available",description:"The classic introduction to the C programming language."},
  {id:80,title:"Internet of Things",author:"Arshdeep Bahga",subject:"IoT",keywords:["iot","sensors","beginner","embedded","connected","easy"],difficulty:"beginner",rack:"E5",availability:"available",description:"A hands-on approach to learning Internet of Things concepts."},
  {id:88,title:"UX Design Fundamentals",author:"Joe Natoli",subject:"Design",keywords:["ux","design","user experience","beginner","ui","easy"],difficulty:"beginner",rack:"A7",availability:"available",description:"Core principles of user experience design."},
  {id:95,title:"Generative AI with LangChain",author:"Ben Auffarth",subject:"AI",keywords:["ai","langchain","llm","generative","intermediate","modern"],difficulty:"intermediate",rack:"C1",availability:"available",description:"Build generative AI applications with LangChain and LLMs."},
  {id:96,title:"Prompt Engineering for Developers",author:"OpenAI Team",subject:"AI",keywords:["prompt","ai","llm","beginner","chatgpt","easy","modern"],difficulty:"beginner",rack:"C1",availability:"available",description:"Master the art of prompt engineering for AI models."},
  {id:98,title:"Algorithms Unlocked",author:"Thomas Cormen",subject:"Algorithms",keywords:["algorithms","beginner","accessible","easy","intro","simple"],difficulty:"beginner",rack:"E1",availability:"available",description:"A gentle introduction to how algorithms work."},
];

// ── Local fallback: score and answer from the dataset ─────────────────────
function localAnswer(message) {
    const q = message.toLowerCase().trim();

    // ── Social / conversational ───────────────────────────────────────────
    if (/^(thanks|thank you|thank you so much|thanks a lot|thx|ty|cheers|great|awesome|perfect|nice|cool|ok|okay|sure|got it|sounds good|no problem)[!?.]*$/.test(q)) {
        return "You're welcome! 😊 Is there anything else I can help you find?";
    }

    if (/^(bye|goodbye|see you|see ya|later|cya|good night)[!?.]*$/.test(q)) {
        return "Goodbye! Happy reading! 📚 Come back anytime you need a book recommendation.";
    }

    if (/^(yes|yeah|yep|yup|sure|ok|okay|please|go ahead)[!?.]*$/.test(q)) {
        return "Sure! Could you tell me a bit more? For example, which subject or topic are you interested in?";
    }

    if (/^(no|nope|nah|not really)[!?.]*$/.test(q)) {
        return "No worries! Let me know if you need anything else. 😊";
    }

    // ── Greetings ────────────────────────────────────────────────────────
    if (/^(hi|hello|hey|howdy|sup|what'?s up|good morning|good afternoon|good evening)[!?.]*$/.test(q)) {
        return "Hello! 👋 I'm your **BookMind Library AI Agent**.\n\n" +
               "I can help you with:\n" +
               "- 📚 Finding books by subject, author, or topic\n" +
               "- 🎯 Recommendations by difficulty (beginner / intermediate / advanced)\n" +
               "- 🗺️ Shelf & rack locations\n" +
               "- ✅ Checking which books are currently available\n" +
               "- 🎓 Reading lists for B.Tech exam prep\n\n" +
               "What are you looking for today?";
    }

    // ── Help / what can you do ────────────────────────────────────────────
    // Exclude exam-prep queries that contain "help me prepare"
    if (/\b(help|what can you do|how do you work|capabilities|commands)\b/.test(q) &&
        !/\b(exam|semester|btech|b\.tech|prepare|preparation|study)\b/.test(q)) {
        return "Here's what I can help you with:\n\n" +
               "1. **Find books** — ask by subject, e.g. *\"Python books\"* or *\"books on AI\"*\n" +
               "2. **Filter by level** — e.g. *\"beginner machine learning\"* or *\"advanced algorithms\"*\n" +
               "3. **Check availability** — *\"what books are available right now?\"*\n" +
               "4. **Exam prep** — *\"help me prepare for B.Tech exams\"*\n" +
               "5. **Popular picks** — *\"what are the most popular books?\"*\n" +
               "6. **Author search** — *\"books by Andrew Ng\"*\n\n" +
               "Just ask naturally — I'll do my best to find the right book for you!";
    }

    // ── Trending / popular books ──────────────────────────────────────────
    if (/\b(popular|trending|most read|top books|recommended|best books|favourite|favorite)\b/.test(q)) {
        const popular = [
            BOOKS.find(b => b.id === 5),   // Hands-On ML
            BOOKS.find(b => b.id === 18),  // Grokking Algorithms
            BOOKS.find(b => b.id === 1),   // Python Crash Course
            BOOKS.find(b => b.id === 9),   // AI: A Modern Approach
            BOOKS.find(b => b.id === 20),  // Clean Code
        ].filter(Boolean);
        return formatBookList("Here are the **most popular books** in our library right now:", popular);
    }

    // ── B.Tech / exam prep ────────────────────────────────────────────────
    if (/\b(exam|semester|btech|b\.tech|university|syllabus|prepare|preparation|study)\b/.test(q)) {
        const examBooks = [
            BOOKS.find(b => b.id === 17),  // Intro to Algorithms
            BOOKS.find(b => b.id === 36),  // OS Concepts
            BOOKS.find(b => b.id === 37),  // Database System Concepts
            BOOKS.find(b => b.id === 35),  // Computer Networking
            BOOKS.find(b => b.id === 54),  // Discrete Mathematics
        ].filter(Boolean);
        return "Here's a recommended **B.Tech exam reading list** covering core subjects:\n\n" +
               formatBookList("", examBooks).replace(/^.*\n\n/, "") +
               "\n\n💡 Tip: Use the **Search** bar on the main page to find books for a specific subject.";
    }

    // ── Pure availability check ────────────────────────────────────────────
    if (/\b(available|on shelf|currently available)\b/.test(q) && q.split(/\s+/).length <= 6) {
        const avail = BOOKS.filter(b => b.availability === "available").slice(0, 5);
        return formatBookList("Here are some books **currently available** on the shelves:", avail);
    }

    // ── Detect difficulty intent ──────────────────────────────────────────
    let difficultyFilter = null;
    if (/beginner|easy|start|intro|basic|new to/.test(q))  difficultyFilter = "beginner";
    if (/intermediate|medium/.test(q))                      difficultyFilter = "intermediate";
    if (/advanced|expert|deep|hard/.test(q))                difficultyFilter = "advanced";

    // ── Detect availability preference (only relevant when combined with a subject) ──
    const wantsAvailable = /available|on shelf|can borrow|not issued/.test(q);

    // ── Score every book ──────────────────────────────────────────────────
    const scored = BOOKS.map(b => {
        let score = 0;
        const fields = [b.title, b.author, b.subject, b.description, ...b.keywords]
            .map(s => s.toLowerCase());

        q.split(/\s+/).forEach(word => {
            if (word.length < 3) return;
            fields.forEach(f => {
                if (f === word)            score += 10;
                else if (f.includes(word)) score += 5;
            });
        });

        if (difficultyFilter && b.difficulty === difficultyFilter) score += 15;
        if (wantsAvailable && b.availability === "available")       score += 3;

        return { ...b, score };
    }).filter(b => b.score > 0).sort((a, b) => b.score - a.score);

    // Availability fallback when no subject matched
    if (/available|currently available|on shelf/.test(q) && scored.length === 0) {
        const avail = BOOKS.filter(b => b.availability === "available").slice(0, 5);
        return formatBookList("Here are some books currently available on the shelves:", avail);
    }

    if (scored.length === 0) {
        return "I'm not sure I understood that — could you rephrase?\n\n" +
               "Try something like:\n" +
               "- *\"Show me Python books\"*\n" +
               "- *\"Beginner machine learning\"*\n" +
               "- *\"Books on networking\"*\n" +
               "- *\"What books are available?\"*\n\n" +
               "Or type **help** to see everything I can do.";
    }

    const top = scored.slice(0, 4);
    const intro = difficultyFilter
        ? `Here are the best **${difficultyFilter}** books matching your query:`
        : "Here are the best matching books from our library:";

    return formatBookList(intro, top);
}

function formatBookList(intro, books) {
    const lines = books.map((b, i) =>
        `${i + 1}. **${b.title}** by ${b.author}\n` +
        `   📚 ${b.subject} · ${b.difficulty} · Rack ${b.rack} · ${b.availability === "available" ? "✅ Available" : "❌ Currently Issued"}\n` +
        `   ${b.description}`
    );
    return `${intro}\n\n${lines.join("\n\n")}\n\nWould you like more details on any of these, or shall I refine the list?`;
}

// ── /chat endpoint ─────────────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
    const { message, history = [] } = req.body;

    // ── Try IBM watsonx first ──────────────────────────────────────────────
    if (watsonx) {
        try {
            const historyMessages = history.slice(-10).map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
            }));

            const response = await watsonx.textChat({
                modelId: "ibm/granite-3-8b-instruct",
                projectId: process.env.IBM_PROJECT_ID,
                messages: [
                    {
                        role: "system",
                        content: `You are the Library AI Agent for BookMind, an AI-powered college library assistant.
Your job is to help students and staff with:
- Finding books by title, author, subject, or topic
- Recommending books based on skill level, course, or interest
- Providing shelf/rack locations (e.g., Rack A2, B3)
- Checking availability and suggesting holds
- Helping prepare for B.Tech / university exams with relevant reading lists
- Answering general knowledge questions about books and authors

Guidelines:
- Be warm, friendly, and concise.
- When recommending books, include: title, author, why it's useful, and shelf location if known.
- Format lists clearly using numbering or bullet points.
- If asked about availability, note it may vary and offer to place a hold.
- Always offer to refine recommendations further.
- Keep responses under 400 words unless a detailed list is explicitly requested.`
                    },
                    ...historyMessages,
                    { role: "user", content: message }
                ],
                maxTokens: 500
            });

            return res.json({ reply: response.result.choices[0].message.content });

        } catch (err) {
            console.error("IBM watsonx error:", err.message);
            // Fall through to local fallback below
        }
    }

    // ── Local fallback ─────────────────────────────────────────────────────
    const reply = localAnswer(message);
    res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    if (!IBM_CONFIGURED) {
        console.log("   ℹ️  Running in LOCAL FALLBACK mode (no IBM credentials).");
        console.log("   ℹ️  Add IBM_API_KEY and IBM_PROJECT_ID to backend/.env for full AI.");
    }
});
