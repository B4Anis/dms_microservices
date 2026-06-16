package com.example.documents.service;

import com.example.documents.events.DocumentTranslatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class TranslationConsumerService {

    private static final Logger log = LoggerFactory.getLogger(TranslationConsumerService.class);
    private final DocumentService documentService;

    public TranslationConsumerService(DocumentService documentService) {
        this.documentService = documentService;
    }

    @KafkaListener(topics = "dms.documents.translated", groupId = "documents-service")
    public void consumeTranslation(DocumentTranslatedEvent event) {
        log.info("Received translation for docId: {}", event.getDocId());
        try {
            Long id = Long.valueOf(event.getDocId());
            Map<String, String> translations = event.getTranslations();
            if (translations != null) {
                documentService.applyTranslations(
                        id,
                        translations.get("french"),
                        translations.get("arabic"),
                        translations.get("spanish")
                );
                log.info("Successfully updated document {} with translations.", id);
            }
        } catch (NumberFormatException e) {
            log.error("Invalid docId format: {}", event.getDocId(), e);
        } catch (Exception e) {
            log.error("Error processing translation event for docId: {}", event.getDocId(), e);
        }
    }
}
