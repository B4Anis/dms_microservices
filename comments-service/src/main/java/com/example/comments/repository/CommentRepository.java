package com.example.comments.repository;

import com.example.comments.entity.Comment;
import com.example.comments.entity.CommentKey;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends CassandraRepository<Comment, CommentKey> {
    List<Comment> findByKeyDocId(Long docId);
}

