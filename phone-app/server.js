// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: 'k-proj-n5A1l5VDLBr7RFuRIy9vt-4tomlcjgofOUFmYWavS5vMR1jMG5cbqRfaH6r4kVeW_zr1XUFtlhT3BlbkFJHl4bhG5RxOaAiLZRoUxbAStg45d8j-pDIFX6A8H1CTqqVd7po5k1ylJlqlQqIkXchCdApdmjYA' });

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

app.post('/process-data', async (req, res) => {
  try {
    const { audio, image } = req.body;

    const audioBuffer = Buffer.from(audio, 'base64');
    fs.writeFileSync('temp_audio.mp3', audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream('temp_audio.mp3'),
      model: 'whisper-1',
    });

    const text = transcription.text;

    const dataUrl = `data:image/jpeg;base64,${image}`;

    const messages = [
      {
        role: 'user',
        content: `Text: ${text}`,
      },
      {
        role: 'user',
        content: {
          type: 'image_url',
          image_url: {
            url: dataUrl,
          },
        },
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
    });

    const feedback = response?.choices?.[0]?.message?.content || '(No content)';

    res.json({ feedback });
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/process-data`);
});