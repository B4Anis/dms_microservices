package com.example.documents.events;

import java.util.Map;

public class DocumentTranslatedEvent {
    private String docId;
    private Map<String, String> translations;

    public DocumentTranslatedEvent() {}

    public String getDocId() { return docId; }
    public void setDocId(String docId) { this.docId = docId; }

    public Map<String, String> getTranslations() { return translations; }
    public void setTranslations(Map<String, String> translations) { this.translations = translations; }
}
