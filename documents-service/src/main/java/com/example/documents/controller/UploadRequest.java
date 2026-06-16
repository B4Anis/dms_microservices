package com.example.documents.controller;

public class UploadRequest {
    private String title;
    private String owner;
    private String contentType;
    private Long   fileSizeBytes;

    public String getTitle()         { return title; }
    public String getOwner()         { return owner; }
    public String getContentType()   { return contentType; }
    public Long   getFileSizeBytes() { return fileSizeBytes; }

    public void setTitle(String title)               { this.title = title; }
    public void setOwner(String owner)               { this.owner = owner; }
    public void setContentType(String contentType)   { this.contentType = contentType; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
}
