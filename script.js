/* =========================================================
   STUDYSENSE — FINAL SYNCHRONIZED FRONTEND SCRIPT
   ========================================================= */

"use strict";

/* =========================================================
   QUIZ STATE
   ========================================================= */

let questions = [];
let currentQuestion = 0;
let score = 0;
let answerSelected = false;
let topicPerformance = {};
let quizGenerating = false;

/* =========================================================
   HTML ELEMENTS
   ========================================================= */

const welcomeScreen = document.getElementById("welcomeScreen");
const quizScreen = document.getElementById("quizScreen");
const resultsScreen = document.getElementById("resultsScreen");
const authScreen = document.getElementById("authScreen");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const userArea = document.getElementById("userArea");
const userGreeting = document.getElementById("userGreeting");
const logoutButton = document.getElementById("logoutButton");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const subjectSelect = document.getElementById("subjectSelect");
const topicInput = document.getElementById("topicInput");
const difficultySelect = document.getElementById("difficultySelect");
const questionCountSelect = document.getElementById("questionCount");
const questionCountLabel = document.getElementById("questionCountLabel");
const countOptions = document.querySelectorAll(".count-option");

const questionText = document.getElementById("questionText");
const questionTopic = document.getElementById("questionTopic");
const answersContainer = document.getElementById("answers");
const nextButton = document.getElementById("nextButton");

const questionCounter = document.getElementById("questionCounter");
const quizScore = document.getElementById("quizScore");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const feedback = document.getElementById("feedback");

const finalScore = document.getElementById("finalScore");
const percentage = document.getElementById("percentage");
const correctCount = document.getElementById("correctCount");
const wrongCount = document.getElementById("wrongCount");
const accuracyCount = document.getElementById("accuracyCount");
const topicResults = document.getElementById("topicResults");
const weakTopic = document.getElementById("weakTopic");
const recommendation = document.getElementById("recommendation");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

/* =========================================================
   AUTHENTICATION
   ========================================================= */

let currentUser = null;

function setAuthMessage(message, type = "error") {
    authMessage.textContent = message || "";
    authMessage.className = "auth-message" + (message ? ` ${type}` : "");
}

function setAuthenticatedUI(user) {
    currentUser = user;
    const authenticated = Boolean(user);

    document.body.classList.toggle("authenticated", authenticated);
    userArea.hidden = !authenticated;

    if (authenticated) {
        userGreeting.textContent = `Hi, ${user.name}`;
    } else {
        userGreeting.textContent = "";
    }
}

function switchAuthMode(mode) {
    const loginMode = mode === "login";

    loginTab.classList.toggle("active", loginMode);
    registerTab.classList.toggle("active", !loginMode);
    loginForm.hidden = !loginMode;
    registerForm.hidden = loginMode;

    authTitle.textContent = loginMode
        ? "Sign in to StudySense"
        : "Create your StudySense account";

    authSubtitle.textContent = loginMode
        ? "Your quizzes, scores, and progress will be saved to your account."
        : "Create an account and keep your learning progress saved.";

    setAuthMessage("");
}

async function authRequest(endpoint, payload) {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
    }

    return data;
}

async function handleLogin(event) {
    event.preventDefault();
    const button = loginForm.querySelector("button[type=submit]");
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    button.disabled = true;
    button.querySelector("span").textContent = "Signing in...";
    setAuthMessage("");

    try {
        const data = await authRequest("/api/login", { email, password });
        setAuthenticatedUI(data.user);
        loginForm.reset();
        setAuthMessage("Welcome back!", "success");
        showScreen(welcomeScreen);
    } catch (error) {
        setAuthMessage(error.message);
    } finally {
        button.disabled = false;
        button.querySelector("span").textContent = "Log in";
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const button = registerForm.querySelector("button[type=submit]");
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    button.disabled = true;
    button.querySelector("span").textContent = "Creating...";
    setAuthMessage("");

    try {
        const data = await authRequest("/api/register", { name, email, password });
        setAuthenticatedUI(data.user);
        registerForm.reset();
        showScreen(welcomeScreen);
    } catch (error) {
        setAuthMessage(error.message);
    } finally {
        button.disabled = false;
        button.querySelector("span").textContent = "Create account";
    }
}

async function logout() {
    try {
        await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    } catch (error) {
        console.error("Logout failed:", error);
    }

    setAuthenticatedUI(null);
    showScreen(authScreen);
    switchAuthMode("login");
}

async function initializeAuth() {
    try {
        const response = await fetch("/api/me", {
            credentials: "same-origin",
            headers: { Accept: "application/json" }
        });

        const data = await response.json();

        if (data.authenticated && data.user) {
            setAuthenticatedUI(data.user);
            showScreen(welcomeScreen);
        } else {
            setAuthenticatedUI(null);
            showScreen(authScreen);
        }
    } catch (error) {
        console.error("Authentication check failed:", error);
        setAuthenticatedUI(null);
        showScreen(authScreen);
        setAuthMessage("Could not connect to the StudySense server.");
    }
}

loginTab.addEventListener("click", () => switchAuthMode("login"));
registerTab.addEventListener("click", () => switchAuthMode("register"));
loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
logoutButton.addEventListener("click", logout);

/* =========================================================
   THEME
   ========================================================= */

const themeToggle = document.getElementById("themeToggle");

function updateThemeColor(color) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
}

