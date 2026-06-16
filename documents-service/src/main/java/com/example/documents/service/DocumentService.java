package com.example.documents.service;

import com.example.documents.entity.Document;
import com.example.documents.events.DocumentUploadedEvent;
import com.example.documents.repository.DocumentRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DocumentService {

    private final DocumentRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public DocumentService(DocumentRepository repository, KafkaTemplate<String, Object> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    public List<Document> getAllDocuments() {
        return repository.findAll();
    }

    public List<Document> searchDocuments(String title) {
        return repository.findByTitleContainingIgnoreCase(title);
    }

    /** Returns only documents belonging to the given department. Null/blank departmentId returns all (admin path). */
    public List<Document> getDocumentsByDepartment(String departmentId) {
        if (departmentId == null || departmentId.trim().isEmpty()) {
            return repository.findAll();
        }
        return repository.findByDepartmentId(departmentId);
    }

    /** Scoped title search: restricts results to the caller's department (or all if no department). */
    public List<Document> searchDocumentsByDepartment(String title, String departmentId) {
        if (departmentId == null || departmentId.trim().isEmpty()) {
            return repository.findByTitleContainingIgnoreCase(title);
        }
        return repository.findByTitleContainingIgnoreCaseAndDepartmentId(title, departmentId);
    }

    /**
     * Uploads a document. The owner and departmentId are taken from the JWT claims
     * passed in by the controller — never from the request body.
     */
    public Document uploadDocument(String title, String owner, String departmentId,
                                   String contentType, Long fileSizeBytes, String fileUrl) {
        Document doc = new Document();
        doc.setTitle(title);
        doc.setOwner(owner);
        doc.setDepartmentId(departmentId);
        doc.setCreatedAt(LocalDate.now());
        doc.setFileUrl(fileUrl);
        Document saved = repository.save(doc);

        DocumentUploadedEvent event = new DocumentUploadedEvent(
                saved.getId().toString(),
                saved.getTitle(),
                saved.getFileUrl()
        );
        kafkaTemplate.send("dms.documents.uploaded", saved.getId().toString(), event);

        return saved;
    }

    @Cacheable(value = "documents", key = "#id")
    public Document getDocument(Long id) {
        return repository.findById(id).orElse(null);
    }

    @CacheEvict(value = "documents", key = "#id")
    public void applyTranslations(Long id, String fr, String ar, String es) {
        repository.findById(id).ifPresent(doc -> {
            doc.setTranslatedContentFr(fr);
            doc.setTranslatedContentAr(ar);
            doc.setTranslatedContentEs(es);
            repository.save(doc);
        });
    }

    @CacheEvict(value = "documents", key = "#id")
    public void deleteDocument(Long id) {
        repository.deleteById(id);
    }

    @CacheEvict(value = "documents", key = "#id")
    public Document updateDocument(Long id, Document patch) {
        Document doc = repository.findById(id).orElse(null);
        if (doc == null) return null;
        if (patch.getTitle() != null) doc.setTitle(patch.getTitle());
        if (patch.getOwner() != null) doc.setOwner(patch.getOwner());
        if (patch.getFileUrl() != null) doc.setFileUrl(patch.getFileUrl());
        if (patch.getDepartmentId() != null) doc.setDepartmentId(patch.getDepartmentId());
        if (patch.getViewCount() != null) doc.setViewCount(patch.getViewCount());
        if (patch.getDownloadCount() != null) doc.setDownloadCount(patch.getDownloadCount());
        return repository.save(doc);
    }

    @CacheEvict(value = "documents", key = "#id")
    public Document incrementViewCount(Long id) {
        Document doc = repository.findById(id).orElse(null);
        if (doc == null) return null;
        doc.setViewCount((doc.getViewCount() == null ? 0L : doc.getViewCount()) + 1);
        return repository.save(doc);
    }

    @CacheEvict(value = "documents", key = "#id")
    public Document incrementDownloadCount(Long id) {
        Document doc = repository.findById(id).orElse(null);
        if (doc == null) return null;
        doc.setDownloadCount((doc.getDownloadCount() == null ? 0L : doc.getDownloadCount()) + 1);
        return repository.save(doc);
    }
}
