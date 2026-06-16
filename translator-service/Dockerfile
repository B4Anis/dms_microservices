FROM python:3.10-slim

WORKDIR /app

# Required for confluent-kafka compilation
RUN apt-get update && \
    apt-get install -y build-essential librdkafka-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["python", "-u", "main.py"]
