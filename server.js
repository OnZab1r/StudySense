require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

function ensureJSONFile(file, fallback) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    }
}

ensureJSONFile(USERS_FILE, []);
ensureJSONFile(SESSIONS_FILE, {});

function readJSON(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return fallback;
    }
}

function writeJSON(file, value) {
    const temp = `${file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(value, null, 2));
    fs.renameSync(temp, file);
}

function getUsers() {
    return readJSON(USERS_FILE, []);
}

function saveUsers(users) {
    writeJSON(USERS_FILE, users);
}

function getSessions() {
    return readJSON(SESSIONS_FILE, {});
}

function saveSessions(sessions) {
    writeJSON(SESSIONS_FILE, sessions);
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) return reject(error);
            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });
}

function verifyPassword(password, storedHash) {
    return new Promise((resolve, reject) => {
        const [salt, key] = String(storedHash).split(":");
        if (!salt || !key) return resolve(false);

        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) return reject(error);

            const stored = Buffer.from(key, "hex");
            const supplied = derivedKey;

            resolve(
                stored.length === supplied.length &&
                crypto.timingSafeEqual(stored, supplied)
            );
        });
    });
}

function createSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const sessions = getSessions();

    sessions[token] = {
        userId,
        createdAt: new Date().toISOString()
    };

    saveSessions(sessions);
    return token;
}

function getSessionUser(req) {
    const token = req.headers.cookie
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("studysense_session="))
        ?.split("=")
        .slice(1)
        .join("=");

    if (!token) return null;

    const sessions = getSessions();
    const session = sessions[token];
    if (!session) return null;

    const users = getUsers();
    return users.find((user) => user.id === session.userId) || null;
}

function requireAuth(req, res, next) {
    const user = getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: "Please log in first." });
    }
    req.user = user;
    next();
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    };
}

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set.");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

async function sendVerificationEmail(user, verificationToken) {
    const verificationUrl =
        `http://localhost:${PORT}/api/verify-email?token=${encodeURIComponent(verificationToken)}`;

    await mailTransporter.sendMail({
        from: `"StudySense" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Verify your StudySense account",
        text:
            `Hi ${user.name},\n\n` +
            `Welcome to StudySense!\n\n` +
            `Please verify your email address by opening this link:\n\n` +
            `${verificationUrl}\n\n` +
            `This verification link expires in 24 hours.\n\n` +
            `If you did not create this account, you can ignore this email.\n\n` +
            `— StudySense`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
                <h2>Welcome to StudySense!</h2>
                <p>Hi ${user.name},</p>
                <p>Thanks for creating your StudySense account.</p>
                <p>Please verify your email address to activate your account.</p>
                <p>
                    <a href="${verificationUrl}"
                       style="display:inline-block;padding:12px 20px;
                              background:#111827;color:white;
                              text-decoration:none;border-radius:8px;">
                        Verify my email
                    </a>
                </p>
                <p>This link expires in 24 hours.</p>
                <p>If you did not create this account, you can ignore this email.</p>
            </div>
        `
    });
}
/* =========================================================
   AUTHENTICATION
   ========================================================= */

app.post("/api/register", async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || "");

        if (name.length < 2 || name.length > 40) {
            return res.status(400).json({ error: "Name must be 2–40 characters." });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Enter a valid email address." });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        }

        const users = getUsers();
        if (users.some((user) => user.email === email)) {
            return res.status(409).json({ error: "An account with that email already exists." });
        }

        const passwordHash = await hashPassword(password);
        const user = {
            id: crypto.randomUUID(),
            name,
            email,
            passwordHash,
            createdAt: new Date().toISOString(),
            quizHistory: []
        };

        users.push(user);
        saveUsers(users);

        const token = createSession(user.id);
        res.setHeader("Set-Cookie", `studysense_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`);

        res.status(201).json({ user: publicUser(user) });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Could not create your account." });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || "");
        const users = getUsers();
        const user = users.find((item) => item.email === email);

        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({ error: "Incorrect email or password." });
        }

        const token = createSession(user.id);
        res.setHeader("Set-Cookie", `studysense_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`);
        res.json({ user: publicUser(user) });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Could not log you in." });
    }
});

app.post("/api/logout", (req, res) => {
    const cookie = req.headers.cookie
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("studysense_session="));

    if (cookie) {
        const token = cookie.split("=").slice(1).join("=");
        const sessions = getSessions();
        delete sessions[token];
        saveSessions(sessions);
    }

    res.setHeader("Set-Cookie", "studysense_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
    res.json({ success: true });
});

app.get("/api/me", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.json({ authenticated: false });
    res.json({ authenticated: true, user: publicUser(user) });
});

app.get("/api/stats", requireAuth, (req, res) => {
    const history = req.user.quizHistory || [];
    const totalQuizzes = history.length;
    const totalQuestions = history.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
    const averageScore = totalQuizzes
        ? Math.round(history.reduce((sum, quiz) => sum + quiz.percentage, 0) / totalQuizzes)
        : 0;
    const bestScore = totalQuizzes
        ? Math.max(...history.map((quiz) => quiz.percentage))
        : 0;

    res.json({
        totalQuizzes,
        totalQuestions,
        averageScore,
        bestScore,
        recent: history.slice(-5).reverse()
    });
});

