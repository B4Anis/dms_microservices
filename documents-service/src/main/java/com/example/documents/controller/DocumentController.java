package com.example.documents.controller;

import com.example.documents.entity.Document;
import com.example.documents.security.JwtClaimsPrincipal;
import com.example.documents.service.DocumentService;
import com.example.documents.service.S3StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService service;
    private final S3StorageService storageService;

    public DocumentController(DocumentService service, S3StorageService storageService) {
        this.service = service;
        this.storageService = storageService;
    }

    private JwtClaimsPrincipal currentPrincipal() {
        return (JwtClaimsPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<Document>> getDocuments(
            @RequestParam(required = false) String title) {

        JwtClaimsPrincipal principal = currentPrincipal();
        String departmentId = principal.getDepartmentId();

        if (title != null && !title.isEmpty()) {
            return ResponseEntity.ok(service.searchDocumentsByDepartment(title, departmentId));
        }
        return ResponseEntity.ok(service.getDocumentsByDepartment(departmentId));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Document> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title) {

        // Owner and department come exclusively from the verified JWT — never from the request body.
        JwtClaimsPrincipal principal = currentPrincipal();
        String owner        = principal.getEmail();
        String departmentId = principal.getDepartmentId();

        try {
            String fileKey     = storageService.uploadFile(file);
            String presignedUrl = storageService.getPresignedUrl(fileKey);

            Document saved = service.uploadDocument(
                    title, owner, departmentId,
                    file.getContentType(), file.getSize(), presignedUrl);

            return ResponseEntity
                    .created(URI.create("/api/documents/" + saved.getId()))
                    .body(saved);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(@PathVariable Long id) {
        Document doc = service.getDocument(id);
        if (doc == null) return ResponseEntity.notFound().build();

        // Users may only access documents within their department (admins see all).
        JwtClaimsPrincipal principal = currentPrincipal();
        String departmentId = principal.getDepartmentId();
        boolean isAdmin = "admin".equalsIgnoreCase(principal.getRole());
        if (!isAdmin && departmentId != null && !departmentId.trim().isEmpty() && !departmentId.equals(doc.getDepartmentId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(doc);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Document> updateDocument(@PathVariable Long id, @RequestBody Document patch) {
        Document updated = service.updateDocument(id, patch);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        service.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Document> incrementView(@PathVariable Long id) {
        Document doc = service.incrementViewCount(id);
        return doc != null ? ResponseEntity.ok(doc) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/download")
    public ResponseEntity<Document> incrementDownload(@PathVariable Long id) {
        Document doc = service.incrementDownloadCount(id);
        return doc != null ? ResponseEntity.ok(doc) : ResponseEntity.notFound().build();
    }
}
