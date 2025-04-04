CREATE TABLE call_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(15) NOT NULL,
  call_sid VARCHAR(50) NOT NULL,
  status VARCHAR(20),
  recording_url TEXT,
  transcript TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
