package com.example.comments.entity;

import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("comments")
public class Comment {

    @PrimaryKey
    private CommentKey key;
    
    private String content;
    private String author;

    public Comment() {
        this.key = new CommentKey();
    }

    public CommentKey getKey() { return key; }
    public void setKey(CommentKey key) { this.key = key; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    // Flattened getters/setters for JSON API compatibility
    public Long getDocId() {
        return key != null ? key.getDocId() : null;
    }

    public void setDocId(Long docId) {
        if (key == null) key = new CommentKey();
        key.setDocId(docId);
    }

    public LocalDateTime getCreatedAt() {
        return key != null ? key.getCreatedAt() : null;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        if (key == null) key = new CommentKey();
        key.setCreatedAt(createdAt);
    }

    public UUID getId() {
        return key != null ? key.getId() : null;
    }

    public void setId(UUID id) {
        if (key == null) key = new CommentKey();
        key.setId(id);
    }
}