function applyTheme(theme) {
    const isLight = theme === "light";

    document.body.classList.toggle("light-mode", isLight);

    themeToggle.textContent = isLight ? "🌙" : "☀️";
    themeToggle.setAttribute(
        "aria-label",
        isLight ? "Switch to dark mode" : "Switch to light mode"
    );
    themeToggle.setAttribute(
        "title",
        isLight ? "Switch to dark mode" : "Switch to light mode"
    );

    updateThemeColor(isLight ? "#eef2f8" : "#06070b");
    localStorage.setItem("studysense-theme", theme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem("studysense-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
        applyTheme(savedTheme);
        return;
    }

    const prefersLight =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;

    applyTheme(prefersLight ? "light" : "dark");
}

themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-mode");
    applyTheme(isLight ? "dark" : "light");
});

/* =========================================================
   MUSIC
   ========================================================= */

const studyAudio = document.getElementById("studyAudio");
const musicToggle = document.getElementById("musicToggle");
const previousTrack = document.getElementById("previousTrack");
const nextTrack = document.getElementById("nextTrack");
const trackSelect = document.getElementById("trackSelect");
const resultsTrackSelect = document.getElementById("resultsTrackSelect");
const volumeControl = document.getElementById("volumeControl");
const volumeValue = document.getElementById("volumeValue");
const currentTrackName = document.getElementById("currentTrackName");

const musicFloatingButton = document.getElementById("musicFloatingButton");
const musicPlayingIndicator = document.getElementById("musicPlayingIndicator");
const musicDrawer = document.getElementById("musicDrawer");
const musicOverlay = document.getElementById("musicOverlay");
const musicClose = document.getElementById("musicClose");

const tracks = [
    { name: "Lofi Midnight Club", url: "/music/alex-morgan-lofi-midnight-club-568164.mp3" },
    { name: "Around the World", url: "/music/aroundtheworld.mp3" },
    { name: "Diet Mountain Dew", url: "/music/dietmountaindew.mp3" },
    { name: "Feet Don't Fail Me Now", url: "/music/feetdontfailmenow.mp3" },
    { name: "I Like the Way You Kiss Me", url: "/music/ilikethewayyoukissme.mp3" },
    { name: "Misery", url: "/music/misery.mp3" },
    { name: "Nuts", url: "/music/nuts.mp3" },
    { name: "Obsessed", url: "/music/obsessed.mp3" },
    { name: "Five Hundred Miles", url: "/music/Peter_Paul_Mary_-_Five_Hundred_Miles.mp3" },
    { name: "Salvatore", url: "/music/salvatore.mp3" },
    { name: "Suzume no Tojimaru", url: "/music/suzume-no-tojimaru.mp3" }
];

let currentTrack = 0;

function openMusicDrawer() {
    musicDrawer.classList.add("open");
    musicOverlay.classList.add("open");
    musicDrawer.setAttribute("aria-hidden", "false");
    musicOverlay.setAttribute("aria-hidden", "false");
}

function closeMusicDrawer() {
    musicDrawer.classList.remove("open");
    musicOverlay.classList.remove("open");
    musicDrawer.setAttribute("aria-hidden", "true");
    musicOverlay.setAttribute("aria-hidden", "true");
}

musicFloatingButton.addEventListener("click", openMusicDrawer);
musicClose.addEventListener("click", closeMusicDrawer);
musicOverlay.addEventListener("click", closeMusicDrawer);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMusicDrawer();
});

