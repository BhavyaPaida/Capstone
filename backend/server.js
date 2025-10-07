const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Basic route for testing
app.get("/", (req, res) => {
  res.send("InterviewBot Backend Running!");
});

// ✅ New route: generate interview questions dynamically
app.post("/api/generate-questions", (req, res) => {
  const { resume_text, jd_text } = req.body;

  // Spawn Python process
  const python = spawn("python", ["questions_gen.py"]);

  let dataToSend = "";
  let errorData = "";

  // Send data to Python
  python.stdin.write(JSON.stringify({ resume_text, jd_text }));
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
