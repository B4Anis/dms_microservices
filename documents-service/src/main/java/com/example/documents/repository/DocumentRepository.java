package com.example.documents.repository;

import com.example.documents.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByTitleContainingIgnoreCase(String title);
    List<Document> findByDepartmentId(String departmentId);
    List<Document> findByTitleContainingIgnoreCaseAndDepartmentId(String title, String departmentId);
}