app.post("/api/quiz-result", requireAuth, (req, res) => {
    const totalQuestions = Number(req.body?.totalQuestions);
    const score = Number(req.body?.score);
    const percentage = Number(req.body?.percentage);
    const subject = String(req.body?.subject || "General").trim().slice(0, 100);
    const topic = String(req.body?.topic || "General").trim().slice(0, 100);
    const difficulty = String(req.body?.difficulty || "Medium").trim().slice(0, 30);
    const weakTopic = String(req.body?.weakTopic || "Not available").trim().slice(0, 100);

    if (
        !Number.isInteger(totalQuestions) ||
        totalQuestions < 1 ||
        totalQuestions > 15 ||
        !Number.isInteger(score) ||
        score < 0 ||
        score > totalQuestions ||
        !Number.isFinite(percentage)
    ) {
        return res.status(400).json({ error: "Invalid quiz result." });
    }

    const users = getUsers();
    const user = users.find((item) => item.id === req.user.id);
    if (!user) return res.status(401).json({ error: "Account not found." });

    if (!Array.isArray(user.quizHistory)) user.quizHistory = [];

    const result = {
        id: crypto.randomUUID(),
        subject,
        topic,
        difficulty,
        score,
        totalQuestions,
        percentage: Math.round(Math.max(0, Math.min(100, percentage))),
        weakTopic,
        completedAt: new Date().toISOString()
    };

    user.quizHistory.push(result);
    if (user.quizHistory.length > 100) user.quizHistory = user.quizHistory.slice(-100);

    saveUsers(users);
    res.status(201).json({ success: true, result });
});

/* =========================================================
   HEALTH + QUIZ GENERATION
   ========================================================= */

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "StudySense" });
});

const MAX_RETRIES = 3;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
    const message = error?.message || JSON.stringify(error);
    return (
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("500") ||
        message.includes("502") ||
        message.includes("504") ||
        message.includes("TIMEOUT") ||
        message.includes("timed out")
    );
}

async function generateWithRetry(model, prompt) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Gemini request using ${model} - attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

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
            console.error(`Gemini attempt ${attempt + 1} failed:`, error?.message || error);

            if (!isRetryableError(error) || attempt === MAX_RETRIES) break;

            const delay = 2000 * Math.pow(2, attempt) + Math.floor(Math.random() * 1000);
            await sleep(delay);
        }
    }

    throw lastError;
}

function cleanJSON(text) {
    if (!text) throw new Error("Gemini returned an empty response.");
    let cleaned = text.trim();

    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
        cleaned = cleaned.replace(/\s*```$/, "");
    }

    return cleaned.trim();
}

app.get("/generate-quiz", requireAuth, async (req, res) => {
    const subject = String(req.query.subject || "Biology").trim();
    const topic = String(req.query.topic || `General ${subject}`).trim();
    const difficulty = String(req.query.difficulty || "Medium").trim();
    const count = Math.min(Math.max(parseInt(req.query.count, 10) || 5, 1), 15);

    console.log("Generating quiz for:", req.user.email, subject, topic, difficulty, count);

    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Gemini API key is not configured on the server." });
        }

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
        "answers": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
        "correct": 0,
        "topic": "Specific concept"
    }
]
`;

        let response;
        try {
            response = await generateWithRetry("gemini-3.6-flash", prompt);
        } catch (primaryError) {
            console.log("Primary Gemini model failed. Trying fallback model: gemini-2.5-flash");
            response = await generateWithRetry("gemini-2.5-flash", prompt);
        }

        let text;
        if (typeof response.text === "string") {
            text = response.text;
        } else if (response.candidates?.[0]?.content?.parts) {
            text = response.candidates[0].content.parts.map((part) => part.text || "").join("");
        } else {
            throw new Error("Gemini returned an unexpected response format.");
        }

        let questions;
        try {
            questions = JSON.parse(cleanJSON(text));
        } catch {
            throw new Error("Gemini returned invalid quiz data.");
        }

        if (!Array.isArray(questions) || questions.length !== count) {
            throw new Error(`Expected ${count} questions but received ${Array.isArray(questions) ? questions.length : 0}.`);
        }

        for (const question of questions) {
            if (!question || typeof question.question !== "string" || !question.question.trim()) {
                throw new Error("A question is missing valid question text.");
            }
            if (!Array.isArray(question.answers) || question.answers.length !== 4) {
                throw new Error("Every question must contain exactly 4 answers.");
            }
            if (question.answers.some((answer) => typeof answer !== "string" || !answer.trim())) {
                throw new Error("Every answer must contain valid text.");
            }
            if (
                typeof question.correct !== "number" ||
                !Number.isInteger(question.correct) ||
                question.correct < 0 ||
                question.correct > 3
            ) {
                throw new Error("Invalid correct answer index.");
            }
            if (typeof question.topic !== "string" || !question.topic.trim()) {
                question.topic = topic;
            }
        }

        return res.json(questions);
    } catch (error) {
        console.error("QUIZ GENERATION ERROR:", error);
        return res.status(500).json({
            error: error?.message || "Quiz generation failed. Please try again."
        });
    }
});

app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log("================================");
    console.log(`StudySense server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log("================================");
});
