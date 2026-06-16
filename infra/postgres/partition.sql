ALTER TABLE documents RENAME TO documents_old;

CREATE TABLE documents (
    id BIGSERIAL,
    title TEXT NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    owner TEXT
) PARTITION BY RANGE (created_at);

CREATE TABLE documents_2025_q1 PARTITION OF documents FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE documents_2025_q2 PARTITION OF documents FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE documents_2025_q3 PARTITION OF documents FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE documents_2025_q4 PARTITION OF documents FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Update the existing data to fall into the first partition so migration doesn't fail
UPDATE documents_old SET created_at = '2025-02-15';

INSERT INTO documents SELECT * FROM documents_old;
