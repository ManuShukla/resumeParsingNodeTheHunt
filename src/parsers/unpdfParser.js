const { extractText } = require('unpdf');
const fs = require('fs').promises;

/**
 * Parse PDF using unpdf (text extraction only)
 * 
 * Note: unpdf is excellent for text extraction with zero dependencies (bundled PDF.js 5.4.296).
 * However, its renderPageAsImage() has Node.js canvas serialization issues and cannot be
 * reliably used for OCR in Node.js environments. For hybrid text+OCR, use the pdf2json + 
 * pdf-to-png-converter solution in ocrParser.js instead.
 * 
 * @param {string|Buffer} input - Path to PDF file or buffer
 * @returns {Promise<Object>} Parsing result
 */
async function parseWithUnpdf(input) {
  const startTime = Date.now();
  
  try {
    let buffer;
    if (typeof input === 'string') {
      buffer = await fs.readFile(input);
    } else {
      buffer = input;
    }

    // Extract text from PDF
    const { totalPages, text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    
    const parsingTime = Date.now() - startTime;

    return {
      success: true,
      parser: 'unpdf',
      text: text,
      numPages: totalPages,
      parsingTime,
      metadata: {
        library: 'unpdf',
        pdfjs_version: '5.4.296', // Bundled version
      },
    };
  } catch (error) {
    return {
      success: false,
      parser: 'unpdf',
      error: error.message,
      parsingTime: Date.now() - startTime,
    };
  }
}

module.exports = {
  parseWithUnpdf,
};

/**
 * Hybrid parser using unpdf for text + manual canvas rendering for OCR
 * @param {string|Buffer} input - Path to PDF file or buffer
 * @param {Object} options - Options
 * @returns {Promise<Object>} Parsing result
 */
async function hybridParseWithUnpdf(input, options = {}) {
  const startTime = Date.now();
  
  console.log('🔀 Starting HYBRID mode with unpdf (Text + OCR)...');
  console.log('   unpdf for text, direct PDF.js canvas rendering for OCR\n');
  
  try {
    let buffer;
    
    if (typeof input === 'string') {
      buffer = await fs.readFile(input);
    } else {
      buffer = input;
    }
    
    const uint8Buffer = new Uint8Array(buffer);
    
    // Step 1: Extract native text with unpdf
    console.log('📄 Step 1/2: Extracting native PDF text with unpdf...');
    const textStartTime = Date.now();
    const { totalPages, text: regularText } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    const textTime = Date.now() - textStartTime;
    const regularTextLength = regularText.trim().length;
    console.log(`✓ Text extraction completed: ${regularTextLength} characters in ${textTime}ms`);
    
    // Step 2: OCR using direct PDF.js (not unpdf's proxy to avoid workers)
    console.log('\n🔤 Step 2/2: Performing OCR with direct PDF.js canvas rendering...');
    const ocrStartTime = Date.now();
    
    let ocrText = '';
    const pageResults = [];
    
    // Load PDF with pdfjs-dist directly (use fresh buffer copy)
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (options.verbose) {
        console.log(`   Processing page ${pageNum}/${totalPages}...`);
      }
      
      try {
        // Get page from PDF
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: options.scale || 1.5 });
        
        // Create canvas and render
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to buffer
        const imageBuffer = canvas.toBuffer('image/png');
        
        // Save temp file for Tesseract
        const tempDir = path.resolve(process.cwd(), 'tmp');
        await fs.mkdir(tempDir, { recursive: true });
        const tempImagePath = path.join(tempDir, `unpdf-ocr-${pageNum}-${Date.now()}.png`);
        await fs.writeFile(tempImagePath, imageBuffer);
        
        if (options.verbose) {
          console.log(`      Rendered to: ${tempImagePath}`);
        }
        
        // Perform OCR
        const result = await Tesseract.recognize(
          tempImagePath,
          options.language || 'eng',
          {
            logger: options.verbose ? (m) => {
              if (m.status === 'recognizing text') {
                console.log(`      ${m.status}: ${Math.round(m.progress * 100)}%`);
              }
            } : undefined
          }
        );
        
        // Clean up
        try {
          await fs.unlink(tempImagePath);
        } catch (unlinkError) {
          // Ignore
        }
        
        pageResults.push({
          page: pageNum,
          text: result.data.text,
          confidence: result.data.confidence,
        });
        
        ocrText += result.data.text + '\n\n';
        
        if (options.verbose) {
          console.log(`   ✓ Page ${pageNum} completed (confidence: ${result.data.confidence.toFixed(2)}%)`);
        }
        
      } catch (pageError) {
        console.error(`   ❌ Error processing page ${pageNum}:`, pageError.message);
        pageResults.push({
          page: pageNum,
          text: '',
          confidence: 0,
          error: pageError.message,
        });
      }
    }
    
    const ocrTime = Date.now() - ocrStartTime;
    const ocrTextLength = ocrText.trim().length;
    
    const validResults = pageResults.filter(p => !p.error);
    const avgConfidence = validResults.length > 0
      ? validResults.reduce((sum, p) => sum + p.confidence, 0) / validResults.length
      : 0;
    
    console.log(`✓ OCR completed: ${ocrTextLength} characters in ${ocrTime}ms`);
    console.log(`   Average confidence: ${avgConfidence.toFixed(2)}%\n`);
    
    // Step 3: Merge results
    console.log('🔄 Merging results and removing duplicates...');
    const mergedText = mergeTexts(regularText, ocrText);
    
    const totalTime = Date.now() - startTime;
    
    return {
      success: true,
      parser: 'unpdf-hybrid',
      text: mergedText.combined,
      numPages: totalPages,
      parsingTime: totalTime,
      metadata: {
        regularTextLength: regularTextLength,
        ocrTextLength: ocrTextLength,
        combinedTextLength: mergedText.combined.length,
        duplicateCharsRemoved: mergedText.duplicatesRemoved,
        ocrConfidence: avgConfidence,
        breakdown: {
          regularParsing: textTime,
          ocrParsing: ocrTime,
          total: totalTime,
        },
        pageResults: pageResults,
      },
      sources: {
        regular: regularText,
        ocr: ocrText,
      },
    };
    
  } catch (error) {
    return {
      success: false,
      parser: 'unpdf-hybrid',
      error: error.message,
      parsingTime: Date.now() - startTime,
    };
  }
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
  let combined;
  if (uniqueOcrLines.length > 0) {
    combined = regular + '\n\n--- Additional text from images ---\n\n' + uniqueOcrLines.join('\n');
  } else {
    combined = regular;
  }
  
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

module.exports = {
  parseWithUnpdf,
  hybridParseWithUnpdf,
};
