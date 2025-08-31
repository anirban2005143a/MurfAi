# app.py
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv

load_dotenv()

# Read from .env and split into list
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

app = FastAPI()

# Allow React frontend to talk to FastAPI
app.add_middleware(
     CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy function that processes frames
def process_frames(frames: List[bytes]) -> str:
    # Here you can use your model logic
    print(f"Received {len(frames)} frames")
    return "Processed frames into text"

@app.post("/process-frames/")
async def process_frames_endpoint(files: List[UploadFile] = File(...)):
    frames = [await file.read() for file in files]  # read all frames in memory
    result = process_frames(frames)
    return {"text": result}
