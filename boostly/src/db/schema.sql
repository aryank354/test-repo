-- Drop tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS redemptions;
DROP TABLE IF EXISTS endorsements;
DROP TABLE IF EXISTS recognitions;
DROP TABLE IF EXISTS students;

-- Students table
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    received_balance INTEGER DEFAULT 0,
    sending_balance INTEGER DEFAULT 100,
    monthly_sending_limit_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recognitions table
CREATE TABLE recognitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES students(id) ON DELETE CASCADE,
    CHECK (amount > 0),
    CHECK (sender_id != receiver_id)
);

-- Endorsements table
CREATE TABLE endorsements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recognition_id INTEGER NOT NULL,
    endorser_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recognition_id) REFERENCES recognitions(id) ON DELETE CASCADE,
    FOREIGN KEY (endorser_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(recognition_id, endorser_id)
);

-- Redemptions table
CREATE TABLE redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    credits_redeemed INTEGER NOT NULL,
    rupees_value INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CHECK (credits_redeemed > 0),
    CHECK (rupees_value > 0)
);

-- Indexes for better performance
CREATE INDEX idx_recognitions_sender ON recognitions(sender_id);
CREATE INDEX idx_recognitions_receiver ON recognitions(receiver_id);
CREATE INDEX idx_endorsements_recognition ON endorsements(recognition_id);
CREATE INDEX idx_endorsements_endorser ON endorsements(endorser_id);
CREATE INDEX idx_redemptions_student ON redemptions(student_id);