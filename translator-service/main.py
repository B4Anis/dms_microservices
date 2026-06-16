import os
import json
import logging
import requests
from confluent_kafka import Consumer, Producer
import google.generativeai as genai

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'kafka:29092')
IN_TOPIC = 'dms.documents.uploaded'
OUT_TOPIC = 'dms.documents.translated'
GROUP_ID = 'translator-service'

def configure_gemini():
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key or api_key == 'YOUR_GEMINI_KEY_HERE':
        logger.warning("GEMINI_API_KEY is missing or is set to the placeholder.")
    genai.configure(api_key=api_key)

def translate_content(text):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"Translate the following text into French, Arabic, and Spanish. Return ONLY a valid JSON object with the keys 'french', 'arabic', and 'spanish'. Text to translate: {text}"
        response = model.generate_content(prompt)
        
        result = response.text.strip()
        if result.startswith("```json"):
            result = result[7:-3].strip()
        elif result.startswith("```"):
            result = result[3:-3].strip()
            
        return json.loads(result)
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        return {"french": "Error", "arabic": "Error", "spanish": "Error"}

def main():
    configure_gemini()
    
    consumer_conf = {
        'bootstrap.servers': KAFKA_BROKER,
        'group.id': GROUP_ID,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    }
    
    producer_conf = {
        'bootstrap.servers': KAFKA_BROKER
    }
    
    consumer = Consumer(consumer_conf)
    producer = Producer(producer_conf)
    
    consumer.subscribe([IN_TOPIC])
    
    logger.info("Translator service started, polling for messages...")
    
    try:
        while True:
            msg = consumer.poll(1.0)
            
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error: {msg.error()}")
                continue
                
            try:
                val = msg.value().decode('utf-8')
                data = json.loads(val)
                doc_id = data.get('docId')
                title = data.get('title')
                file_url = data.get('fileUrl')
                
                logger.info(f"Received document: {doc_id} - {title}")
                
                content_to_translate = title
                
                # Attempt to fetch content if it's a text file
                if file_url:
                    try:
                        # Convert host to docker service name since the pre-signed URL is generated for localhost
                        fetch_url = file_url.replace('http://localhost:9000', 'http://minio:9000')
                        resp = requests.get(fetch_url, timeout=5)
                        if resp.status_code == 200:
                            content_type = resp.headers.get('Content-Type', '')
                            if 'text/plain' in content_type:
                                content_to_translate = resp.text
                            else:
                                logger.info(f"File is not plain text ({content_type}), falling back to title translation.")
                        else:
                            logger.warning(f"Failed to fetch {file_url}, status: {resp.status_code}")
                    except Exception as e:
                        logger.error(f"Error fetching file: {e}")
                        
                # Invoke Gemini
                translations = translate_content(content_to_translate)
                
                out_payload = {
                    "docId": doc_id,
                    "translations": translations
                }
                
                # Produce translated event
                producer.produce(
                    OUT_TOPIC,
                    key=str(doc_id).encode('utf-8'),
                    value=json.dumps(out_payload).encode('utf-8')
                )
                producer.flush()
                
                # Manually commit offset after success
                consumer.commit(msg)
                logger.info(f"Successfully translated and committed docId: {doc_id}")
                
            except json.JSONDecodeError:
                logger.error(f"Failed to decode JSON payload: {val}")
                consumer.commit(msg) # Commit poison pill to advance offset
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                # We do NOT commit here, forcing a retry on the next poll
    except KeyboardInterrupt:
        logger.info("Shutting down gracefully...")
    finally:
        consumer.close()

if __name__ == '__main__':
    main()
