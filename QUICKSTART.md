# Quick Start Guide

## What This Program Does

This Node.js application:
1. **Parses PDF resumes** - Extracts text from PDF files
2. **Generates content hashes** - Creates SHA-256 hash for duplicate detection
3. **Stores in database** - Saves parsed resumes in PostgreSQL (single table: `parsedResume`)
4. **Compares parsers** - Tests 4 different JavaScript PDF parsing libraries

## Setup (3 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database Table
```bash
npm run init-db
```

### 3. Test with a PDF
```bash
npm test /path/to/your-resume.pdf
```

## Compare Different Parsing Libraries

To see how 4 different parsers perform on the same PDF:

```bash
npm run compare /path/to/your-resume.pdf
```

This will test:
- **pdf-parse** (default, recommended)
- **pdfjs-dist** (Mozilla's parser)
- **pdf2json** (structured JSON)
- **pdfreader** (streaming)

Output shows:
- ✅/❌ Success/failure for each parser
- ⏱️ Parsing time comparison
- 📊 Text extraction length
- 🔐 Content hash for each result

## Database Schema

Single table: **parsedResume**

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| filename | VARCHAR | Original filename |
| file_path | VARCHAR | Full path |
| file_size | INTEGER | Size in bytes |
| page_count | INTEGER | Number of pages |
| raw_text | TEXT | Full extracted text |
| content_hash | VARCHAR(64) | SHA-256 hash (unique) |
| parser_used | VARCHAR | Which parser was used |
| parsing_time_ms | INTEGER | Parse duration |
| parsed_data | JSONB | Additional metadata |
| created_at | TIMESTAMP | Upload time |
| updated_at | TIMESTAMP | Last update |

## Key Features

### 1. Duplicate Detection
- Generates SHA-256 hash of resume content
- Prevents storing identical resumes
- Works even if filenames are different

### 2. Multiple Parser Support
- Default: `pdf-parse` (best balance)
- Can switch to other parsers if needed
- Compare performance before choosing

### 3. Simple Storage
- Just one table (`parsedResume`)
- No complex relationships
- Easy to query and manage

## API Server

Start the server:
```bash
npm start
```

### Upload a resume via API:
```bash
curl -X POST http://localhost:3000/api/resume/upload \
  -F "resume=@/path/to/resume.pdf"
```

### Get all resumes:
```bash
curl http://localhost:3000/api/resumes
```

### Search by hash:
```bash
curl "http://localhost:3000/api/resume/search/hash?hash=YOUR_HASH_HERE"
```

## Parser Comparison Results

Each parser has strengths:

| Parser | Speed | Reliability | Best For |
|--------|-------|-------------|----------|
| pdf-parse | ⚡⚡⚡ Fast | ✅ Good | Most resumes |
| pdfjs-dist | ⚡⚡ Medium | ✅✅ Excellent | Complex PDFs |
| pdf2json | ⚡⚡ Medium | ⚠️ OK | Positioning data |
| pdfreader | ⚡ Slower | ✅ Good | Large files |

**Recommendation**: Use `pdf-parse` (default) unless you have specific needs.

## Example Workflow

1. Compare parsers on a sample PDF:
   ```bash
   npm run compare sample-resume.pdf
   ```

2. Choose the best parser for your use case

3. Parse and store resumes:
   ```bash
   npm test resume1.pdf
   npm test resume2.pdf
   npm test resume3.pdf
   ```

4. Query stored resumes:
   ```bash
   # Via command line (psql)
   SELECT id, filename, content_hash, page_count 
   FROM "parsedResume";
   
   # Or via API
   curl http://localhost:3000/api/resumes
   ```

## Files Overview

- `src/parsers/allParsers.js` - All 4 parser implementations + hash generation
- `src/services/resumeService.js` - Database operations
- `src/examples/compareLibraries.js` - Parser comparison tool
- `src/examples/testParser.js` - Single file parser with DB storage
- `src/index.js` - Express API server
- `src/database/initDatabase.js` - Database table creation

## Troubleshooting

### "Database connection failed"
- Check your `.env` file has correct credentials
- Ensure PostgreSQL is running

### "Parser failed"
- Try a different parser using the compare tool
- Some PDFs have protections that block parsing

### "Duplicate detected"
- This means the exact same resume already exists
- Check with: `npm run compare` to see the hash
