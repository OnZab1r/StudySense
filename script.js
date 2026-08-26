// ==========================================
// STUDYSENSE - SCRIPT
// ==========================================


// ==========================================
// 1. VARIABLES
// ==========================================

let questions = [];

let currentQuestion = 0;

let score = 0;

let answerSelected = false;

let topicPerformance = {};


// ==========================================
// 2. GET HTML ELEMENTS
// ==========================================

const welcomeScreen =
    document.getElementById("welcomeScreen");

const quizScreen =
    document.getElementById("quizScreen");

const resultsScreen =
    document.getElementById("resultsScreen");

const startButton =
    document.getElementById("startButton");

const questionText =
    document.getElementById("questionText");

const answersContainer =
    document.getElementById("answers");

const nextButton =
    document.getElementById("nextButton");

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

const restartButton =
    document.getElementById("restartButton");

const questionCounter =
    document.getElementById("questionCounter");

const progressBar =
    document.getElementById("progressBar");

const feedback =
    document.getElementById("feedback");


// ==========================================
// 3. SETTINGS
// ==========================================

// These IDs need to match the HTML.

const subjectSelect =
    document.getElementById("subject");

const topicInput =
    document.getElementById("topic");

const difficultySelect =
    document.getElementById("difficulty");

const questionCountSelect =
    document.getElementById("questionCount");


// ==========================================
// 4. GET QUIZ FROM GEMINI
// ==========================================

async function getAIQuiz() {

    console.log("Requesting quiz from StudySense server...");

    // --------------------------------------
    // Get settings
    // --------------------------------------

    const subject =
        subjectSelect
            ? subjectSelect.value
            : "Biology";


    const topic =
        topicInput && topicInput.value.trim()
            ? topicInput.value.trim()
            : "General " + subject;


    const difficulty =
        difficultySelect
            ? difficultySelect.value
            : "Medium";


    const count =
        questionCountSelect
            ? questionCountSelect.value
            : "5";


    // --------------------------------------
    // Build API URL
    // --------------------------------------

    const params =
        new URLSearchParams({

            subject: subject,

            topic: topic,

            difficulty: difficulty,

            count: count

        });


    // IMPORTANT:
    // We use a relative URL.
    //
    // This works both locally and on Render.
    //
    // DO NOT use:
    // http://localhost:3000/generate-quiz
    //

    const url =
        "/generate-quiz?" +
        params.toString();


    console.log(
        "Request URL:",
        url
    );


    try {

        // ----------------------------------
        // Send request to backend
        // ----------------------------------

        const response =
            await fetch(url);


        // ----------------------------------
        // Check response
        // ----------------------------------

        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status
            );

        }


        // ----------------------------------
        // Convert response to JSON
        // ----------------------------------

        const data =
            await response.json();


        console.log(
            "Quiz received:",
            data
        );


        // ----------------------------------
        // Check if server returned an error
        // ----------------------------------

        if (data.error) {

            throw new Error(
                data.error
            );

        }


        // ----------------------------------
        // Make sure we received an array
        // ----------------------------------

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


        // ----------------------------------
        // Save questions
        // ----------------------------------

        questions = data;


        return true;


    } catch (error) {

        console.error(
            "Quiz request failed:",
            error
        );


        alert(
            "Sorry, StudySense couldn't generate the quiz.\n\n" +
            error.message
        );


        return false;

    }

}


// ==========================================
// 5. SHOW QUESTION
// ==========================================

