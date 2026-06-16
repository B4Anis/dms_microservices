package com.example.documents.events;

public class DocumentUploadedEvent {
    private String docId;
    private String title;
    private String fileUrl;

    public DocumentUploadedEvent() {}

    public DocumentUploadedEvent(String docId, String title, String fileUrl) {
        this.docId = docId;
        this.title = title;
        this.fileUrl = fileUrl;
    }

    public String getDocId() { return docId; }
    public void setDocId(String docId) { this.docId = docId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
}
