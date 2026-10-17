"""
tts_server.py — VidPulse local backend
Runs on http://localhost:5050
POST /generate-video  →  streams back an MP4

Requirements:
    pip install flask flask-cors edge-tts moviepy Pillow numpy
"""

import asyncio
import io
import os
import tempfile
import textwrap
import re

import edge_tts
import numpy as np
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from moviepy.editor import (
    AudioFileClip,
    ColorClip,
    CompositeVideoClip,
    TextClip,
    concatenate_videoclips,
)
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)
CORS(app)  # allow requests from your Next.js dev server / Vercel preview

# ── helpers ──────────────────────────────────────────────────────────────────

STAGE_PATTERN = re.compile(
    r"\[.*?\]|#{1,6}\s.*|(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|[^\x00-\x7F]",
    re.DOTALL,
)


def clean_script(text: str) -> str:
    """Strip stage directions, markdown and emoji so TTS reads cleanly."""
    text = STAGE_PATTERN.sub("", text)
    # collapse whitespace
    return re.sub(r"\s+", " ", text).strip()


async def _tts(text: str, voice: str, out_path: str) -> None:
    """Generate an MP3 file from text using Edge TTS."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)


def generate_video(
    text: str,
    voice: str,
    auto_clean: bool = True,
    text_overlay: bool = True,
    hd: bool = False,
) -> bytes:
    """
    1. Optionally clean the script.
    2. Generate voiceover with Edge TTS → temp MP3.
    3. Build a video clip whose length matches the audio.
    4. Optionally burn a text overlay.
    5. Encode to MP4 and return bytes.
    """
    script = clean_script(text) if auto_clean else text.strip()
    if not script:
        raise ValueError("Script is empty after cleaning.")

    width, height = (1920, 1080) if hd else (1280, 720)

    with tempfile.TemporaryDirectory() as tmp:
        mp3_path = os.path.join(tmp, "voice.mp3")
        mp4_path = os.path.join(tmp, "output.mp4")

        # ── TTS ──
        asyncio.run(_tts(script, voice, mp3_path))
        audio = AudioFileClip(mp3_path)
        duration = audio.duration

        # ── Background ──
        bg = ColorClip(size=(width, height), color=(10, 10, 15), duration=duration)

        clips = [bg]

        # ── Text overlay ──
        if text_overlay:
            # wrap script to ~60 chars per line
            wrapped = "\n".join(textwrap.wrap(script[:400], 60))
            txt = TextClip(
                wrapped,
                fontsize=32 if hd else 24,
                color="white",
                font="DejaVu-Sans",
                method="caption",
                size=(width - 120, None),
                align="West",
            ).set_position(("center", "center")).set_duration(duration)
            clips.append(txt)

        video = CompositeVideoClip(clips).set_audio(audio)
        video.write_videofile(
            mp4_path,
            fps=24,
            codec="libx264",
            audio_codec="aac",
            logger=None,        # suppress moviepy console spam
            threads=2,
        )

        with open(mp4_path, "rb") as f:
            return f.read()


# ── routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def index():
    return jsonify({"status": "VidPulse TTS server running", "port": 5050})


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.post("/generate-video")
def generate():
    body = request.get_json(silent=True) or {}

    text = body.get("text", "").strip()
    voice = body.get("voice", "en-GB-RyanNeural")
    auto_clean = bool(body.get("auto_clean", True))
    text_overlay = bool(body.get("text_overlay", True))
    hd = bool(body.get("hd", False))

    if not text:
        return jsonify({"error": "No script text provided."}), 400

    try:
        mp4_bytes = generate_video(text, voice, auto_clean, text_overlay, hd)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Video generation failed")
        return jsonify({"error": f"Generation failed: {exc}"}), 500

    return send_file(
        io.BytesIO(mp4_bytes),
        mimetype="video/mp4",
        as_attachment=False,
        download_name="vidpulse.mp4",
    )


# ── entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🎬  VidPulse TTS server starting on http://localhost:5050")
    app.run(host="0.0.0.0", port=5050, debug=False)
