# Resume Parser - Node.js PDF Parsing & Hash Generation

A Node.js application that parses PDF resumes, generates content hashes, and stores them in a PostgreSQL database. Includes a comparison tool for testing different JavaScript PDF parsing libraries.

## 🚀 Features

- **PDF Parsing**: Extract text from PDF resumes using multiple libraries
- **Hash Generation**: Generate SHA-256 hash of resume content for duplicate detection
- **Database Storage**: Store parsed resumes in a single PostgreSQL table
- **Parser Comparison**: Test and compare 4 different PDF parsing libraries
- **RESTful API**: Upload and manage resumes via HTTP endpoints
- **Duplicate Detection**: Prevent storing identical resumes using content hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database (configured in `.env`)
- npm or yarn

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Initialize the database:
```bash
npm run init-db
```

This will create the `parsedResume` table with the following columns:
- `id` - Primary key
- `filename` - Original filename
- `file_path` - Full file path
- `file_size` - File size in bytes
- `page_count` - Number of pages
- `raw_text` - Full extracted text
- `content_hash` - SHA-256 hash (unique)
- `parser_used` - Which parser was used
- `parsing_time_ms` - Parsing duration
- `parsed_data` - Additional metadata (JSON)
- `created_at` - Upload timestamp
- `updated_at` - Last update timestamp

## 🔧 Configuration

The application uses environment variables from `.env`:

```properties
DB_TYPE=postgres
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=your-database-name
DB_SSL=true
NODE_ENV=local
```

## 🎯 Usage

### Compare PDF Parsing Libraries

Test and compare all 4 parsing libraries on a PDF:

```bash
npm run compare path/to/resume.pdf
```

This will test:
1. **pdf-parse** - Simple and lightweight
2. **pdfjs-dist** - Mozilla's reliable parser
3. **pdf2json** - Structured JSON output
4. **pdfreader** - Streaming API

Output shows:
- Success/failure status for each parser
- Parsing time comparison
- Text extraction quality
- Content hashes

### Parse and Store a Resume

Parse a single PDF file and store it in the database:

```bash
npm test path/to/resume.pdf
```

Features:
- Extracts text from PDF
- Generates SHA-256 hash
- Stores in database
- Detects duplicates automatically

### Start the API Server

```bash
npm start
```

The API will be available at `http://localhost:3000`

### Development Mode (with auto-reload)

```bash
npm run dev
```

## 🌐 API Endpoints

### 1. Health Check
```
GET /health
```

### 2. Upload Resume
```
POST /api/resume/upload
Content-Type: multipart/form-data

Body:
- resume: <PDF file>
```

Response (Success):
```json
{
  "message": "Resume uploaded and parsed successfully",
  "resumeId": 1,
  "hash": "a3f8b9c2d1e4f5...",
  "numPages": 2,
  "textLength": 3456,
  "parsingTime": 123
}
```

Response (Duplicate):
```json
{
  "error": "Duplicate resume detected",
  "existingId": 5,
  "hash": "a3f8b9c2d1e4f5..."
}
```

### 3. Get All Resumes
```
GET /api/resumes
```

### 4. Get Resume by ID
```
GET /api/resume/:id
```

### 5. Search by Hash
```
GET /api/resume/search/hash?hash=a3f8b9c2d1e4f5...
```

### 6. Search by Filename
```
GET /api/resume/search/filename?filename=john_resume
```

### 7. Delete Resume
```
DELETE /api/resume/:id
```

## 📊 Parsing Libraries Comparison

### pdf-parse ⭐ (Default)
- **Pros**: Simple, lightweight, reliable, no external dependencies
- **Cons**: Basic text extraction only
- **Best for**: Most resume parsing use cases

### pdfjs-dist (Mozilla)
- **Pros**: Highly reliable, excellent rendering, well-maintained
- **Cons**: Heavier library, more complex API
- **Best for**: Complex PDFs, production environments

### pdf2json
- **Pros**: Structured JSON output, preserves positioning
- **Cons**: Older, requires file paths, complex output
- **Best for**: When you need text positioning data

### pdfreader
- **Pros**: Streaming API, memory efficient
- **Cons**: Requires manual text reconstruction
- **Best for**: Large PDFs, custom parsing logic

## 🧪 Testing with cURL

### Upload a resume:
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
curl "http://localhost:3000/api/resume/search/hash?hash=a3f8b9c2d1e4f5..."
```

## 🛠️ Project Structure

```
resume-parser/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection
│   ├── database/
│   │   └── initDatabase.js      # Database table creation
│   ├── parsers/
│   │   ├── allParsers.js        # All 4 parser implementations
│   │   └── pdfParser.js         # Legacy parser (kept for reference)
│   ├── services/
│   │   └── resumeService.js     # Business logic & database operations
│   ├── examples/
│   │   ├── testParser.js        # Single file test script
│   │   └── compareLibraries.js  # Parser comparison tool
│   └── index.js                 # Express API server
├── uploads/                     # Uploaded PDF files
├── .env                         # Environment variables
├── package.json
└── README.md
```

## � Hash Generation Process

1. PDF is parsed to extract raw text
2. SHA-256 hash is generated from the text content
3. Hash is checked against database for duplicates
4. If unique, resume is stored with its hash
5. If duplicate, existing record ID is returned

This ensures you never store the same resume twice, even with different filenames.

## 🚧 Future Enhancements

- [ ] Support for DOCX files
- [ ] OCR for scanned PDFs
- [ ] Advanced NLP for entity extraction
- [ ] Resume similarity scoring
- [ ] Batch processing
- [ ] PDF preview generation
- [ ] Export to JSON/CSV

## 📝 License

ISC
