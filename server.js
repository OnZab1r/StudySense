require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { GoogleGenAI } = require("@google/genai");

const app = express();

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// Serve index.html, style.css, script.js, etc.
app.use(express.static(path.join(__dirname)));


// ==========================================
// GEMINI
// ==========================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// GENERATE QUIZ
// ==========================================

app.get("/generate-quiz", async function (req, res) {

    const subject =
        req.query.subject ||
        "Biology";

    const topic =
        req.query.topic ||
        "General " + subject;

    const difficulty =
        req.query.difficulty ||
        "Medium";

    const count =
        req.query.count ||
        "5";


    console.log("==============================");
    console.log("Generating quiz...");
    console.log("Subject:", subject);
    console.log("Topic:", topic);
    console.log("Difficulty:", difficulty);
    console.log("Questions:", count);
    console.log("==============================");


    try {

        const response =
            await ai.models.generateContent({

                model: "gemini-3.5-flash-lite",

                contents: `

You are an expert educational quiz generator.

Generate exactly ${count} multiple-choice questions.

SUBJECT:
${subject}

TOPIC:
${topic}

DIFFICULTY:
${difficulty}

IMPORTANT RULES:

1. Every question must be related to the subject and topic provided.

2. The questions must match the requested difficulty.

3. Each question must have exactly 4 possible answers.

4. Only ONE answer should be correct.

5. "correct" must be the index of the correct answer.

6. The index starts at 0.

7. Use this structure:

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
        "topic": "Specific topic"
    }
]

8. Return ONLY valid JSON.

9. Do NOT use markdown.

10. Do NOT write anything before or after the JSON.

11. Make sure every answer is factually correct.

12. Do not create duplicate questions.

13. Cover different concepts within the requested topic.

`
            });


        const text = response.text;

        console.log("Gemini response received.");

        const questions = JSON.parse(text);

        res.json(questions);


    } catch (error) {

        console.error("Quiz generation error:");
        console.error(error);

        res.status(500).json({
            error: "Failed to generate quiz."
        });

    }

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, function () {

    console.log("================================");
    console.log(`StudySense running on port ${PORT}`);
    console.log("================================");

});