const { pool } = require('../config/database');

/**
 * Initialize database table for parsed resumes
 */
async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database!');
    console.log('Creating parsedResume table...\n');

    // Create single parsedResume table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "parsedResume" (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        file_size INTEGER,
        page_count INTEGER,
        raw_text TEXT NOT NULL,
        content_hash VARCHAR(64) NOT NULL,
        parser_used VARCHAR(50),
        parsing_time_ms INTEGER,
        parsed_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_content_hash UNIQUE(content_hash)
      )
    `);

    console.log('✓ parsedResume table created');

    // Create indexes for better query performance
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_parsed_resume_hash ON "parsedResume"(content_hash);
      CREATE INDEX IF NOT EXISTS idx_parsed_resume_filename ON "parsedResume"(filename);
      CREATE INDEX IF NOT EXISTS idx_parsed_resume_created ON "parsedResume"(created_at);
    `);

    console.log('✓ Indexes created');

    console.log('\n✅ Database initialization completed successfully!');
    console.log('📊 Table: parsedResume');
    console.log('   - Stores parsed resume text');
    console.log('   - Generates SHA-256 hash of content');
    console.log('   - Tracks parsing method and performance');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file has correct database credentials');
    console.error('2. Ensure your database is accessible from this machine');
    console.error('3. Check if SSL is required: DB_SSL=true');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

// Run initialization
initDatabase();
