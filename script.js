// =========================================================
// STUDYSENSE — PHASE 1
// =========================================================

// =========================================================
// QUIZ STATE
// =========================================================

let questions = [];
let currentQuestion = 0;
let score = 0;
let answerSelected = false;
let topicPerformance = {};


// =========================================================
// HTML ELEMENTS
// =========================================================

const welcomeScreen =
    document.getElementById("welcomeScreen");

const quizScreen =
    document.getElementById("quizScreen");

const resultsScreen =
    document.getElementById("resultsScreen");


const startButton =
    document.getElementById("startButton");

const restartButton =
    document.getElementById("restartButton");


const subjectSelect =
    document.getElementById("subjectSelect");

const topicInput =
    document.getElementById("topicInput");

const difficultySelect =
    document.getElementById("difficultySelect");

const questionCountSelect =
    document.getElementById("questionCount");


const questionText =
    document.getElementById("questionText");

const answersContainer =
    document.getElementById("answers");

const nextButton =
    document.getElementById("nextButton");


const questionCounter =
    document.getElementById("questionCounter");

const quizScore =
    document.getElementById("quizScore");

const progressBar =
    document.getElementById("progressBar");

const progressPercent =
    document.getElementById("progressPercent");

const feedback =
    document.getElementById("feedback");


const finalScore =
    document.getElementById("finalScore");

const percentage =
    document.getElementById("percentage");

const topicResults =
    document.getElementById("topicResults");

const weakTopic =
    document.getElementById("weakTopic");

const recommendation =
    document.getElementById("recommendation");


const loading =
    document.getElementById("loading");


// =========================================================
// MUSIC ELEMENTS
// =========================================================

const studyAudio =
    document.getElementById("studyAudio");

const musicToggle =
    document.getElementById("musicToggle");

const previousTrack =
    document.getElementById("previousTrack");

const nextTrack =
    document.getElementById("nextTrack");

const trackSelect =
    document.getElementById("trackSelect");

const resultsTrackSelect =
    document.getElementById("resultsTrackSelect");

const volumeControl =
    document.getElementById("volumeControl");

const musicFloatingButton =
    document.getElementById(
        "musicFloatingButton"
    );

const musicDrawer =
    document.getElementById(
        "musicDrawer"
    );

const musicOverlay =
    document.getElementById(
        "musicOverlay"
    );

const musicClose =
    document.getElementById(
        "musicClose"
    );

const musicPlayingIndicator =
    document.getElementById(
        "musicPlayingIndicator"
    );

const currentTrackName =
    document.getElementById(
        "currentTrackName"
    );

const volumeValue =
    document.getElementById(
        "volumeValue"
    );


// =========================================================
// THEME
// =========================================================

const themeToggle =
    document.getElementById(
        "themeToggle"
    );


// =========================================================
// MUSIC TRACKS
// =========================================================

const tracks = [

    {
        name:
            "Lofi Midnight Club",

        url:
            "/music/alex-morgan-lofi-midnight-club-568164.mp3"
    },

    {
        name:
            "Around the World",

        url:
            "/music/aroundtheworld.mp3"
    },

    {
        name:
            "Diet Mountain Dew",

        url:
            "/music/dietmountaindew.mp3"
    },

    {
        name:
            "Feet Don't Fail Me Now",

        url:
            "/music/feetdontfailmenow.mp3"
    },

    {
        name:
            "I Like the Way You Kiss Me",

        url:
            "/music/ilikethewayyoukissme.mp3"
    },

    {
        name:
            "Misery",

        url:
            "/music/misery.mp3"
    },

    {
        name:
            "Nuts",

        url:
            "/music/nuts.mp3"
    },

    {
        name:
            "Obsessed",

        url:
            "/music/obsessed.mp3"
    },

    {
        name:
            "Five Hundred Miles",

        url:
            "/music/Peter_Paul_Mary_-_Five_Hundred_Miles_(mp3.pm).mp3"
    },

    {
        name:
            "Salvatore",

        url:
            "/music/salvatore.mp3"
    },

    {
        name:
            "Suzume no Tojimaru",

        url:
            "/music/suzume-no-tojimaru.mp3"
    }

];


let currentTrack = 0;


// =========================================================
// QUESTION COUNT BUTTONS
// =========================================================

const countButtons =
    document.querySelectorAll(
        ".count-option"
    );


countButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                countButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                questionCountSelect.value =
                    button.dataset.count;

            }
        );

    }
);


// =========================================================
// LOAD MUSIC
// =========================================================

function loadTrack(
    index,
    autoplay = false
) {

    currentTrack =
        (index + tracks.length) %
        tracks.length;


    const track =
        tracks[currentTrack];


    studyAudio.src =
        track.url;


    studyAudio.load();


    trackSelect.value =
        String(currentTrack);


    if (resultsTrackSelect) {

        resultsTrackSelect.value =
            String(currentTrack);

    }


    if (currentTrackName) {

        currentTrackName.textContent =
            track.name;

    }


    if (autoplay) {

        studyAudio
            .play()
            .then(
                function () {

                    musicToggle.textContent =
                        "❚❚";

                }
            )
            .catch(
                function (error) {

                    console.error(
                        "Music playback failed:",
                        error
                    );

                    musicToggle.textContent =
                        "▶";

                }
            );

    }

}


