package com.example.documents;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class DocumentsApplication {
    public static void main(String[] args) {
        SpringApplication.run(DocumentsApplication.class, args);
    }
}
