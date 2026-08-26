// ==========================================
// STUDYSENSE - SCRIPT
// ==========================================

let questions = [];
let currentQuestion = 0;
let score = 0;
let answerSelected = false;
let topicPerformance = {};

// ==========================================
// HTML ELEMENTS
// ==========================================

const welcomeScreen = document.getElementById("welcomeScreen");
const quizScreen = document.getElementById("quizScreen");
const resultsScreen = document.getElementById("resultsScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const subjectSelect = document.getElementById("subjectSelect");
const topicInput = document.getElementById("topicInput");
const difficultySelect = document.getElementById("difficultySelect");
const questionCountSelect = document.getElementById("questionCount");

const questionText = document.getElementById("questionText");
const answersContainer = document.getElementById("answers");
const nextButton = document.getElementById("nextButton");

const questionCounter = document.getElementById("questionCounter");
const quizScore = document.getElementById("quizScore");
const progressBar = document.getElementById("progressBar");
const feedback = document.getElementById("feedback");

const finalScore = document.getElementById("finalScore");
const percentage = document.getElementById("percentage");
const topicResults = document.getElementById("topicResults");
const weakTopic = document.getElementById("weakTopic");
const recommendation = document.getElementById("recommendation");

const loading = document.getElementById("loading");

// ==========================================
// MUSIC
// ==========================================

const studyAudio = document.getElementById("studyAudio");
const musicToggle = document.getElementById("musicToggle");
const previousTrack = document.getElementById("previousTrack");
const nextTrack = document.getElementById("nextTrack");
const trackSelect = document.getElementById("trackSelect");
const resultsTrackSelect = document.getElementById("resultsTrackSelect");
const volumeControl = document.getElementById("volumeControl");

// ==========================================
// LOCAL MUSIC
// ==========================================
//
// We will put the MP3 files inside:
//
// music/
//   lofi-focus.mp3
//   lofi-night.mp3
//   lofi-rain.mp3
//
// This avoids the Pixabay 403 problem.
//

const tracks = [
    {
        name: "Lofi Study — Focus",
        url: "/music/lofi-focus.mp3"
    },
    {
        name: "Lofi Study — Night",
        url: "/music/lofi-night.mp3"
    },
    {
        name: "Lofi Study — Rain",
        url: "/music/lofi-rain.mp3"
    }
];

let currentTrack = 0;

studyAudio.volume = Number(volumeControl.value);

// ==========================================
// LOAD TRACK
// ==========================================

function loadTrack(index, autoplay = false) {

    currentTrack =
        (index + tracks.length) % tracks.length;

    const track = tracks[currentTrack];

    studyAudio.src = track.url;
    studyAudio.load();

    trackSelect.value = String(currentTrack);

    if (resultsTrackSelect) {
        resultsTrackSelect.value = String(currentTrack);
    }

    if (autoplay) {

        studyAudio.play()
            .then(function () {

                musicToggle.textContent = "❚❚";

            })
            .catch(function (error) {

                console.error(
                    "Music playback failed:",
                    error
                );

                musicToggle.textContent = "▶";

            });

    }
}

// ==========================================
// TOGGLE MUSIC
// ==========================================

function toggleMusic() {

    if (!studyAudio.src) {
        loadTrack(currentTrack);
    }

    if (studyAudio.paused) {

        studyAudio.play()
            .then(function () {

                musicToggle.textContent = "❚❚";

            })
            .catch(function (error) {

                console.error(
                    "Music playback failed:",
                    error
                );

                musicToggle.textContent = "▶";

            });

    } else {

        studyAudio.pause();

        musicToggle.textContent = "▶";
    }
}

// ==========================================
// CHANGE TRACK
// ==========================================

function changeTrack(direction) {

    loadTrack(
        currentTrack + direction,
        true
    );
}

// ==========================================
// MUSIC EVENTS
// ==========================================

musicToggle.addEventListener(
    "click",
    toggleMusic
);

previousTrack.addEventListener(
    "click",
    function () {
        changeTrack(-1);
    }
);

nextTrack.addEventListener(
    "click",
    function () {
        changeTrack(1);
    }
);

trackSelect.addEventListener(
    "change",
    function () {

        loadTrack(
            Number(trackSelect.value),
            !studyAudio.paused
        );

    }
);

resultsTrackSelect.addEventListener(
    "change",
    function () {

        loadTrack(
            Number(resultsTrackSelect.value),
            !studyAudio.paused
        );

    }
);

volumeControl.addEventListener(
    "input",
    function () {

        studyAudio.volume =
            Number(volumeControl.value);

    }
);

studyAudio.addEventListener(
    "ended",
    function () {

        changeTrack(1);

    }
);

studyAudio.addEventListener(
    "error",
    function () {

        console.error(
            "Unable to load music:",
            studyAudio.src
        );

    }
);

// ==========================================
// GET QUIZ FROM SERVER
// ==========================================

async function getAIQuiz() {

    const subject =
        subjectSelect.value;

    const topic =
        topicInput.value.trim() ||
        "General " + subject;

    const difficulty =
        difficultySelect.value;

    const count =
        questionCountSelect.value;

    const params =
        new URLSearchParams({
            subject: subject,
            topic: topic,
            difficulty: difficulty,
            count: count
        });

    /*
     * IMPORTANT:
     *
     * Using a relative URL means:
     *
     * http://localhost:3000
     *
     * becomes:
     *
     * http://localhost:3000/generate-quiz
     *
     * This prevents the old problem where Live Server
     * tried to request the API from port 5500.
     */

    const url =
        "/generate-quiz?" +
        params.toString();

    console.log(
        "Requesting quiz:",
        url
    );

    try {

        const response =
            await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        console.log(
            "Quiz response:",
            response.status,
            contentType
        );

        let data;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Server returned non-JSON:",
                text
            );

            throw new Error(
                "The server returned an invalid response. " +
                "Make sure StudySense is opened through " +
                "http://localhost:3000"
            );
        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Server error: HTTP " +
                response.status
            );

        }

        if (data.error) {

            throw new Error(
                data.error
            );

        }

        if (!Array.isArray(data)) {

            throw new Error(
                "The server did not return a valid quiz."
            );

        }

        if (data.length === 0) {

            throw new Error(
                "The server returned an empty quiz."
            );

        }

        validateQuiz(data);

        questions = data;

        return true;

    } catch (error) {

        console.error(
            "Quiz generation failed:",
            error
        );

        alert(
            "StudySense couldn't generate the quiz.\n\n" +
            error.message
        );

        return false;
    }
}

