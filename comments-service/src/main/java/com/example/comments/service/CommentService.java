package com.example.comments.service;

import com.example.comments.entity.Comment;
import com.example.comments.repository.CommentRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
        if (comment.getId() == null) {
            comment.setId(UUID.randomUUID());
        }
        return repository.save(comment);
    }

    public List<Comment> getCommentsByDocId(Long docId) {
        return repository.findByKeyDocId(docId);
    }
}

