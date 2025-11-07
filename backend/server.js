const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, DOC, DOCX, and TXT files are allowed"));
  },
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ✅ Basic route for testing
app.get("/", (req, res) => {
  res.send("InterviewBot Backend Running!");
});

// ✅ NEW: File upload and question generation endpoint
app.post("/api/analyze-resume", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "jobDescription", maxCount: 1 }
]), (req, res) => {
  try {
    const resumeFile = req.files?.resume?.[0];
    const jdFile = req.files?.jobDescription?.[0];
    const jdText = req.body.jobText || "";

    if (!resumeFile) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    if (!jdFile && !jdText) {
      return res.status(400).json({ error: "Job description file or text is required" });
    }

    // Spawn Python process to extract text and generate questions
    const python = spawn("python", ["process_and_generate.py"]);

    let dataToSend = "";
    let errorData = "";

    // Send file paths and text to Python
    const inputData = {
      resume_path: resumeFile.path,
      jd_path: jdFile ? jdFile.path : null,
      jd_text: jdText
    };

    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();

    // Collect output
    python.stdout.on("data", (data) => {
      dataToSend += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    // When process ends
    python.on("close", (code) => {
      // Clean up uploaded files
      if (resumeFile) fs.unlinkSync(resumeFile.path);
      if (jdFile) fs.unlinkSync(jdFile.path);

      if (code !== 0 || errorData) {
        console.error("Python error:", errorData);
        res.status(500).json({ error: "Failed to generate questions", details: errorData });
      } else {
        try {
          const result = JSON.parse(dataToSend);
          res.json(result);
        } catch (e) {
          console.error("Parse error:", e);
          res.status(500).json({ error: "Invalid response from Python script" });
        }
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Original route: generate questions from text (kept for backward compatibility)
app.post("/api/generate-questions", (req, res) => {
  const { resume_text, jd_text } = req.body;

  if (!resume_text || !jd_text) {
    return res.status(400).json({ error: "Both resume_text and jd_text are required" });
  }

  const python = spawn("python", ["question_gen.py"]);

  let dataToSend = "";
  let errorData = "";

  python.stdin.write(JSON.stringify({ resume_text, jd_text }));
  python.stdin.end();

  python.stdout.on("data", (data) => {
    dataToSend += data.toString();
  });

  python.stderr.on("data", (data) => {
    errorData += data.toString();
  });

  python.on("close", (code) => {
    if (code !== 0 || errorData) {
      console.error("Python error:", errorData);
      res.status(500).json({ error: "Failed to generate questions" });
    } else {
      try {
        const result = JSON.parse(dataToSend);
        res.json(result);
      } catch (e) {
        console.error("Parse error:", e);
        res.status(500).json({ error: "Invalid response from Python script" });
      }
    }
  });
});

// ✅ AI Assistant proxy (uses OpenRouter or Hugging Face Inference)
app.post("/api/chat-assistant", async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ success: false, error: "Missing 'question'" });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const grokKey = process.env.GROK_API_KEY; // xAI Grok
    const hfKey = process.env.HF_API_KEY; // optional fallback

    if (!openrouterKey && !grokKey && !hfKey) {
      return res.status(503).json({
        success: false,
        error: "Assistant backend not configured. Set GROK_API_KEY or HF_API_KEY (or OPENROUTER_API_KEY) in .env",
      });
    }

    // Helper: sanitize question length
    const prompt = question.slice(0, 4000);

    // System prompt to guide assistant tone
    const systemPrompt = `You are an experienced interview preparation coach.
Respond with clear, concise, actionable guidance. Prefer bullet points.
Topics may include interview strategies (behavioral, coding, system design),
resume/JD tailoring, mock interview best practices, STAR answers, and how to use the app.`;

    // Try Grok (xAI) first if available
    if (grokKey) {
      try {
        const r = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({
            model: "grok-2-latest",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 500,
          }),
        });

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || `Grok error: ${r.status}`);
        }
        const data = await r.json();
        const answer = data?.choices?.[0]?.message?.content?.trim();
        if (answer) return res.json({ success: true, answer });
      } catch (e) {
        console.error("Grok call failed:", e.message || e);
        // fall through
      }
    }

    // Then try OpenRouter (OpenAI-compatible API)
    if (openrouterKey) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-3.5-turbo",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 500,
          }),
        });

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || `OpenRouter error: ${r.status}`);
        }
        const data = await r.json();
        const answer = data?.choices?.[0]?.message?.content?.trim();
        if (answer) return res.json({ success: true, answer });
      } catch (e) {
        console.error("OpenRouter call failed:", e.message || e);
        // fall through to HF
      }
    }

    // Fallback: Hugging Face Inference API (text-generation)
    if (hfKey) {
      try {
        const r = await fetch(
          "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${hfKey}`,
            },
            body: JSON.stringify({
              inputs: `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`,
              parameters: { max_new_tokens: 300, temperature: 0.4 },
            }),
          }
        );
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || `HF error: ${r.status}`);
        }
        const data = await r.json();
        // HF returns array or object depending on model
        const text = Array.isArray(data)
          ? data[0]?.generated_text
          : data?.generated_text || data?.choices?.[0]?.text;
        if (text) {
          // Try to strip the leading prompt echo if present
          const split = String(text).split("Assistant:");
          const answer = (split[1] || split[0] || "").trim();
          return res.json({ success: true, answer });
        }
        return res.status(502).json({ success: false, error: "Empty response from HF" });
      } catch (e) {
        console.error("HF call failed:", e.message || e);
        return res.status(502).json({ success: false, error: "Assistant provider failed" });
      }
    }

    return res.status(502).json({ success: false, error: "No assistant providers available" });
  } catch (err) {
    console.error("chat-assistant error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));