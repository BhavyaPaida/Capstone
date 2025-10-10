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

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));