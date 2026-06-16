CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    owner TEXT,
    file_url TEXT,
    translated_content_fr TEXT,
    translated_content_ar TEXT,
    translated_content_es TEXT
);

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    doc_id BIGINT REFERENCES documents(id),
    content TEXT,
    author TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO documents (title, owner) VALUES
('Project Alpha Specs', 'Alice'),
('Q1 Marketing Plan', 'Bob'),
('Q2 Marketing Plan', 'Bob'),
('Employee Handbook', 'HR'),
('Design System v2', 'Charlie');

INSERT INTO comments (doc_id, content, author) VALUES
(1, 'Looks good to me.', 'Bob'),
(1, 'Need more details on section 2.', 'Charlie'),
(2, 'Budget approved.', 'Alice'),
(4, 'Please add the new remote work policy.', 'David'),
(5, 'Color palette updated.', 'Charlie');
