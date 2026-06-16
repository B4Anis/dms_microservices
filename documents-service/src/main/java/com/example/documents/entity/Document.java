package com.example.documents.entity;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "documents")
public class Document implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "created_at")
    private LocalDate createdAt;

    /** Stores the authenticated user's email set by the JWT filter. */
    private String owner;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "department_id")
    private String departmentId;

    @Column(name = "translated_content_fr", columnDefinition = "TEXT")
    private String translatedContentFr;

    @Column(name = "translated_content_ar", columnDefinition = "TEXT")
    private String translatedContentAr;

    @Column(name = "translated_content_es", columnDefinition = "TEXT")
    private String translatedContentEs;

    @Column(name = "view_count")
    private Long viewCount = 0L;

    @Column(name = "download_count")
    private Long downloadCount = 0L;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getTranslatedContentFr() { return translatedContentFr; }
    public void setTranslatedContentFr(String translatedContentFr) { this.translatedContentFr = translatedContentFr; }
    public String getTranslatedContentAr() { return translatedContentAr; }
    public void setTranslatedContentAr(String translatedContentAr) { this.translatedContentAr = translatedContentAr; }
    public String getTranslatedContentEs() { return translatedContentEs; }
    public void setTranslatedContentEs(String translatedContentEs) { this.translatedContentEs = translatedContentEs; }
    public Long getViewCount() { return viewCount; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }
    public Long getDownloadCount() { return downloadCount; }
    public void setDownloadCount(Long downloadCount) { this.downloadCount = downloadCount; }
}
