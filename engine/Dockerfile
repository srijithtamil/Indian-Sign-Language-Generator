FROM python:3.10-slim

# Install system dependencies required by OpenCV and SQLite
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set up non-root user (recommended for Hugging Face Spaces UID 1000)
RUN useradd -m -u 1000 user && \
    mkdir -p /app && \
    chown -R user:user /app

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

# Install python dependencies (CPU-optimized PyTorch and headless OpenCV)
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy engine files
COPY --chown=user:user . .

# Expose Port 7860 (Hugging Face Spaces default)
EXPOSE 7860

USER user

# Launch the Deep Learning Engine
CMD ["python", "app.py"]