// ==========================================
// VALIDATE QUIZ
// ==========================================

function validateQuiz(data) {

    data.forEach(
        function (question, index) {

            if (
                !question ||
                typeof question.question !== "string" ||
                !Array.isArray(question.answers) ||
                question.answers.length !== 4 ||
                typeof question.correct !== "number"
            ) {

                throw new Error(
                    "Question " +
                    (index + 1) +
                    " has an invalid format."
                );

            }

            if (
                question.correct < 0 ||
                question.correct > 3 ||
                !Number.isInteger(
                    question.correct
                )
            ) {

                throw new Error(
                    "Question " +
                    (index + 1) +
                    " has an invalid correct answer."
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
                    "Question " +
                    (index + 1) +
                    " contains an invalid answer."
                );

            }

            if (
                typeof question.topic !== "string" ||
                question.topic.trim() === ""
            ) {

                question.topic =
                    "General";
            }
        }
    );
}

// ==========================================
// SHOW QUESTION
// ==========================================

function showQuestion() {

    answerSelected = false;

    nextButton.disabled = true;

    feedback.textContent = "";

    const question =
        questions[currentQuestion];

    questionCounter.textContent =
        "Question " +
        (currentQuestion + 1) +
        " of " +
        questions.length;

    quizScore.textContent =
        "Score: " +
        score;

    const progress =
        ((currentQuestion + 1) /
            questions.length) *
        100;

    progressBar.style.width =
        progress + "%";

    questionText.textContent =
        question.question;

    answersContainer.innerHTML = "";

    question.answers.forEach(
        function (answer, index) {

            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent =
                answer;

            button.classList.add(
                "answerButton"
            );

            button.addEventListener(
                "click",
                function () {

                    checkAnswer(
                        index,
                        button
                    );

                }
            );

            answersContainer.appendChild(
                button
            );

        }
    );
}

// ==========================================
// CHECK ANSWER
// ==========================================

