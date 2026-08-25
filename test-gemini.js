require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function test() {

    console.log("Starting Gemini request...");

    const start = Date.now();

    try {

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: "Say hello"
        });

        const end = Date.now();

        console.log("SUCCESS!");
        console.log(response.text);

        console.log(
            "Time taken:",
            ((end - start) / 1000).toFixed(2),
            "seconds"
        );

    } catch (error) {

        const end = Date.now();

        console.log("ERROR!");
        console.log(error);

        console.log(
            "Time before error:",
            ((end - start) / 1000).toFixed(2),
            "seconds"
        );
    }
}

test();