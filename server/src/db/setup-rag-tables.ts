import { pool } from './index';

async function createRagTables() {
  console.log('Creating RAG tables in MySQL...');

  const createRagDocuments = `
    CREATE TABLE IF NOT EXISTS rag_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      type ENUM('PDF', 'DOCX', 'PPTX', 'FAQ') NOT NULL,
      category VARCHAR(255),
      fileSize INT,
      totalChunks INT DEFAULT 0,
      status ENUM('UPLOADING', 'PROCESSING', 'INDEXED', 'ERROR') NOT NULL DEFAULT 'UPLOADING',
      errorMessage TEXT,
      question TEXT,
      answer TEXT,
      uploadedBy INT,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createRagChunks = `
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      documentId INT NOT NULL,
      chunkIndex INT NOT NULL,
      content TEXT NOT NULL,
      heading VARCHAR(500),
      pageOrSlide INT,
      tokenCount INT,
      embedding JSON,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX rag_chunks_documentId_idx (documentId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    const connection = await pool.getConnection();
    await connection.query(createRagDocuments);
    console.log('✅ Created table rag_documents');
    await connection.query(createRagChunks);
    console.log('✅ Created table rag_chunks');
    connection.release();
    console.log('🎉 RAG Database setup complete!');
  } catch (error) {
    console.error('❌ Failed to create RAG tables:', error);
  } finally {
    process.exit(0);
  }
}

createRagTables();
