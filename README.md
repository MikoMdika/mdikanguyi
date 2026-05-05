# Audio to Text Transcription App

A simple Node.js and Express web app that lets you upload an audio file and transcribe it with the OpenAI API.

## Features

- Browser-based audio upload form
- Express endpoint for handling multipart uploads with `multer`
- OpenAI Audio Transcriptions API integration
- Basic client-side status messages and copy-to-clipboard support
- Temporary uploads are removed after each transcription request

## Prerequisites

- Node.js 20 or newer
- An OpenAI API key

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Add your OpenAI API key to `.env`:

   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Optional: choose a transcription model and upload limit in `.env`:

   ```bash
   OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
   MAX_UPLOAD_SIZE_MB=25
   PORT=3000
   ```

## Run the app

Start the server:

```bash
npm start
```

Open <http://localhost:3000> in your browser, choose a supported audio file, and click **Transcribe audio**.

## Supported audio formats

The upload form and server accept files with these extensions:

- `.flac`
- `.mp3`
- `.mp4`
- `.mpeg`
- `.mpga`
- `.m4a`
- `.ogg`
- `.wav`
- `.webm`

## Development

Run the server with Node's watch mode:

```bash
npm run dev
```

Check the server file for JavaScript syntax errors:

```bash
npm run check
```

## Project structure

```text
.
├── public/
│   ├── index.html
│   └── styles.css
├── uploads/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Notes

- Keep `.env` out of version control. It is ignored by `.gitignore`.
- Uploaded files are saved temporarily under `uploads/` and deleted after the OpenAI transcription request finishes.
- The default transcription model is `gpt-4o-mini-transcribe`; you can override it with `OPENAI_TRANSCRIPTION_MODEL`.
