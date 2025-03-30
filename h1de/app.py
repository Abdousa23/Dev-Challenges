import os
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
from typing import Optional
import io


app = FastAPI(title="AI Steganography API", version="1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
encoder = NeuralEncoder()
forensic = AntiForensic()

# Temporary storage (replace with proper storage in production)
TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

def clean_temp_files():
    """Clean up temporary files older than 1 hour"""
    # Implementation left for production deployment

@app.on_event("startup")
async def startup_event():
    # Initialize models and other resources
    pass

@app.post("/encode", summary="Hide message in image")
async def encode_message(
    image: UploadFile = File(..., description="Cover image (PNG/JPG)"),
    message: str = "Secret message",
    security_level: int = 1,
):
    try:
        # Validate input
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "Invalid file type")

        # Generate unique operation ID
        operation_id = str(uuid.uuid4())
        
        # Process image
        img_data = await image.read()
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        img_array = np.array(img)

        # Encode message
        encoded_img = encoder.encode(img_array, message)
        
        # Apply security level
        if security_level > 1:
            encoded_img = forensic.add_cover_noise(encoded_img)

        # Save result
        output_path = os.path.join(TEMP_DIR, f"{operation_id}.png")
        Image.fromarray(encoded_img).save(output_path)

        return {
            "status": "success",
            "operation_id": operation_id,
            "download_url": f"/download/{operation_id}"
        }

    except Exception as e:
        raise HTTPException(500, f"Encoding failed: {str(e)}")

@app.post("/decode", summary="Extract message from image")
async def decode_message(
    image: UploadFile = File(..., description="Image with hidden message"),
    security_level: int = 1,
):
    try:
        # Validate input
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "Invalid file type")

        # Process image
        img_data = await image.read()
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        img_array = np.array(img)

        # Decode message
        decoded_message = encoder.decode(img_array)
        
        return {
            "status": "success",
            "message": decoded_message,
            "security_level": security_level
        }

    except Exception as e:
        raise HTTPException(500, f"Decoding failed: {str(e)}")

@app.get("/download/{operation_id}", include_in_schema=False)
async def download_file(operation_id: str):
    file_path = os.path.join(TEMP_DIR, f"{operation_id}.png")
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    return FileResponse(file_path, media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)