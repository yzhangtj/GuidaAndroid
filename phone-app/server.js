/**
 * server.js
 * Run with: node server.js
 *
 * 1) Accepts JSON in this format:
 *    {
 *      "text": "...",
 *      "image": "base64stringHere..."  // no "data:image/jpeg;base64," prefix yet
 *    }
 *
 * 2) Calls GPT-4 Vision with the data URL:
 *    "data:image/jpeg;base64,<theBase64FromClient>"
 *
 * 3) Returns the AI response as JSON: { feedback: <some text> }
 */

// -------------- IMPORTS --------------
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import OpenAI from 'openai';

// -------------- OPENAI INIT --------------
// Insert your API key. Or read from an env var in production.
const openai = new OpenAI({
  apiKey: 'k-proj-n5A1l5VDLBr7RFuRIy9vt-4tomlcjgofOUFmYWavS5vMR1jMG5cbqRfaH6r4kVeW_zr1XUFtlhT3BlbkFJHl4bhG5RxOaAiLZRoUxbAStg45d8j-pDIFX6A8H1CTqqVd7po5k1ylJlqlQqIkXchCdApdmjYA',
});

// -------------- EXPRESS APP SETUP --------------
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // allow large base64 payloads

// -------------- ENDPOINT: POST /process-data --------------
app.post('/process-data', async (req, res) => {
  try {
    // Extract fields from the request body
    const { text, image } = req.body;
    console.log('Received text:', text);
    console.log('Received base64 image length:', image?.length);

    // Construct a "data URL" using the base64 image string
    // e.g. "data:image/jpeg;base64,<theBase64>"
    const dataUrl = `data:image/jpeg;base64,${image}`;

    // Build the messages array
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: text, // user-provided prompt/question
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl, // pass the data URL to GPT-4 Vision
            },
          },
        ],
      },
    ];

    // Call the GPT-4 Vision (e.g. "gpt-4o-mini" model)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or the appropriate GPT-4 Vision model
      messages: messages,
    });

    // Extract the content
    const choice = response?.choices?.[0];
    const feedback = choice?.message?.content || '(No content)';

    console.log('OpenAI response:', feedback);

    // Return feedback to the client (RK3566 or other)
    res.json({ feedback });
  } catch (error) {
    console.error('Error in /process-data:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------- START SERVER --------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/process-data`);
});