function updateMusicUI() {
    const isPlaying = !studyAudio.paused && !studyAudio.ended;

    musicToggle.textContent = isPlaying ? "❚❚" : "▶";
    musicFloatingButton.classList.toggle("playing", isPlaying);

    if (currentTrackName) currentTrackName.textContent = tracks[currentTrack].name;
    if (trackSelect) trackSelect.value = String(currentTrack);
    if (resultsTrackSelect) resultsTrackSelect.value = String(currentTrack);
    if (musicPlayingIndicator) musicPlayingIndicator.style.opacity = isPlaying ? "1" : "";
}

function updateVolumeUI() {
    const value = Number(volumeControl.value);
    const percent = Math.round(value * 100);

    volumeValue.textContent = percent + "%";
    studyAudio.volume = value;

    localStorage.setItem("studysense-volume", String(value));
}

function loadTrack(index, autoplay = false) {
    currentTrack = (index + tracks.length) % tracks.length;

    const track = tracks[currentTrack];

    studyAudio.src = track.url;
    studyAudio.load();

    currentTrackName.textContent = track.name;
    trackSelect.value = String(currentTrack);

    if (resultsTrackSelect) {
        resultsTrackSelect.value = String(currentTrack);
    }

    localStorage.setItem("studysense-track", String(currentTrack));
    updateMusicUI();

    if (autoplay) playMusic();
}

function playMusic() {
    studyAudio.play()
        .then(updateMusicUI)
        .catch((error) => {
            console.error("Music playback failed:", error);
            updateMusicUI();
        });
}

function toggleMusic() {
    if (!studyAudio.src) loadTrack(currentTrack, false);

    if (studyAudio.paused) {
        playMusic();
    } else {
        studyAudio.pause();
        updateMusicUI();
    }
}

function changeTrack(direction) {
    const shouldAutoplay = !studyAudio.paused;
    loadTrack(currentTrack + direction, shouldAutoplay);
}

musicToggle.addEventListener("click", toggleMusic);
previousTrack.addEventListener("click", () => changeTrack(-1));
nextTrack.addEventListener("click", () => changeTrack(1));

trackSelect.addEventListener("change", () => {
    loadTrack(Number(trackSelect.value), !studyAudio.paused);
});

if (resultsTrackSelect) {
    resultsTrackSelect.addEventListener("change", () => {
        loadTrack(Number(resultsTrackSelect.value), !studyAudio.paused);
    });
}

volumeControl.addEventListener("input", updateVolumeUI);

studyAudio.addEventListener("play", updateMusicUI);
studyAudio.addEventListener("pause", updateMusicUI);

studyAudio.addEventListener("ended", () => {
    loadTrack(currentTrack + 1, true);
});

studyAudio.addEventListener("error", () => {
    console.error("Unable to load music:", studyAudio.src);
    updateMusicUI();
});

function initializeMusic() {
    const savedVolume = localStorage.getItem("studysense-volume");

    if (savedVolume !== null) {
        const volume = Number(savedVolume);
        if (Number.isFinite(volume) && volume >= 0 && volume <= 1) {
            volumeControl.value = String(volume);
        }
    }

    const savedTrack = localStorage.getItem("studysense-track");

    if (savedTrack !== null) {
        const track = Number(savedTrack);
        if (Number.isInteger(track) && track >= 0 && track < tracks.length) {
            currentTrack = track;
        }
    }

    updateVolumeUI();
    loadTrack(currentTrack, false);
}

/* =========================================================
   QUESTION COUNT
   ========================================================= */

function updateQuestionCount(count) {
    questionCountSelect.value = String(count);

    questionCountLabel.textContent =
        count === 5 ? "5 questions" :
        count === 10 ? "10 questions" :
        "15 questions";

    countOptions.forEach((button) => {
        button.classList.toggle(
            "active",
            Number(button.dataset.count) === Number(count)
        );
    });
}

countOptions.forEach((button) => {
    button.addEventListener("click", () => {
        updateQuestionCount(Number(button.dataset.count));
    });
});

/* =========================================================
   ERROR UI
   ========================================================= */

function showError(message) {
    errorText.textContent = message || "Please try again.";
    errorMessage.classList.add("active");
}

function hideError() {
    errorMessage.classList.remove("active");
}

/* =========================================================
   SCREEN MANAGEMENT
   This is the important fix: hidden screens are removed
   from layout, so they cannot appear below the homepage.
   ========================================================= */

