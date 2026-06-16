package com.example.documents.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// @Configuration // Removed to fix ConflictingBeanDefinitionException
public class KafkaTopicConfig {

    @Bean
    public NewTopic documentsUploadedTopic() {
        return new NewTopic("dms.documents.uploaded", 3, (short) 1);
    }
}
