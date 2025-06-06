# Start from lightweight Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install required packages (curl, git, pip packages)
RUN apt-get update && apt-get install -y \
    curl \
    git \
 && rm -rf /var/lib/apt/lists/*

# Install Aider (code assistant)
RUN curl -LsSf https://aider.chat/install.sh | sh

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the FastAPI app port (you can change if needed)
EXPOSE 8000

# Default command to run app
CMD ["uvicorn", "rag:app", "--host", "0.0.0.0", "--port", "8000"]