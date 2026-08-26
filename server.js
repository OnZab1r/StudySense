require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// API KEY
// ==========================================

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set.");
}

// ==========================================
// GEMINI
// ==========================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// FRONTEND
// ==========================================

app.use(express.static(__dirname));

// ==========================================
// RETRY SETTINGS
// ==========================================

const MAX_RETRIES = 3;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error) {
    const message =
        error?.message ||
        JSON.stringify(error);

    return (
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("500") ||
        message.includes("502") ||
        message.includes("504")
    );
}

// ==========================================
// GEMINI REQUEST
// ==========================================

async function generateWithRetry(model, prompt) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(
                `Gemini request using ${model} - attempt ${attempt + 1}/${MAX_RETRIES + 1}`
            );

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            });

            console.log(`Gemini response received from ${model}.`);

            return response;

        } catch (error) {
            lastError = error;

            console.error(
                `Gemini attempt ${attempt + 1} failed:`,
                error?.message || error
            );

            if (!isRetryableError(error)) {
                throw error;
            }

            if (attempt === MAX_RETRIES) {
                break;
            }

            const delay =
                2000 * Math.pow(2, attempt) +
                Math.floor(Math.random() * 1000);

            console.log(
                `Temporary Gemini error. Retrying in ${delay}ms...`
            );

            await sleep(delay);
        }
    }

    throw lastError;
}

// ==========================================
// CLEAN JSON
// ==========================================

function cleanJSON(text) {
    if (!text) {
        throw new Error("Gemini returned an empty response.");
    }

    let cleaned = text.trim();

    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(
            /^```(?:json)?\s*/i,
            ""
        );

        cleaned = cleaned.replace(
            /\s*```$/,
            ""
        );
    }

    return cleaned.trim();
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "StudySense"
    });
});

// ==========================================
// GENERATE QUIZ
// ==========================================

app.get("/generate-quiz", async (req, res) => {

    const subject =
        String(req.query.subject || "Biology").trim();

    const topic =
        String(
            req.query.topic ||
            `General ${subject}`
        ).trim();

    const difficulty =
        String(
            req.query.difficulty || "Medium"
        ).trim();

    const count =
        Math.min(
            Math.max(
                parseInt(req.query.count, 10) || 5,
                1
            ),
            20
        );

    console.log("================================");
    console.log("Generating quiz...");
    console.log("Subject:", subject);
    console.log("Topic:", topic);
    console.log("Difficulty:", difficulty);
    console.log("Questions:", count);
    console.log("================================");

    try {

        // ======================================
        // API KEY
        // ======================================

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error:
                    "Gemini API key is not configured on the server."
            });
        }

        // ======================================
        // PROMPT
        // ======================================

        const prompt = `
You are StudySense, an expert educational quiz generator.

Generate exactly ${count} multiple-choice questions.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Rules:

1. Every question must directly relate to the requested subject and topic.
2. Match the requested difficulty.
3. Every question must have exactly 4 answers.
4. Only one answer can be correct.
5. "correct" must be the zero-based index of the correct answer.
6. "correct" must be 0, 1, 2, or 3.
7. Every question must have a useful "topic" field.
8. Avoid duplicate questions.
9. Cover different concepts when possible.
10. Make all questions factually accurate.
11. Make the questions appropriate for students.
12. Make incorrect answers plausible.
13. Return ONLY valid JSON.
14. Do not use Markdown.

Return exactly this structure:

[
    {
        "question": "Question here",
        "answers": [
            "Answer 1",
            "Answer 2",
            "Answer 3",
            "Answer 4"
        ],
        "correct": 0,
        "topic": "Specific concept"
    }
]
`;

        // ======================================
        // PRIMARY MODEL
        // ======================================

        let response;

        try {

   response = await generateWithRetry(
    "gemini-3.6-flash",
    prompt
);

        } catch (primaryError) {

   console.log(
    "Trying fallback model: gemini-3.6-flash"
);

response = await generateWithRetry(
    "gemini-3.6-flash",
    prompt
);

            response =
                await generateWithRetry(
                    "gemini-2.5-flash",
                    prompt
                );
        }

        // ======================================
        // GET TEXT
        // ======================================

        let text;

        if (typeof response.text === "string") {
            text = response.text;
        } else if (
            response.candidates &&
            response.candidates[0] &&
            response.candidates[0].content &&
            response.candidates[0].content.parts
        ) {

            text =
                response.candidates[0].content.parts
                    .map(part => part.text || "")
                    .join("");

        } else {
            throw new Error(
                "Gemini returned an unexpected response format."
            );
        }

        const cleanedText =
            cleanJSON(text);

        // ======================================
        // PARSE JSON
        // ======================================

        let questions;

        try {

            questions =
                JSON.parse(cleanedText);

        } catch (jsonError) {

            console.error(
                "Gemini returned invalid JSON:"
            );

            console.error(cleanedText);

            throw new Error(
                "Gemini returned invalid quiz data."
            );
        }

        // ======================================
        // VALIDATE ARRAY
        // ======================================

        if (!Array.isArray(questions)) {
            throw new Error(
                "Gemini response is not an array."
            );
        }

        if (questions.length !== count) {
            throw new Error(
                `Expected ${count} questions but received ${questions.length}.`
            );
        }

        // ======================================
        // VALIDATE QUESTIONS
        // ======================================

        for (const question of questions) {

            if (
                !question ||
                typeof question.question !== "string" ||
                !question.question.trim()
            ) {
                throw new Error(
                    "A question is missing valid question text."
                );
            }

            if (
                !Array.isArray(question.answers) ||
                question.answers.length !== 4
            ) {
                throw new Error(
                    "Every question must contain exactly 4 answers."
                );
            }

            if (
                question.answers.some(
                    answer =>
                        typeof answer !== "string" ||
                        !answer.trim()
                )
            ) {
                throw new Error(
                    "Every answer must contain valid text."
                );
            }

            if (
                typeof question.correct !== "number" ||
                !Number.isInteger(question.correct) ||
                question.correct < 0 ||
                question.correct > 3
            ) {
                throw new Error(
                    "Invalid correct answer index."
                );
            }

            if (
                typeof question.topic !== "string" ||
                !question.topic.trim()
            ) {
                question.topic = topic;
            }
        }

        // ======================================
        // SUCCESS
        // ======================================

        console.log(
            `Successfully generated ${questions.length} questions.`
        );

        return res.json(questions);

    } catch (error) {

        console.error("================================");
        console.error("QUIZ GENERATION ERROR");
        console.error(error);
        console.error("================================");

        return res.status(500).json({
            error:
                error?.message ||
                "Quiz generation failed. Please try again."
        });
    }
});

// ==========================================
// FRONTEND FALLBACK
// ==========================================

app.get("/{*splat}", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log("================================");
    console.log(
        `StudySense server running on port ${PORT}`
    );
    console.log("================================");
});