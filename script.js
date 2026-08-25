// ==========================================
// STUDYSENSE - SCRIPT.JS
// ==========================================


// ==========================================
// 1. VARIABLES
// ==========================================

let questions = [];

let currentQuestion = 0;

let score = 0;

let answerSelected = false;

let topicPerformance = {};

let selectedSubject = "";


// ==========================================
// 2. GET HTML ELEMENTS
// ==========================================

const startButton =
    document.getElementById("startButton");

const welcomeScreen =
    document.getElementById("welcomeScreen");

const quizScreen =
    document.getElementById("quizScreen");

const resultsScreen =
    document.getElementById("resultsScreen");

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
// 3. GET SELECTED SUBJECT
// ==========================================

function getSelectedSubject() {

    const subjectSelect =
        document.getElementById("subjectSelect");

    if (subjectSelect) {

        selectedSubject =
            subjectSelect.value;

    }

    console.log(
        "Selected subject:",
        selectedSubject
    );

}


// ==========================================
// 4. GET QUIZ FROM GEMINI
// ==========================================

async function getAIQuiz() {

    console.log("Requesting quiz from Gemini...");

    try {

        // IMPORTANT:
        // This is your PUBLIC BACKEND URL.

        const response =
            await fetch(
                "https://floating-measuring-feat-subcommittee.trycloudflare.com/generate-quiz?subject=" +
                encodeURIComponent(selectedSubject)
            );


        // Check server response

        if (!response.ok) {

            throw new Error(
                "Server returned an error: " +
                response.status
            );

        }


        // Convert response into JSON

        const data =
            await response.json();


        console.log(
            "Gemini quiz received:",
            data
        );


        // Make sure we actually received questions

        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            throw new Error(
                "Invalid quiz data received from server."
            );

        }


        return data.questions;

    }

    catch (error) {

        console.error(
            "Error getting quiz:",
            error
        );

        alert(
            "Unable to generate the quiz. Please try again."
        );

        return null;

    }

}


// ==========================================
// 5. PREPARE QUIZ
// ==========================================

async function prepareQuiz() {

    // Get subject

    getSelectedSubject();


    // Make sure subject was selected

    if (!selectedSubject) {

        alert(
            "Please select a subject first."
        );

        return;

    }


    // Show quiz screen

    welcomeScreen.style.display =
        "none";

    quizScreen.style.display =
        "block";


    // Show loading message

    questionText.textContent =
        "The quiz is being prepared...";

    answersContainer.innerHTML = "";

    feedback.textContent = "";

    nextButton.disabled = true;


    // Get questions from Gemini

    const generatedQuestions =
        await getAIQuiz();


    // If generation failed

    if (!generatedQuestions) {

        quizScreen.style.display =
            "none";

        welcomeScreen.style.display =
            "block";

        return;

    }


    // Save questions

    questions =
        generatedQuestions;


    // Reset quiz

    currentQuestion = 0;

    score = 0;

    answerSelected = false;

    topicPerformance = {};


    // Show first question

    showQuestion();

}


// ==========================================
// 6. SHOW QUESTION
// ==========================================

function showQuestion() {

    answerSelected = false;

    nextButton.disabled = true;

    feedback.textContent = "";


    const question =
        questions[currentQuestion];


    // Question counter

    questionCounter.textContent =
        "Question " +
        (currentQuestion + 1) +
        " of " +
        questions.length;


    // Progress bar

    const progress =
        ((currentQuestion + 1) /
            questions.length) *
        100;


    progressBar.style.width =
        progress + "%";


    // Question text

    questionText.textContent =
        question.question;


    // Remove previous answers

    answersContainer.innerHTML = "";


    // Create answer buttons

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
// 7. CHECK ANSWER
// ==========================================

function checkAnswer(
    selectedAnswer,
    clickedButton
) {

    // Prevent multiple answers

    if (answerSelected === true) {

        return;

    }


    answerSelected = true;

    nextButton.disabled = false;


    const question =
        questions[currentQuestion];


    // Create topic data

    if (
        !topicPerformance[
            question.topic
        ]
    ) {

        topicPerformance[
            question.topic
        ] = {

            correct: 0,

            total: 0

        };

    }


    // Increase topic question count

    topicPerformance[
        question.topic
    ].total++;


    // Get all answer buttons

    const allButtons =
        document.querySelectorAll(
            ".answerButton"
        );


    // Disable all buttons

    allButtons.forEach(
        function (button) {

            button.disabled = true;

        }
    );


    // Check answer

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
            "Correct!";

    }

    else {

        clickedButton.classList.add(
            "wrong"
        );


        feedback.textContent =
            "Wrong!";


        // Highlight correct answer

        allButtons[
            question.correct
        ].classList.add(
            "correct"
        );

    }

}


// ==========================================
// 8. SHOW RESULTS
// ==========================================

function showResults() {

    quizScreen.style.display =
        "none";

    resultsScreen.style.display =
        "block";


    // Calculate percentage

    const scorePercentage =
        Math.round(
            (score / questions.length) *
            100
        );


    // Show score

    finalScore.textContent =
        score +
        " / " +
        questions.length;


    // Show percentage

    percentage.textContent =
        scorePercentage +
        "%";


    // Clear previous results

    topicResults.innerHTML = "";


    let weakestTopic = "";

    let weakestPercentage = 101;


    // Analyze topics

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


        // Create result element

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


        // Find weakest topic

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


    // Show weakest topic

    weakTopic.textContent =
        weakestTopic;


    // Recommendation

    recommendation.textContent =
        "You should spend more time practicing " +
        weakestTopic +
        ". Focus on understanding the concepts and solving practice questions.";

}


// ==========================================
// 9. START BUTTON
// ==========================================

startButton.addEventListener(
    "click",
    function () {

        prepareQuiz();

    }
);


// ==========================================
// 10. NEXT BUTTON
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

        }

        else {

            showResults();

        }

    }
);


// ==========================================
// 11. RESTART BUTTON
// ==========================================

restartButton.addEventListener(
    "click",
    function () {

        currentQuestion = 0;

        score = 0;

        answerSelected = false;

        topicPerformance = {};

        questions = [];


        resultsScreen.style.display =
            "none";

        welcomeScreen.style.display =
            "block";

    }
);