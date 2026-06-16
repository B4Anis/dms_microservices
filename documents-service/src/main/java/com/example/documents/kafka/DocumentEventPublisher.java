package com.example.documents.kafka;

import com.example.documents.events.DocumentUploadedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;
import org.springframework.util.concurrent.ListenableFutureCallback;

@Component
public class DocumentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(DocumentEventPublisher.class);

    private final KafkaTemplate<String, DocumentUploadedEvent> kafkaTemplate;
    private final String topic;

    public DocumentEventPublisher(
            KafkaTemplate<String, DocumentUploadedEvent> kafkaTemplate,
            @Value("${app.kafka.topic.documents-uploaded}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic         = topic;
    }

    public void publishDocumentUploaded(DocumentUploadedEvent event) {
        // Key = documentId: all events for the same document go to the same partition.
        String key = event.getDocId();
        kafkaTemplate.send(topic, key, event)
                .addCallback(new ListenableFutureCallback<SendResult<String, DocumentUploadedEvent>>() {
                    @Override
                    public void onSuccess(SendResult<String, DocumentUploadedEvent> result) {
                        log.info("DocumentUploaded published: documentId={} partition={} offset={}",
                                event.getDocId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }

                    @Override
                    public void onFailure(Throwable ex) {
                        log.error("Failed to publish DocumentUploaded for documentId={}: {}",
                                event.getDocId(), ex.getMessage(), ex);
                    }
                });
    }
}