function checkAnswer(
    selectedAnswer,
    clickedButton
) {

    if (answerSelected) {
        return;
    }

    answerSelected = true;

    nextButton.disabled = false;

    const question =
        questions[currentQuestion];

    if (!topicPerformance[question.topic]) {

        topicPerformance[
            question.topic
        ] = {
            correct: 0,
            total: 0
        };
    }

    topicPerformance[
        question.topic
    ].total++;

    const allButtons =
        document.querySelectorAll(
            ".answerButton"
        );

    allButtons.forEach(
        function (button) {

            button.disabled = true;

        }
    );

    if (
        selectedAnswer ===
        question.correct
    ) {

        score++;

        topicPerformance[
            question.topic
        ].correct++;

        clickedButton.classList.add(
            "correct"
        );

        feedback.textContent =
            "Correct ✓";

        quizScore.textContent =
            "Score: " +
            score;

    } else {

        clickedButton.classList.add(
            "wrong"
        );

        feedback.textContent =
            "Incorrect";

        const correctButton =
            allButtons[question.correct];

        if (correctButton) {

            correctButton.classList.add(
                "correct"
            );
        }
    }
}

// ==========================================
// SHOW RESULTS
// ==========================================

function showResults() {

    quizScreen.style.display =
        "none";

    resultsScreen.style.display =
        "block";

    const scorePercentage =
        Math.round(
            (score / questions.length) *
            100
        );

    finalScore.textContent =
        score +
        " / " +
        questions.length;

    percentage.textContent =
        scorePercentage +
        "%";

    topicResults.innerHTML = "";

    let weakestTopic = "";
    let weakestPercentage = 101;

    for (
        const topic in topicPerformance
    ) {

        const correct =
            topicPerformance[
                topic
            ].correct;

        const total =
            topicPerformance[
                topic
            ].total;

        const topicPercentage =
            Math.round(
                (correct / total) *
                100
            );

        const topicElement =
            document.createElement("p");

        topicElement.textContent =
            topic +
            ": " +
            topicPercentage +
            "%";

        topicResults.appendChild(
            topicElement
        );

        if (
            topicPercentage <
            weakestPercentage
        ) {

            weakestPercentage =
                topicPercentage;

            weakestTopic =
                topic;
        }
    }

    weakTopic.textContent =
        weakestTopic ||
        "Not available";

    if (weakestTopic) {

        if (scorePercentage >= 80) {

            recommendation.textContent =
                "Great work! You have a strong understanding overall. Keep practicing " +
                weakestTopic +
                " to make your knowledge even stronger.";

        } else if (scorePercentage >= 50) {

            recommendation.textContent =
                "You're making progress. Spend more time practicing " +
                weakestTopic +
                " and review the core concepts before attempting another quiz.";

        } else {

            recommendation.textContent =
                "Start by reviewing the fundamentals of " +
                weakestTopic +
                ". Then try practice questions and take another quiz.";
        }

    } else {

        recommendation.textContent =
            "Keep practicing to improve your performance.";
    }
}

// ==========================================
// START QUIZ
// ==========================================

startButton.addEventListener(
    "click",
    async function () {

        startButton.disabled = true;

        const originalText =
            startButton.textContent;

        startButton.textContent =
            "Preparing quiz...";

        loading.classList.add(
            "active"
        );

        try {

            const success =
                await getAIQuiz();

            if (!success) {
                return;
            }

            currentQuestion = 0;
            score = 0;
            answerSelected = false;
            topicPerformance = {};

            welcomeScreen.style.display =
                "none";

            quizScreen.style.display =
                "block";

            resultsScreen.style.display =
                "none";

            showQuestion();

        } finally {

            loading.classList.remove(
                "active"
            );

            startButton.disabled =
                false;

            startButton.textContent =
                originalText;
        }
    }
);

// ==========================================
// NEXT QUESTION
// ==========================================

nextButton.addEventListener(
    "click",
    function () {

        if (!answerSelected) {
            return;
        }

        if (
            currentQuestion <
            questions.length - 1
        ) {

            currentQuestion++;

            showQuestion();

        } else {

            showResults();
        }
    }
);

// ==========================================
// RESTART
// ==========================================

restartButton.addEventListener(
    "click",
    function () {

        currentQuestion = 0;

        score = 0;

        answerSelected = false;

        questions = [];

        topicPerformance = {};

        resultsScreen.style.display =
            "none";

        welcomeScreen.style.display =
            "block";

        progressBar.style.width =
            "0%";

        feedback.textContent =
            "";

        quizScore.textContent =
            "Score: 0";
    }
);

// ==========================================
// INITIALIZE MUSIC
// ==========================================

loadTrack(0, false);