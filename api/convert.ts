// /api/convert.ts

import { VercelRequest, VercelResponse } from "@vercel/node";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    if (!body || !body.videoData) {
      return res.status(400).json({ error: "No video data provided" });
    }

    // Generate unique filenames
    const uniqueId = uuidv4();
    const inputPath = path.join(os.tmpdir(), `input-${uniqueId}.webm`);
    const outputPath = path.join(os.tmpdir(), `output-${uniqueId}.mp4`);

    // Write input file
    const videoBuffer = Buffer.from(body.videoData.split(",")[1], "base64");
    await fs.promises.writeFile(inputPath, videoBuffer);

    // Convert to MP4 using ffmpeg with lower quality settings
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-c:v libx264", // video codec
          "-preset ultrafast", // fastest encoding
          "-crf 28", // lower quality (23 is default, higher number = lower quality)
          "-c:a aac", // audio codec
          "-b:a 128k", // reduced audio bitrate
          "-ac 2", // 2 audio channels
          "-r 24", // lower framerate
          "-vf scale='min(1280,iw):-2'", // limit width to 720p
          "-movflags +faststart", // web playback optimization
          "-y", // overwrite output file
        ])
        .toFormat("mp4")
        .on("end", () => resolve(null))
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    // Read the output file
    const outputBuffer = await fs.promises.readFile(outputPath);

    // Clean up temporary files
    await Promise.all([
      fs.promises.unlink(inputPath),
      fs.promises.unlink(outputPath),
    ]).catch(console.error);

    // Set appropriate headers and send the file
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "attachment; filename=converted.mp4");
    res.send(outputBuffer);
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({ error: "Failed to convert video" });
  }
}