// =========================================================
// TOGGLE MUSIC
// =========================================================

function toggleMusic() {

    if (!studyAudio.src) {

        loadTrack(
            currentTrack
        );

    }


    if (studyAudio.paused) {

        studyAudio
            .play()
            .then(
                function () {

                    musicToggle.textContent =
                        "❚❚";

                }
            )
            .catch(
                function (error) {

                    console.error(
                        "Music playback failed:",
                        error
                    );

                    musicToggle.textContent =
                        "▶";

                }
            );

    } else {

        studyAudio.pause();

        musicToggle.textContent =
            "▶";

    }

}


// =========================================================
// CHANGE TRACK
// =========================================================

function changeTrack(
    direction
) {

    loadTrack(
        currentTrack + direction,
        true
    );

}


// =========================================================
// MUSIC EVENTS
// =========================================================

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
            Number(
                trackSelect.value
            ),
            !studyAudio.paused
        );

    }
);


resultsTrackSelect.addEventListener(
    "change",
    function () {

        loadTrack(
            Number(
                resultsTrackSelect.value
            ),
            !studyAudio.paused
        );

    }
);


volumeControl.addEventListener(
    "input",
    function () {

        const volume =
            Number(
                volumeControl.value
            );


        studyAudio.volume =
            volume;


        if (volumeValue) {

            volumeValue.textContent =
                Math.round(
                    volume * 100
                ) + "%";

        }

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


studyAudio.addEventListener(
    "play",
    function () {

        musicToggle.textContent =
            "❚❚";


        musicFloatingButton.classList.add(
            "playing"
        );


        musicPlayingIndicator.classList.add(
            "active"
        );

    }
);


studyAudio.addEventListener(
    "pause",
    function () {

        musicToggle.textContent =
            "▶";


        musicFloatingButton.classList.remove(
            "playing"
        );


        musicPlayingIndicator.classList.remove(
            "active"
        );

    }
);


// =========================================================
// MUSIC DRAWER
// =========================================================

function openMusicDrawer() {

    musicDrawer.classList.add(
        "open"
    );


    musicOverlay.classList.add(
        "visible"
    );


    musicDrawer.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeMusicDrawer() {

    musicDrawer.classList.remove(
        "open"
    );


    musicOverlay.classList.remove(
        "visible"
    );


    musicDrawer.setAttribute(
        "aria-hidden",
        "true"
    );

}


musicFloatingButton.addEventListener(
    "click",
    openMusicDrawer
);


musicClose.addEventListener(
    "click",
    closeMusicDrawer
);


musicOverlay.addEventListener(
    "click",
    closeMusicDrawer
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeMusicDrawer();

        }

    }
);


// =========================================================
// THEME
// =========================================================

function applyTheme(
    theme
) {

    const light =
        theme === "light";


    document.body.classList.toggle(
        "light-mode",
        light
    );


    themeToggle.textContent =
        light
            ? "🌙"
            : "☀️";


    themeToggle.setAttribute(
        "aria-label",
        light
            ? "Switch to dark mode"
            : "Switch to light mode"
    );


    localStorage.setItem(
        "studysense-theme",
        theme
    );

}


const savedTheme =
    localStorage.getItem(
        "studysense-theme"
    );


applyTheme(
    savedTheme || "dark"
);


themeToggle.addEventListener(
    "click",
    function () {

        const isLight =
            document.body.classList.contains(
                "light-mode"
            );


        applyTheme(
            isLight
                ? "dark"
                : "light"
        );

    }
);


// =========================================================
// GET AI QUIZ
// =========================================================

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

            subject:
                subject,

            topic:
                topic,

            difficulty:
                difficulty,

            count:
                count

        });


    const url =
        "/generate-quiz?" +
        params.toString();


    console.log(
        "Requesting quiz:",
        url
    );


    try {

        const response =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


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


        validateQuiz(
            data
        );


        questions =
            data;


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


// =========================================================
// VALIDATE QUIZ
// =========================================================

function validateQuiz(
    data
) {

    data.forEach(
        function (
            question,
            index
        ) {

            if (
                !question ||
                typeof question.question !==
                    "string" ||
                !Array.isArray(
                    question.answers
                ) ||
                question.answers.length !==
                    4 ||
                typeof question.correct !==
                    "number"
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
                    function (answer) {

                        return (
                            typeof answer !==
                                "string" ||
                            !answer.trim()
                        );

                    }
                )
            ) {

                throw new Error(
                    "Question " +
                    (index + 1) +
                    " contains an invalid answer."
                );

            }


            if (
                typeof question.topic !==
                    "string" ||
                !question.topic.trim()
            ) {

                question.topic =
                    "General";

            }

        }
    );

}


