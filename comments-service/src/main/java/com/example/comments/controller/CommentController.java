package com.example.comments.controller;

import com.example.comments.entity.Comment;
import com.example.comments.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
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
