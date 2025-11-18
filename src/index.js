require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const {
  processAndStoreResume,
  getResumeById,
  getAllResumes,
  searchResumeByHash,
  searchResumeByFilename,
  deleteResume,
} = require('./services/resumeService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Resume Parser API is running' });
});

/**
 * Upload and parse resume
 */
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing uploaded file: ${req.file.originalname}`);

    const result = await processAndStoreResume(
      req.file.path,
      req.file.originalname,
      req.file.path,
      req.file.size
    );

    if (result.success) {
      res.json({
        message: 'Resume uploaded and parsed successfully',
        resumeId: result.resumeId,
        hash: result.hash,
        numPages: result.numPages,
        textLength: result.textLength,
        parsingTime: result.parsingTime,
      });
    } else if (result.duplicate) {
      res.status(409).json({
        error: 'Duplicate resume detected',
        message: result.message,
        existingId: result.existingId,
        hash: result.hash,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all resumes
 */
app.get('/api/resumes', async (req, res) => {
  try {
    const result = await getAllResumes();
    
    if (result.success) {
      res.json({ resumes: result.data });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error in get all resumes endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get resume by ID
 */
app.get('/api/resume/:id', async (req, res) => {
  try {
    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume ID' });
    }

    const result = await getResumeById(resumeId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error in get resume endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search resume by hash
 */
app.get('/api/resume/search/hash', async (req, res) => {
  try {
    const { hash } = req.query;
    
    if (!hash) {
      return res.status(400).json({ error: 'Hash parameter is required' });
    }

    const result = await searchResumeByHash(hash);
    
    if (result.success) {
      res.json({ 
        found: result.found,
        resumes: result.data 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search resume by filename
 */
app.get('/api/resume/search/filename', async (req, res) => {
  try {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename parameter is required' });
    }

    const result = await searchResumeByFilename(filename);
    
    if (result.success) {
      res.json({ resumes: result.data });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete resume by ID
 */
app.delete('/api/resume/:id', async (req, res) => {
  try {
    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume ID' });
    }

    const result = await deleteResume(resumeId);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error in delete endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume Parser API running on port ${PORT}`);
  console.log(`📝 Upload endpoint: http://localhost:${PORT}/api/resume/upload`);
  console.log(`📋 Get all resumes: http://localhost:${PORT}/api/resumes`);
  console.log(`🔍 Search by hash: http://localhost:${PORT}/api/resume/search/hash?hash=abc123`);
  console.log(`🔍 Search by filename: http://localhost:${PORT}/api/resume/search/filename?filename=resume.pdf`);
});

module.exports = app;