// =========================================================
// SHOW QUESTION
// =========================================================

function showQuestion() {

    answerSelected =
        false;


    nextButton.disabled =
        true;


    feedback.textContent =
        "";


    const question =
        questions[
            currentQuestion
        ];


    questionCounter.textContent =
        "Question " +
        (currentQuestion + 1) +
        " of " +
        questions.length;


    quizScore.textContent =
        "Score: " +
        score;


    const progress =
        (
            (currentQuestion + 1) /
            questions.length
        ) * 100;


    progressBar.style.width =
        progress + "%";


    progressPercent.textContent =
        Math.round(
            progress
        ) + "%";


    questionText.textContent =
        question.question;


    answersContainer.innerHTML =
        "";


    question.answers.forEach(
        function (
            answer,
            index
        ) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                answer;


            button.className =
                "answerButton";


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


// =========================================================
// CHECK ANSWER
// =========================================================

function checkAnswer(
    selectedAnswer,
    clickedButton
) {

    if (
        answerSelected
    ) {

        return;

    }


    answerSelected =
        true;


    nextButton.disabled =
        false;


    const question =
        questions[
            currentQuestion
        ];


    if (
        !topicPerformance[
            question.topic
        ]
    ) {

        topicPerformance[
            question.topic
        ] = {

            correct:
                0,

            total:
                0

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

            button.disabled =
                true;

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
            "Incorrect — the correct answer is highlighted.";


        const correctButton =
            allButtons[
                question.correct
            ];


        if (
            correctButton
        ) {

            correctButton.classList.add(
                "correct"
            );

        }

    }

}


// =========================================================
// SHOW RESULTS
// =========================================================

function showResults() {

    quizScreen.style.display =
        "none";


    resultsScreen.style.display =
        "block";


    const scorePercentage =
        Math.round(
            (score /
                questions.length) *
            100
        );


    finalScore.textContent =
        score +
        " / " +
        questions.length;


    percentage.textContent =
        scorePercentage +
        "%";


    topicResults.innerHTML =
        "";


    let weakestTopic =
        "";


    let weakestPercentage =
        101;


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
                (correct /
                    total) *
                100
            );


        const topicElement =
            document.createElement(
                "p"
            );


        topicElement.innerHTML =
            "<span>" +
            topic +
            "</span>" +
            "<strong>" +
            topicPercentage +
            "%</strong>";


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


    if (
        weakestTopic
    ) {

        if (
            scorePercentage >=
            80
        ) {

            recommendation.textContent =
                "Excellent work. You have a strong understanding overall. Keep practicing " +
                weakestTopic +
                " to make your knowledge even stronger.";

        } else if (
            scorePercentage >=
            50
        ) {

            recommendation.textContent =
                "You're making solid progress. Spend some extra time reviewing " +
                weakestTopic +
                " before taking another quiz.";

        } else {

            recommendation.textContent =
                "Start by reviewing the fundamentals of " +
                weakestTopic +
                ". Then try another practice quiz.";

        }

    } else {

        recommendation.textContent =
            "Keep practicing to improve your performance.";

    }

}


// =========================================================
// START QUIZ
// =========================================================

startButton.addEventListener(
    "click",
    async function () {

        startButton.disabled =
            true;


        const buttonText =
            startButton.querySelector(
                ".button-text"
            );


        if (buttonText) {

            buttonText.textContent =
                "Generating...";

        }


        loading.classList.add(
            "active"
        );


        try {

            const success =
                await getAIQuiz();


            if (!success) {

                return;

            }


            currentQuestion =
                0;


            score =
                0;


            answerSelected =
                false;


            topicPerformance =
                {};


            welcomeScreen.style.display =
                "none";


            resultsScreen.style.display =
                "none";


            quizScreen.style.display =
                "block";


            showQuestion();

        } finally {

            loading.classList.remove(
                "active"
            );


            startButton.disabled =
                false;


            if (buttonText) {

                buttonText.textContent =
                    "Generate Quiz";

            }

        }

    }
);


// =========================================================
// NEXT QUESTION
// =========================================================

nextButton.addEventListener(
    "click",
    function () {

        if (
            !answerSelected
        ) {

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


// =========================================================
// RESTART
// =========================================================

restartButton.addEventListener(
    "click",
    function () {

        currentQuestion =
            0;


        score =
            0;


        answerSelected =
            false;


        questions =
            [];


        topicPerformance =
            {};


        resultsScreen.style.display =
            "none";


        welcomeScreen.style.display =
            "block";


        progressBar.style.width =
            "0%";


        progressPercent.textContent =
            "0%";


        feedback.textContent =
            "";


        quizScore.textContent =
            "Score: 0";

    }
);


// =========================================================
// INITIALIZE
// =========================================================

studyAudio.volume =
    Number(
        volumeControl.value
    );


loadTrack(
    0,
    false
);