function showQuestion() {

    answerSelected = false;

    nextButton.disabled = true;

    feedback.textContent = "";


    const question =
        questions[currentQuestion];


    // --------------------------------------
    // Question counter
    // --------------------------------------

    questionCounter.textContent =
        "Question " +
        (currentQuestion + 1) +
        " of " +
        questions.length;


    // --------------------------------------
    // Progress bar
    // --------------------------------------

    const progress =
        ((currentQuestion + 1) /
            questions.length) *
        100;


    progressBar.style.width =
        progress + "%";


    // --------------------------------------
    // Question text
    // --------------------------------------

    questionText.textContent =
        question.question;


    // --------------------------------------
    // Remove old answers
    // --------------------------------------

    answersContainer.innerHTML = "";


    // --------------------------------------
    // Create answer buttons
    // --------------------------------------

    question.answers.forEach(
        function (answer, index) {

            const button =
                document.createElement("button");


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
// 6. CHECK ANSWER
// ==========================================

function checkAnswer(
    selectedAnswer,
    clickedButton
) {

    if (answerSelected === true) {

        return;

    }


    answerSelected = true;

    nextButton.disabled = false;


    const question =
        questions[currentQuestion];


    // --------------------------------------
    // Create topic data
    // --------------------------------------

    if (!topicPerformance[question.topic]) {

        topicPerformance[question.topic] = {

            correct: 0,

            total: 0

        };

    }


    topicPerformance[
        question.topic
    ].total++;


    // --------------------------------------
    // Get all answer buttons
    // --------------------------------------

    const allButtons =
        document.querySelectorAll(
            ".answerButton"
        );


    // --------------------------------------
    // Disable all buttons
    // --------------------------------------

    allButtons.forEach(
        function (button) {

            button.disabled = true;

        }
    );


    // --------------------------------------
    // Check answer
    // --------------------------------------

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
            "Correct";


    } else {

        clickedButton.classList.add(
            "wrong"
        );


        feedback.textContent =
            "Incorrect";


        // Show correct answer

        if (
            allButtons[
                question.correct
            ]
        ) {

            allButtons[
                question.correct
            ].classList.add(
                "correct"
            );

        }

    }

}


// ==========================================
// 7. SHOW RESULTS
// ==========================================

function showResults() {

    quizScreen.style.display =
        "none";


    resultsScreen.style.display =
        "block";


    // --------------------------------------
    // Calculate percentage
    // --------------------------------------

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


    // --------------------------------------
    // Clear previous topic results
    // --------------------------------------

    topicResults.innerHTML = "";


    let weakestTopic = "";

    let weakestPercentage = 101;


    // --------------------------------------
    // Analyze topics
    // --------------------------------------

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


        // ----------------------------------
        // Create topic result
        // ----------------------------------

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


        // ----------------------------------
        // Find weakest topic
        // ----------------------------------

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


    // --------------------------------------
    // Display weakest topic
    // --------------------------------------

    weakTopic.textContent =
        weakestTopic ||
        "Not available";


    // --------------------------------------
    // Recommendation
    // --------------------------------------

    if (weakestTopic) {

        recommendation.textContent =
            "Spend more time practicing " +
            weakestTopic +
            ". Focus on understanding the concepts and solving practice questions.";

    } else {

        recommendation.textContent =
            "Keep practicing to improve your performance.";

    }

}


// ==========================================
// 8. START QUIZ
// ==========================================

startButton.addEventListener(
    "click",
    async function () {

        // ----------------------------------
        // Prevent multiple clicks
        // ----------------------------------

        startButton.disabled = true;


        // ----------------------------------
        // Change button text
        // ----------------------------------

        const originalText =
            startButton.textContent;


        startButton.textContent =
            "Preparing quiz...";


        try {

            // --------------------------------
            // Hide welcome loading if available
            // --------------------------------

            const loading =
                document.getElementById(
                    "loading"
                );


            if (loading) {

                loading.style.display =
                    "block";

            }


            // --------------------------------
            // Ask Gemini for quiz
            // --------------------------------

            const success =
                await getAIQuiz();


            // --------------------------------
            // Stop if request failed
            // --------------------------------

            if (!success) {

                return;

            }


            // --------------------------------
            // Reset quiz
            // --------------------------------

            currentQuestion = 0;

            score = 0;

            answerSelected = false;

            topicPerformance = {};


            // --------------------------------
            // Show quiz screen
            // --------------------------------

            welcomeScreen.style.display =
                "none";


            quizScreen.style.display =
                "block";


            resultsScreen.style.display =
                "none";


            // --------------------------------
            // Display first question
            // --------------------------------

            showQuestion();


        } finally {

            // --------------------------------
            // Hide loading
            // --------------------------------

            const loading =
                document.getElementById(
                    "loading"
                );


            if (loading) {

                loading.style.display =
                    "none";

            }


            // --------------------------------
            // Restore button
            // --------------------------------

            startButton.disabled =
                false;


            startButton.textContent =
                originalText;

        }

    }
);


// ==========================================
// 9. NEXT BUTTON
// ==========================================

nextButton.addEventListener(
    "click",
    function () {

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
// 10. RESTART
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


        // Reset progress bar

        progressBar.style.width =
            "0%";


        feedback.textContent = "";

    }
);