function showScreen(screen) {
    [authScreen, welcomeScreen, quizScreen, resultsScreen].forEach((item) => {
        item.hidden = item !== screen;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   GET QUIZ FROM SERVER
   ========================================================= */

async function getAIQuiz() {
    const subject = subjectSelect.value;
    const topic = topicInput.value.trim() || "General " + subject;
    const difficulty = difficultySelect.value;
    const count = questionCountSelect.value;

    const params = new URLSearchParams({
        subject,
        topic,
        difficulty,
        count
    });

    const url = "/generate-quiz?" + params.toString();

    console.log("Requesting quiz:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" }
        });

        const contentType = response.headers.get("content-type") || "";
        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error("Server returned non-JSON:", text);
            throw new Error(
                "The server returned an invalid response. Make sure StudySense is running through http://localhost:3000"
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error || "Server error: HTTP " + response.status
            );
        }

        if (data.error) throw new Error(data.error);

        if (!Array.isArray(data)) {
            throw new Error("The server did not return a valid quiz.");
        }

        if (data.length === 0) {
            throw new Error("The server returned an empty quiz.");
        }

        validateQuiz(data);
        questions = data;

        return true;
    } catch (error) {
        console.error("Quiz generation failed:", error);
        showError(
            error.message || "StudySense couldn't generate the quiz."
        );
        return false;
    }
}

/* =========================================================
   VALIDATE QUIZ
   ========================================================= */

function validateQuiz(data) {
    data.forEach((question, index) => {
        if (
            !question ||
            typeof question.question !== "string" ||
            !question.question.trim() ||
            !Array.isArray(question.answers) ||
            question.answers.length !== 4 ||
            typeof question.correct !== "number"
        ) {
            throw new Error(
                "Question " + (index + 1) + " has an invalid format."
            );
        }

        if (
            question.correct < 0 ||
            question.correct > 3 ||
            !Number.isInteger(question.correct)
        ) {
            throw new Error(
                "Question " + (index + 1) + " has an invalid correct answer."
            );
        }

        if (
            question.answers.some(
                (answer) =>
                    typeof answer !== "string" || !answer.trim()
            )
        ) {
            throw new Error(
                "Question " + (index + 1) + " contains an invalid answer."
            );
        }

        if (
            typeof question.topic !== "string" ||
            !question.topic.trim()
        ) {
            question.topic = "General";
        }
    });
}

/* =========================================================
   SHOW QUESTION
   ========================================================= */

function showQuestion() {
    answerSelected = false;
    nextButton.disabled = true;

    feedback.textContent = "";
    feedback.className = "feedback";

    const question = questions[currentQuestion];
    const currentNumber = currentQuestion + 1;
    const totalQuestions = questions.length;

    questionCounter.textContent =
        "Question " + currentNumber + " of " + totalQuestions;

    quizScore.textContent = score;

    const progress = (currentNumber / totalQuestions) * 100;

    progressBar.style.width = progress + "%";
    progressPercent.textContent = Math.round(progress) + "%";

    questionText.textContent = question.question;
    questionTopic.textContent = question.topic || "General";

    answersContainer.innerHTML = "";

    question.answers.forEach((answer, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add("answerButton");
        button.textContent = answer;

        button.addEventListener("click", () => {
            checkAnswer(index, button);
        });

        answersContainer.appendChild(button);
    });
}

/* =========================================================
   CHECK ANSWER
   ========================================================= */

function checkAnswer(selectedAnswer, clickedButton) {
    if (answerSelected) return;

    answerSelected = true;
    nextButton.disabled = false;

    const question = questions[currentQuestion];

    if (!topicPerformance[question.topic]) {
        topicPerformance[question.topic] = {
            correct: 0,
            total: 0
        };
    }

    topicPerformance[question.topic].total++;

    const allButtons = document.querySelectorAll(".answerButton");

    allButtons.forEach((button) => {
        button.disabled = true;
    });

    if (selectedAnswer === question.correct) {
        score++;

        topicPerformance[question.topic].correct++;

        clickedButton.classList.add("correct");

        feedback.textContent = "Correct! Great job ✓";
        feedback.classList.add("correct-feedback");

        quizScore.textContent = score;
    } else {
        clickedButton.classList.add("wrong");

        feedback.textContent =
            "Not quite — the correct answer is highlighted.";
        feedback.classList.add("wrong-feedback");

        const correctButton = allButtons[question.correct];

        if (correctButton) correctButton.classList.add("correct");
    }
}

/* =========================================================
   SAVE QUIZ RESULT
   ========================================================= */

async function saveQuizResult(scorePercentage, weakestTopic) {
    if (!currentUser) return;

    try {
        const response = await fetch("/api/quiz-result", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                subject: subjectSelect.value,
                topic: topicInput.value.trim() || "General " + subjectSelect.value,
                difficulty: difficultySelect.value,
                score,
                totalQuestions: questions.length,
                percentage: scorePercentage,
                weakTopic: weakestTopic || "Not available"
            })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Could not save quiz result.");
        }
    } catch (error) {
        console.error("Could not save quiz result:", error);
    }
}

