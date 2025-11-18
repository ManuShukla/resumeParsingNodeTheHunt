const Tesseract = require('tesseract.js');
const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs').promises;
const path = require('path');

// Reusable Tesseract worker for better performance
let workerInstance = null;
let workerLanguage = null;

/**
 * Get or create a Tesseract worker
 * @param {string} language - OCR language
 * @returns {Promise<Worker>} Tesseract worker
 */
async function getWorker(language = 'eng') {
  if (!workerInstance || workerLanguage !== language) {
    // Clean up old worker if language changed
    if (workerInstance) {
      await workerInstance.terminate();
    }
    
    workerInstance = await Tesseract.createWorker(language);
    workerLanguage = language;
  }
  
  return workerInstance;
}

/**
 * Terminate the worker (call when done with all OCR operations)
 */
async function terminateWorker() {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
    workerLanguage = null;
  }
}

/**
 * Perform OCR on a PDF file using Tesseract.js
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} options - OCR options
 * @param {boolean} options.fast - Use fast mode (1.0x scale, reusable worker)
 * @param {boolean} options.reuseWorker - Reuse Tesseract worker between calls (default: true)
 * @param {number} options.scale - Image scale factor (default: 1.5 normal, 1.0 fast)
 * @param {string} options.language - OCR language (default: 'eng')
 * @param {boolean} options.verbose - Show detailed progress
 * @returns {Promise<Object>} OCR result with text
 */
