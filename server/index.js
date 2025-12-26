const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// Simple CORS support so the frontend (localhost:8080) can call the API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Resolve PDF_DIR in a way that works both for local dev (server/ index.js)
// and for the Docker image where server files are copied to /app.
const candidateDirs = [
  path.join(__dirname, '..', 'src', 'assets', 'pdfs'),
  path.join(__dirname, 'src', 'assets', 'pdfs'),
  path.join(process.cwd(), 'src', 'assets', 'pdfs')
];
let PDF_DIR = candidateDirs.find((d) => fs.existsSync(d));
if (!PDF_DIR) {
  // fallback to first candidate (will likely error later if missing)
  PDF_DIR = candidateDirs[0];
}
console.log('PDF_DIR resolved to', PDF_DIR);

function getEnvOrFail(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

app.post('/send-email', async (req, res) => {
  try {
    const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
    console.log('send-email called, attachments=', attachments);
    console.log('PDF_DIR=', PDF_DIR);

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true';
    const from = process.env.EMAIL_FROM || user;
    const to = req.body.to || process.env.DEFAULT_RECIPIENT || process.env.EMAIL_TO;

    if (!host || !user || !pass) {
      return res.status(500).json({ error: 'SMTP creds not configured on server.' });
    }
    if (!to) {
      return res.status(400).json({ error: 'No recipient configured. Set DEFAULT_RECIPIENT or provide EMAIL_TO.' });
    }

    const files = [];

    async function generatePdfIfNeeded(safeName, destPath, text) {
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument();
          const stream = fs.createWriteStream(destPath);
          doc.pipe(stream);
          doc.fontSize(20).text(text || 'Kellemes ünnepeket!', 50, 80);
          doc.moveDown();
          doc.fontSize(12).text('Ez az automatikusan generált ajándék PDF.', { align: 'left' });
          doc.end();
          stream.on('finish', () => resolve(true));
          stream.on('error', (e) => reject(e));
        } catch (e) {
          reject(e);
        }
      });
    }

    for (const a of attachments) {
      const safe = path.basename(a);
      const p = path.join(PDF_DIR, safe);
      console.log('Checking file', p, 'exists=', fs.existsSync(p));
      if (fs.existsSync(p)) {
        const st = fs.statSync(p);
        if (st.size < 1000) {
          // generate a replacement PDF into a temp file
          const tmp = path.join(os.tmpdir(), `gen-${safe}`);
          await generatePdfIfNeeded(safe, tmp, req.body.text || 'Boldog Karácsonyt!');
          files.push({ filename: safe, path: tmp });
          continue;
        }
        files.push({ filename: safe, path: p });
        continue;
      }
      // file doesn't exist — generate into temp and attach
      const tmp = path.join(os.tmpdir(), `gen-${safe}`);
      await generatePdfIfNeeded(safe, tmp, req.body.text || 'Boldog Karácsonyt!');
      files.push({ filename: safe, path: tmp });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject: req.body.subject || 'Karácsonyi meglepetés',
      text: req.body.text || 'Küldöm a kért pdf-et.',
      html: req.body.html || `<p>${(req.body.text || 'Küldöm a kért pdf-et.')}</p>`,
      attachments: files
    });

    res.json({ ok: true, info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Email API listening on ${port}`));