/* =========================================================
   SHOW RESULTS
   ========================================================= */

function showResults() {
    const totalQuestions = questions.length;

    const scorePercentage =
        totalQuestions > 0
            ? Math.round((score / totalQuestions) * 100)
            : 0;

    const incorrect = totalQuestions - score;

    finalScore.textContent = score + " / " + totalQuestions;
    percentage.textContent = scorePercentage + "%";
    correctCount.textContent = score;
    wrongCount.textContent = incorrect;
    accuracyCount.textContent = scorePercentage + "%";

    topicResults.innerHTML = "";

    let weakestTopic = "";
    let weakestPercentage = 101;

    for (const topic in topicPerformance) {
        const correct = topicPerformance[topic].correct;
        const total = topicPerformance[topic].total;

        const topicPercentage = Math.round((correct / total) * 100);

        const topicElement = document.createElement("div");
        topicElement.className = "topic-result";

        const topicName = document.createElement("span");
        topicName.className = "topic-result-name";
        topicName.textContent = topic;

        const topicScore = document.createElement("span");
        topicScore.className = "topic-result-score";
        topicScore.textContent = topicPercentage + "%";

        if (topicPercentage >= 80) {
            topicScore.style.color = "var(--green)";
        } else if (topicPercentage >= 50) {
            topicScore.style.color = "var(--yellow)";
        } else {
            topicScore.style.color = "var(--red)";
        }

        topicElement.appendChild(topicName);
        topicElement.appendChild(topicScore);
        topicResults.appendChild(topicElement);

        if (topicPercentage < weakestPercentage) {
            weakestPercentage = topicPercentage;
            weakestTopic = topic;
        }
    }

    weakTopic.textContent = weakestTopic || "Not available";

    if (weakestTopic) {
        if (scorePercentage >= 80) {
            recommendation.textContent =
                "Excellent work! You have a strong understanding overall. Keep practicing " +
                weakestTopic +
                " to make your knowledge even stronger.";
        } else if (scorePercentage >= 50) {
            recommendation.textContent =
                "You're making progress. Spend a little more time practicing " +
                weakestTopic +
                " and review the core concepts before trying again.";
        } else {
            recommendation.textContent =
                "Start by reviewing the fundamentals of " +
                weakestTopic +
                ". Then practice a few questions and try another quiz.";
        }
    } else {
        recommendation.textContent =
            "Keep practicing to improve your performance.";
    }

    showScreen(resultsScreen);
    saveQuizResult(scorePercentage, weakestTopic);
}

/* =========================================================
   START QUIZ
   ========================================================= */

startButton.addEventListener("click", async () => {
    if (quizGenerating) return;

    quizGenerating = true;
    hideError();

    const buttonText = startButton.querySelector(".button-text");
    const originalText = buttonText.textContent;

    startButton.disabled = true;
    buttonText.textContent = "Generating...";
    loading.classList.add("active");

    try {
        const success = await getAIQuiz();

        if (!success) return;

        currentQuestion = 0;
        score = 0;
        answerSelected = false;
        topicPerformance = {};

        showScreen(quizScreen);
        showQuestion();
    } finally {
        loading.classList.remove("active");
        startButton.disabled = false;
        buttonText.textContent = originalText;
        quizGenerating = false;
    }
});

/* =========================================================
   NEXT QUESTION
   ========================================================= */

nextButton.addEventListener("click", () => {
    if (!answerSelected) return;

    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        showResults();
    }
});

/* =========================================================
   RESTART
   ========================================================= */

restartButton.addEventListener("click", () => {
    currentQuestion = 0;
    score = 0;
    answerSelected = false;
    questions = [];
    topicPerformance = {};

    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
    feedback.textContent = "";
    feedback.className = "feedback";
    quizScore.textContent = "0";

    hideError();
    showScreen(welcomeScreen);
});

/* =========================================================
   ENTER KEY
   ========================================================= */

topicInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !startButton.disabled) {
        event.preventDefault();
        startButton.click();
    }
});

/* =========================================================
   INITIALIZE
   ========================================================= */

initializeTheme();
initializeMusic();
updateQuestionCount(5);
switchAuthMode("login");

/* Authentication decides whether the user sees the app or login page. */
showScreen(authScreen);
initializeAuth();

console.log("StudySense final synchronized frontend initialized.");