async function performOCR(pdfPath, options = {}) {
  const startTime = Date.now();
  
  // Default options with fast mode support
  const {
    fast = false,
    reuseWorker = true,
    scale = fast ? 1.0 : 1.5,
    language = 'eng',
    verbose = false
  } = options;
  
  try {
    console.log(`🔍 Starting OCR process${fast ? ' (FAST MODE)' : ''}...`);
    console.log(`   Scale: ${scale}x, Worker reuse: ${reuseWorker}`);
    
    // Step 1: Convert PDF pages to images
    console.log('📄 Converting PDF to images...');
    
    let pngPages;
    try {
      // Create output folder - use absolute path to avoid path issues
      const outputFolder = path.resolve(process.cwd(), 'tmp');
      await fs.mkdir(outputFolder, { recursive: true });
      
      // Use pdf-to-png-converter (more reliable)
      // Pass absolute path for the PDF as well
      const absolutePdfPath = path.resolve(pdfPath);
      
      pngPages = await pdfToPng(absolutePdfPath, {
        disableFontFace: false,
        useSystemFonts: false,
        viewportScale: scale,
        outputFolder,
      });
    } catch (conversionError) {
      throw new Error(`Failed to convert PDF to images: ${conversionError.message}`);
    }
    
    if (!pngPages || pngPages.length === 0) {
      throw new Error('No images were extracted from PDF');
    }
    
    const conversionTime = Date.now() - startTime;
    console.log(`✓ Converted ${pngPages.length} page(s) to images in ${conversionTime}ms`);
    
    // Step 2: Get or create Tesseract worker
    const worker = reuseWorker 
      ? await getWorker(language)
      : await Tesseract.createWorker(language, 1, {
          logger: verbose ? (m) => {
            if (m.status === 'recognizing text') {
              console.log(`   ${m.status}: ${Math.round(m.progress * 100)}%`);
            }
          } : undefined
        });
    
    const workerTime = Date.now() - startTime;
    if (!reuseWorker) {
      console.log(`   Worker created in ${workerTime - conversionTime}ms`);
    } else {
      console.log(`   Using reusable worker`);
    }
    
    // Step 3: Perform OCR on each image
    let fullText = '';
    const pageResults = [];
    
    for (let i = 0; i < pngPages.length; i++) {
      const pageStartTime = Date.now();
      console.log(`🔤 Processing page ${i + 1}/${pngPages.length} with OCR...`);
      
      try {
        // Get the PNG page info
        const pngPage = pngPages[i];
        const imagePath = pngPage.path;
        
        if (verbose) {
          console.log(`   Reading image: ${imagePath}`);
        }
        
        // Perform OCR on the file using the worker
        const result = await worker.recognize(imagePath);
        
        // Clean up temp file
        try {
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        
        const pageTime = Date.now() - pageStartTime;
        
        pageResults.push({
          page: i + 1,
          text: result.data.text,
          confidence: result.data.confidence,
          timeMs: pageTime,
        });
        
        fullText += result.data.text + '\n\n';
        console.log(`✓ Page ${i + 1} completed in ${pageTime}ms (confidence: ${result.data.confidence.toFixed(2)}%)`);
        
      } catch (pageError) {
        console.error(`❌ Error processing page ${i + 1}:`, pageError.message);
        pageResults.push({
          page: i + 1,
          text: '',
          confidence: 0,
          error: pageError.message,
        });
      }
    }
    
    // Terminate worker only if not reusing
    if (!reuseWorker) {
      await worker.terminate();
    }
    
    const parsingTime = Date.now() - startTime;
    
    // Calculate valid page results (exclude errors)
    const validResults = pageResults.filter(p => !p.error);
    const avgConfidence = validResults.length > 0
      ? validResults.reduce((sum, p) => sum + p.confidence, 0) / validResults.length
      : 0;
    
    console.log(`\n✅ OCR complete in ${parsingTime}ms`);
    console.log(`   Average confidence: ${avgConfidence.toFixed(1)}%`);
    console.log(`   Total characters: ${fullText.trim().length}`);
    console.log(`   Time per page: ${Math.round(parsingTime / pngPages.length)}ms`);
    
    return {
      success: true,
      parser: 'tesseract-ocr',
      text: fullText.trim(),
      numPages: pngPages.length,
      parsingTime,
      pageResults,
      averageConfidence: avgConfidence,
      metadata: {
        language,
        scale,
        fastMode: fast,
        reuseWorker,
        timing: {
          conversionMs: conversionTime,
          ocrMs: parsingTime - workerTime,
          totalMs: parsingTime,
          perPageMs: Math.round(parsingTime / pngPages.length),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      parser: 'tesseract-ocr',
      error: error.message,
      parsingTime: Date.now() - startTime,
    };
  }
}

/**
 * Check if a PDF needs OCR (has minimal text)
 * @param {string} text - Extracted text from regular parsing
 * @param {number} numPages - Number of pages
 * @returns {boolean} True if OCR is recommended
 */
function needsOCR(text, numPages) {
  const textLength = text.trim().length;
  const avgCharsPerPage = textLength / numPages;
  
  // If less than 50 characters per page on average, likely scanned
  if (avgCharsPerPage < 50) {
    return true;
  }
  
  // Check if text is mostly gibberish or formatting characters
  const meaningfulChars = text.replace(/[\s\n\r\t]/g, '').length;
  const meaningfulRatio = meaningfulChars / textLength;
  
  if (meaningfulRatio < 0.3) {
    return true;
  }
  
  return false;
}

/**
 * Hybrid parser that combines regular parsing + OCR
 * Extracts both native PDF text and text from images
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} regularParser - Regular PDF parser function
 * @param {Object} options - Options
 * @returns {Promise<Object>} Combined result
 */
async function hybridParse(pdfPath, regularParser, options = {}) {
  const startTime = Date.now();
  
  console.log('🔀 Starting HYBRID mode (Regular PDF + OCR)...');
  console.log('   This will extract both native text and text from images\n');
  
  // Step 1: Regular PDF parsing
  console.log('📄 Step 1/2: Extracting native PDF text...');
  const regularResult = await regularParser(pdfPath);
  
  const regularText = regularResult.success ? regularResult.text : '';
  const regularTextLength = regularText.trim().length;
  console.log(`✓ Regular parsing completed: ${regularTextLength} characters extracted`);
  
  // Step 2: OCR on the same document
  console.log('\n🔤 Step 2/2: Performing OCR to extract text from images...');
  const ocrResult = await performOCR(pdfPath, { ...options, verbose: true });
  
  if (!ocrResult.success) {
    console.log(`⚠️  OCR failed: ${ocrResult.error}`);
    console.log('   Continuing with regular text only...\n');
  }
  
  const ocrText = ocrResult.success ? ocrResult.text : '';
  const ocrTextLength = ocrText.trim().length;
  console.log(`✓ OCR completed: ${ocrTextLength} characters extracted\n`);
  
  // Step 3: Merge and deduplicate
  console.log('🔄 Merging results and removing duplicates...');
  const mergedText = mergeTexts(regularText, ocrText);
  
  const totalTime = Date.now() - startTime;
  
  return {
    success: true,
    parser: 'hybrid (regular + OCR)',
    text: mergedText.combined,
    numPages: regularResult.numPages || ocrResult.numPages,
    parsingTime: totalTime,
    metadata: {
      regularTextLength,
      ocrTextLength,
      combinedTextLength: mergedText.combined.length,
      duplicateCharsRemoved: mergedText.duplicatesRemoved,
      ocrConfidence: ocrResult.averageConfidence,
      regularParser: regularResult.parser,
      breakdown: {
        regularParsing: regularResult.parsingTime || 0,
        ocrParsing: ocrResult.parsingTime || 0,
        total: totalTime,
      },
    },
    sources: {
      regular: regularText,
      ocr: ocrText,
    },
  };
}

/**
 * Merge regular text and OCR text, removing duplicates
 * @param {string} regularText - Text from regular parsing
 * @param {string} ocrText - Text from OCR
 * @returns {Object} Merged result
 */
function mergeTexts(regularText, ocrText) {
  const regular = regularText.trim();
  const ocr = ocrText.trim();
  
  // If one is empty, return the other
  if (!regular) return { combined: ocr, duplicatesRemoved: 0 };
  if (!ocr) return { combined: regular, duplicatesRemoved: 0 };
  
  // Split into lines for comparison
  const regularLines = regular.split('\n').map(l => l.trim()).filter(l => l);
  const ocrLines = ocr.split('\n').map(l => l.trim()).filter(l => l);
  
  // Create a set of normalized regular text lines
  const regularSet = new Set(regularLines.map(l => normalizeForComparison(l)));
  
  // Find unique OCR lines (not in regular text)
  const uniqueOcrLines = ocrLines.filter(line => {
    const normalized = normalizeForComparison(line);
    return !regularSet.has(normalized);
  });
  
  const duplicatesRemoved = ocrLines.length - uniqueOcrLines.length;
  
  // Combine: regular text first (more accurate) + unique OCR findings
  const combined = regular + '\n\n--- Additional text from images ---\n\n' + uniqueOcrLines.join('\n');
  
  return {
    combined: combined.trim(),
    duplicatesRemoved,
  };
}

/**
 * Normalize text for duplicate detection
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeForComparison(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Smart parser that uses regular parsing + OCR fallback
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} regularParser - Regular PDF parser function
 * @param {Object} options - Options
 * @returns {Promise<Object>} Combined result
 */
async function smartParse(pdfPath, regularParser, options = {}) {
  const startTime = Date.now();
  
  // Step 1: Try regular parsing first
  console.log('🔍 Attempting regular PDF parsing...');
  const regularResult = await regularParser(pdfPath);
  
  if (!regularResult.success) {
    console.log('❌ Regular parsing failed, trying OCR...');
    return await performOCR(pdfPath, options);
  }
  
  // Step 2: Check if OCR is needed
  const ocrNeeded = needsOCR(regularResult.text, regularResult.numPages);
  
  if (ocrNeeded) {
    console.log('⚠️  Very little text extracted. This appears to be a scanned PDF.');
    console.log('🔤 Performing OCR to extract text from images...');
    
    const ocrResult = await performOCR(pdfPath, options);
    
    if (ocrResult.success) {
      return {
        success: true,
        parser: 'hybrid (regular + OCR)',
        text: ocrResult.text,
        numPages: ocrResult.numPages,
        parsingTime: Date.now() - startTime,
        metadata: {
          ...ocrResult.metadata,
          regularTextLength: regularResult.text.length,
          ocrTextLength: ocrResult.text.length,
          ocrConfidence: ocrResult.averageConfidence,
        },
        usedOCR: true,
      };
    }
  }
  
  // Return regular result if OCR not needed or failed
  return {
    ...regularResult,
    usedOCR: false,
    parsingTime: Date.now() - startTime,
  };
}

module.exports = {
  performOCR,
  needsOCR,
  smartParse,
  hybridParse,
  terminateWorker,
  getWorker,
};
