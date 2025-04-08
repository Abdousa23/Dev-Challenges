import os
import uuid
import time
from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
from typing import Optional
import io
import asyncio

app = FastAPI(title="main", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Encoder:
    def encode(self, image_array: np.ndarray, message: str) -> np.ndarray:
        """Hide a message in the least significant bits of an image"""
        binary_message = ''.join(format(ord(char), '08b') for char in message)
        binary_message += '00000000'
        
        flat_image = image_array.flatten()
        if len(binary_message) > len(flat_image):
            raise ValueError("Message is too large for this image")
        
        encoded_image = image_array.copy()
        flat_encoded = encoded_image.flatten()
        
        for i, bit in enumerate(binary_message):
            flat_encoded[i] = flat_encoded[i] & ~1
            flat_encoded[i] = flat_encoded[i] | int(bit)
        return flat_encoded.reshape(image_array.shape)
    
    def decode(self, image_array: np.ndarray) -> str:
        """Extract a hidden message from the least significant bits of an image"""
        flat_image = image_array.flatten()
        
        binary_message = ''
        for i in range(len(flat_image)):
            binary_message += str(flat_image[i] & 1)
            
            if len(binary_message) >= 8 and binary_message[-8:] == '00000000':
                break
        
        decoded_message = ''
        for i in range(0, len(binary_message) - 8, 8):
            byte = binary_message[i:i+8]
            if byte == '00000000':  
                break
            decoded_message += chr(int(byte, 2))
        
        return decoded_message

class Forensic:
    def add_cover_noise(self, image_array: np.ndarray) -> np.ndarray:
        """Add subtle noise to make steganography harder to detect"""
        noisy_image = image_array.copy()
        
        height, width, channels = noisy_image.shape
        
        mask = np.random.choice([0, 1], size=(height, width, channels), p=[0.9, 0.1])
        noise = np.random.choice([-2, 2], size=(height, width, channels))
        
        for i in range(height):
            for j in range(width):
                for k in range(channels):
                    if mask[i, j, k] == 1:
                        lsb = noisy_image[i, j, k] & 1
                        noisy_image[i, j, k] += noise[i, j, k]
                        if (noisy_image[i, j, k] & 1) != lsb:
                            noisy_image[i, j, k] = (noisy_image[i, j, k] & ~1) | lsb
                        
                        noisy_image[i, j, k] = max(0, min(255, noisy_image[i, j, k]))
        
        return noisy_image

encoder = Encoder()
forensic = Forensic()

TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

def clean_temp_files():
    """Clean up temporary files older than 1 hour"""
    current_time = datetime.now()
    for filename in os.listdir(TEMP_DIR):
        file_path = os.path.join(TEMP_DIR, filename)
        file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
        if current_time - file_modified > timedelta(hours=1):
            try:
                os.remove(file_path)
                print(f"Removed old file: {file_path}")
            except Exception as e:
                print(f"Error while deleting file {file_path}: {e}")

@app.on_event("startup")
async def startup_event():
    """Initialize resources on server startup"""
    print("Starting steganography API server...")
    clean_temp_files()
    
    asyncio.create_task(periodic_cleanup())

async def periodic_cleanup():
    """Periodically clean up old files"""
    while True:
        await asyncio.sleep(3600)
        clean_temp_files()

@app.post("/encode", summary="Hide message in image")
async def encode_message(
    image: UploadFile = File(..., description="Cover image (PNG/JPG)"),
    message: str = "Secret message",
    security_level: int = 1,
):
    try:
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "Invalid file type")
        
        operation_id = str(uuid.uuid4())

        img_data = await image.read()
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        img_array = np.array(img)

        encoded_img = encoder.encode(img_array, message)
        
        if security_level > 1:
            encoded_img = forensic.add_cover_noise(encoded_img)

        output_path = os.path.join(TEMP_DIR, f"{operation_id}.png")
        Image.fromarray(encoded_img.astype('uint8')).save(output_path)

        return {
            "status": "success",
            "operation_id": operation_id,
            "download_url": f"/download/{operation_id}",
            "message_length": len(message),
            "security_level": security_level
        }

    except ValueError as e:
        raise HTTPException(400, f"Encoding failed: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Encoding failed: {str(e)}")

@app.post("/decode", summary="Extract message from image")
async def decode_message(
    image: UploadFile = File(..., description="Image with hidden message"),
    security_level: int = 1,
):
    try:
        if not image.content_type.startswith('image/'):
            raise HTTPException(400, "Invalid file type")

        img_data = await image.read()
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        img_array = np.array(img)

        decoded_message = encoder.decode(img_array)
        
        if not decoded_message:
            return {
                "status": "warning",
                "message": "",
                "info": "No hidden message detected or message format is invalid"
            }
        
        return {
            "status": "success",
            "message": decoded_message,
            "message_length": len(decoded_message),
            "security_level": security_level
        }

    except Exception as e:
        raise HTTPException(500, f"Decoding failed: {str(e)}")

@app.get("/download/{operation_id}", include_in_schema=False)
async def download_file(operation_id: str):
    """Download an encoded image file"""
    file_path = os.path.join(TEMP_DIR, f"{operation_id}.png")
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    return FileResponse(file_path, media_type="image/png", filename="encoded_image.png")

@app.get("/health", summary="Check API health")
async def health_check():
    """Health check endpoint"""
    return {"status": "alive", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)