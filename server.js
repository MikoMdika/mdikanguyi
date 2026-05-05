import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '.env'));

const app = express();
const port = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');
const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 25);

const allowedExtensions = new Set(['.flac', '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.ogg', '.wav', '.webm']);
const allowedMimePrefixes = ['audio/', 'video/mp4', 'video/webm'];

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hasAllowedExtension = allowedExtensions.has(ext);
    const hasAllowedMimeType = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix));

    if (!hasAllowedExtension || !hasAllowedMimeType) {
      cb(new Error('Please upload a supported audio file: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.'));
      return;
    }

    cb(null, true);
  },
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'Please choose an audio file to transcribe.' });
    return;
  }

  const model = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe';
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model,
    });

    res.json({
      filename: req.file.originalname,
      model,
      text: transcription.text ?? '',
    });
  } catch (error) {
    next(error);
  } finally {
    fs.promises.unlink(req.file.path).catch(() => {});
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `File is too large. Maximum size is ${maxUploadSizeMb} MB.`
      : error.message;
    res.status(400).json({ error: message });
    return;
  }

  res.status(500).json({
    error: error.message || 'Something went wrong while transcribing your file.',
  });
});

app.listen(port, () => {
  console.log(`Audio transcription app listening at http://localhost:${port}`);
});
