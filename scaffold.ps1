$ErrorActionPreference = 'Stop'

function Write-File {
    param([string]$Path, [string]$Content)
    $Dir = Split-Path $Path
    if (-not (Test-Path $Dir)) {
        New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    }
    Set-Content -Path $Path -Value $Content
}

$pomTemplate = @"
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>2.7.18</version>
		<relativePath/>
	</parent>
	<groupId>com.example</groupId>
	<artifactId>{0}</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>{0}</name>
	<properties>
		<java.version>1.8</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.postgresql</groupId>
			<artifactId>postgresql</artifactId>
			<scope>runtime</scope>
		</dependency>
	</dependencies>
	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>
	</build>
</project>
"@

# --- Documents Service ---
$docsDir = "documents-service"
$docsPkg = "$docsDir/src/main/java/com/example/documents"

Write-File "$docsDir/pom.xml" ($pomTemplate -f "documents-service")

Write-File "$docsDir/src/main/resources/application.yml" @"
server:
  port: 8080
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/dms
    username: admin
    password: admin
  jpa:
    hibernate:
      ddl-auto: none
"@

Write-File "$docsPkg/DocumentsApplication.java" @"
package com.example.documents;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DocumentsApplication {
    public static void main(String[] args) {
        SpringApplication.run(DocumentsApplication.class, args);
    }
}
"@

Write-File "$docsPkg/entity/Document.java" @"
package com.example.documents.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "documents")
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    
    @Column(name = "created_at")
    private LocalDate createdAt;
    
    private String owner;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
}
"@

Write-File "$docsPkg/repository/DocumentRepository.java" @"
package com.example.documents.repository;

import com.example.documents.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
}
"@

Write-File "$docsPkg/service/DocumentService.java" @"
package com.example.documents.service;

import com.example.documents.entity.Document;
import com.example.documents.repository.DocumentRepository;
import org.springframework.stereotype.Service;

@Service
public class DocumentService {
    private final DocumentRepository repository;

    public DocumentService(DocumentRepository repository) {
        this.repository = repository;
    }

    public Document getDocument(Long id) {
        return repository.findById(id).orElse(null);
    }

    public void deleteDocument(Long id) {
        repository.deleteById(id);
    }
}
"@

Write-File "$docsPkg/controller/DocumentController.java" @"
package com.example.documents.controller;

import com.example.documents.entity.Document;
import com.example.documents.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(@PathVariable Long id) {
        Document doc = service.getDocument(id);
        return doc != null ? ResponseEntity.ok(doc) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        service.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
"@

# --- Comments Service ---
$commsDir = "comments-service"
$commsPkg = "$commsDir/src/main/java/com/example/comments"

Write-File "$commsDir/pom.xml" ($pomTemplate -f "comments-service")

Write-File "$commsDir/src/main/resources/application.yml" @"
server:
  port: 8081
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/dms
    username: admin
    password: admin
  jpa:
    hibernate:
      ddl-auto: none
"@

Write-File "$commsPkg/CommentsApplication.java" @"
package com.example.comments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CommentsApplication {
    public static void main(String[] args) {
        SpringApplication.run(CommentsApplication.class, args);
    }
}
"@

Write-File "$commsPkg/entity/Comment.java" @"
package com.example.comments.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "doc_id")
    private Long docId;
    
    private String content;
    private String author;
    
    @Column(name = "created")
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDocId() { return docId; }
    public void setDocId(Long docId) { this.docId = docId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
"@

Write-File "$commsPkg/repository/CommentRepository.java" @"
package com.example.comments.repository;

import com.example.comments.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByDocIdOrderByCreatedAtDesc(Long docId);
}
"@

Write-File "$commsPkg/service/CommentService.java" @"
package com.example.comments.service;

import com.example.comments.entity.Comment;
import com.example.comments.repository.CommentRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {
    private final CommentRepository repository;

    public CommentService(CommentRepository repository) {
        this.repository = repository;
    }

    public Comment createComment(Comment comment) {
        if (comment.getCreatedAt() == null) {
            comment.setCreatedAt(LocalDateTime.now());
        }
        return repository.save(comment);
    }

    public List<Comment> getCommentsByDocId(Long docId) {
        return repository.findByDocIdOrderByCreatedAtDesc(docId);
    }
}
"@

Write-File "$commsPkg/controller/CommentController.java" @"
package com.example.comments.controller;

import com.example.comments.entity.Comment;
import com.example.comments.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    private final CommentService service;

    public CommentController(CommentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Comment> createComment(@RequestBody Comment comment) {
        return ResponseEntity.ok(service.createComment(comment));
    }

    @GetMapping("/document/{docId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long docId) {
        return ResponseEntity.ok(service.getCommentsByDocId(docId));
    }
}
"@

Write-Host "Scaffolding completed."
