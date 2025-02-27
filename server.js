import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

const app = express();

app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

const apiKey = "BtRT2s5y7sCJFnbspQ74zwS8"; // remove.bg API Key

async function removeBg(imagePath) {
  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("image_file", fs.createReadStream(imagePath));

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return await response.arrayBuffer();
}

// endpoint
app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    const imagePath = req.file.path; // Use uploaded file name dynamically
    console.log("Processing file:", imagePath);

    const rbgResultData = await removeBg(imagePath);
    const outputPath = `uploads/no-bg-${req.file.filename}.png`; // Unique output file

    fs.writeFileSync(outputPath, Buffer.from(rbgResultData));
    fs.unlinkSync(imagePath); // Delete uploaded file after processing

    res.set("Content-Type", "image/png");
    res.sendFile(outputPath, { root: "." }); // Send processed image
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .json({ error: "Background removal failed", details: error.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));

