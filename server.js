require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { WatsonXAI } = require("@ibm-cloud/watsonx-ai");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Library AI Backend Running with IBM watsonx.ai");
});

// Initialise watsonx client with IAM API key authentication
const watsonx = WatsonXAI.newInstance({
    version: "2024-05-31",
    serviceUrl: process.env.IBM_URL,
    authenticator: new (require("ibm-cloud-sdk-core").IamAuthenticator)({
        apikey: process.env.IBM_API_KEY
    })
});

app.post("/chat", async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // Build conversation with prior history (max 10 turns)
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
                {
                    role: "user",
                    content: message
                }
            ],
            maxTokens: 500
        });

        res.json({
            reply: response.result.choices[0].message.content
        });

    } catch (err) {
        console.error("IBM watsonx error:", err.message);
        // Return a graceful reply instead of crashing the chat
        res.json({
            reply: "I'm having trouble connecting to the AI service right now. " +
                   "Please check that your IBM API key and Project ID are correct in backend/.env, " +
                   "and that the project exists in your IBM Cloud account. Error: " + err.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
