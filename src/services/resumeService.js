const { query, getClient } = require('../config/database');
const { 
  parseWithPdfParse, 
  parseWithPdfJs, 
  parseWithPdf2Json, 
  parseWithPdfReader,
  generateHash 
} = require('../parsers/allParsers');
const crypto = require('crypto');

/**
 * Process and store resume in database
 * @param {string|Buffer} pdfInput - File path or buffer
 * @param {string} filename - Original filename
 * @param {string} filePath - Full file path
 * @param {number} fileSize - File size in bytes
 * @param {string} parserName - Parser to use (pdf-parse, pdfjs-dist, pdf2json, pdfreader)
 * @returns {Promise<Object>} Result object with resume ID and parsed data
 */
async function processAndStoreResume(pdfInput, filename, filePath = null, fileSize = 0, parserName = 'pdfjs-dist') {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Step 1: Parse the PDF using selected parser with fallback
    console.log(`Parsing PDF: ${filename} using ${parserName}`);
    let parseResult;
    const originalParser = parserName;
    
    // Try the selected parser
    switch (parserName) {
      case 'pdf-parse':
        parseResult = await parseWithPdfParse(pdfInput);
        break;
      case 'pdfjs-dist':
        parseResult = await parseWithPdfJs(pdfInput);
        break;
      case 'pdf2json':
        parseResult = await parseWithPdf2Json(pdfInput);
        break;
      case 'pdfreader':
        parseResult = await parseWithPdfReader(pdfInput);
        break;
      default:
        parseResult = await parseWithPdfJs(pdfInput);
        parserName = 'pdfjs-dist';
    }
    
    // Fallback logic if primary parser fails
    if (!parseResult.success) {
      console.log(`${parserName} failed (${parseResult.error}), trying fallback parsers...`);
      
      // Try pdfjs-dist as first fallback (most reliable)
      if (parserName !== 'pdfjs-dist') {
        console.log('Trying pdfjs-dist...');
        parseResult = await parseWithPdfJs(pdfInput);
        if (parseResult.success) {
          parserName = 'pdfjs-dist';
        }
      }
      
      // Try pdf-parse as second fallback
      if (!parseResult.success && parserName !== 'pdf-parse') {
        console.log('Trying pdf-parse...');
        parseResult = await parseWithPdfParse(pdfInput);
        if (parseResult.success) {
          parserName = 'pdf-parse';
        }
      }
      
      // Try pdf2json as third fallback
      if (!parseResult.success && parserName !== 'pdf2json') {
        console.log('Trying pdf2json...');
        parseResult = await parseWithPdf2Json(pdfInput);
        if (parseResult.success) {
          parserName = 'pdf2json';
        }
      }
    }
    
    if (originalParser !== parserName) {
      console.log(`✓ Fallback successful! Using ${parserName} instead of ${originalParser}`);
    }

    if (!parseResult.success) {
      throw new Error(`Failed to parse PDF: ${parseResult.error}`);
    }

    // Step 2: Generate content hash (SHA-256)
    const contentHash = generateHash(parseResult.text);
    console.log(`Generated hash: ${contentHash.substring(0, 16)}...`);

    // Step 3: Check if resume with same hash already exists
    const existingResume = await client.query(
      'SELECT id FROM "parsedResume" WHERE content_hash = $1',
      [contentHash]
    );

    if (existingResume.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        duplicate: true,
        existingId: existingResume.rows[0].id,
        message: 'Resume with identical content already exists',
        hash: contentHash,
      };
    }

    // Step 4: Extract basic structured data
    const parsedData = {
      textLength: parseResult.text.length,
      wordCount: parseResult.text.split(/\s+/).length,
      metadata: parseResult.metadata,
    };

    // Step 5: Insert into parsedResume table
    const resumeResult = await client.query(
      `INSERT INTO "parsedResume" 
       (filename, file_path, file_size, page_count, raw_text, content_hash, 
        parser_used, parsing_time_ms, parsed_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        filename,
        filePath,
        fileSize,
        parseResult.numPages,
        parseResult.text,
        contentHash,
        parserName,
        parseResult.parsingTime,
        JSON.stringify(parsedData),
      ]
    );

    const resumeId = resumeResult.rows[0].id;
    console.log(`✅ Resume stored with ID: ${resumeId}`);

    await client.query('COMMIT');

    return {
      success: true,
      resumeId,
      hash: contentHash,
      numPages: parseResult.numPages,
      textLength: parseResult.text.length,
      parsingTime: parseResult.parsingTime,
      parserUsed: parserName,
      parsedText: parseResult.text,
      message: 'Resume parsed and stored successfully',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing resume:', error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Get resume by ID
 * @param {number} resumeId - Resume ID
 * @returns {Promise<Object>} Resume data
 */
async function getResumeById(resumeId) {
  try {
    const resumeResult = await query(
      'SELECT * FROM "parsedResume" WHERE id = $1',
      [resumeId]
    );

    if (resumeResult.rows.length === 0) {
      return { success: false, error: 'Resume not found' };
    }

    return {
      success: true,
      data: resumeResult.rows[0],
    };
  } catch (error) {
    console.error('Error retrieving resume:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all resumes with basic information
 * @returns {Promise<Array>} List of resumes
 */
async function getAllResumes() {
  try {
    const result = await query(
      `SELECT id, filename, content_hash, page_count, file_size, 
              parser_used, parsing_time_ms, created_at
       FROM "parsedResume"
       ORDER BY created_at DESC`
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error('Error retrieving resumes:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Search resumes by content hash
 * @param {string} hash - Content hash to search
 * @returns {Promise<Object>} Search results
 */
async function searchResumeByHash(hash) {
  try {
    const result = await query(
      'SELECT * FROM "parsedResume" WHERE content_hash = $1',
      [hash]
    );

    return {
      success: true,
      data: result.rows,
      found: result.rows.length > 0,
    };
  } catch (error) {
    console.error('Error searching resume:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Search resumes by filename
 * @param {string} filename - Filename to search
 * @returns {Promise<Object>} Search results
 */
async function searchResumeByFilename(filename) {
  try {
    const result = await query(
      'SELECT * FROM "parsedResume" WHERE filename ILIKE $1',
      [`%${filename}%`]
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error('Error searching resume:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete resume
 * @param {number} resumeId - Resume ID to delete
 * @returns {Promise<Object>} Result object
 */
async function deleteResume(resumeId) {
  try {
    const result = await query(
      'DELETE FROM "parsedResume" WHERE id = $1 RETURNING *',
      [resumeId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Resume not found' };
    }

    return {
      success: true,
      message: 'Resume deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting resume:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  processAndStoreResume,
  getResumeById,
  getAllResumes,
  searchResumeByHash,
  searchResumeByFilename,
  deleteResume,
};
