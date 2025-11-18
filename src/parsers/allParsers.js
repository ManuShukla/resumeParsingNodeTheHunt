const fs = require('fs').promises;
const crypto = require('crypto');
const { extractText } = require('unpdf');

/**
 * Parser 1: pdf-parse (Recommended - Simple and Reliable)
 */
async function parseWithPdfParse(input) {
  const pdf = require('pdf-parse');
  const startTime = Date.now();
  
  try {
    let dataBuffer;
    if (typeof input === 'string') {
      dataBuffer = await fs.readFile(input);
    } else {
      dataBuffer = input;
    }

    const data = await pdf(dataBuffer);
    const parsingTime = Date.now() - startTime;

    return {
      success: true,
      parser: 'pdf-parse',
      text: data.text,
      numPages: data.numpages,
      metadata: {
        info: data.info,
        metadata: data.metadata,
        version: data.version,
      },
      parsingTime,
    };
  } catch (error) {
    return {
      success: false,
      parser: 'pdf-parse',
      error: error.message,
      parsingTime: Date.now() - startTime,
    };
  }
}

/**
 * Parser 2: pdfjs-dist (Mozilla's PDF.js)
 */
async function parseWithPdfJs(input) {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const startTime = Date.now();
  
  try {
    let dataBuffer;
    if (typeof input === 'string') {
      dataBuffer = await fs.readFile(input);
    } else {
      dataBuffer = input;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    const metadata = await pdfDocument.getMetadata();
    const parsingTime = Date.now() - startTime;

    return {
      success: true,
      parser: 'pdfjs-dist',
      text: fullText.trim(),
      numPages,
      metadata: metadata.info,
      parsingTime,
    };
  } catch (error) {
    return {
      success: false,
      parser: 'pdfjs-dist',
      error: error.message,
      parsingTime: Date.now() - startTime,
    };
  }
}

/**
 * Parser 3: pdf2json
 */
async function parseWithPdf2Json(input) {
  const PDFParser = require('pdf2json');
  const startTime = Date.now();

  return new Promise((resolve) => {
    try {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData) => {
        resolve({
          success: false,
          parser: 'pdf2json',
          error: errData.parserError,
          parsingTime: Date.now() - startTime,
        });
      });

      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          // Extract text from parsed data
          let text = '';
          if (pdfData.Pages) {
            pdfData.Pages.forEach(page => {
              if (page.Texts) {
                page.Texts.forEach(textItem => {
                  textItem.R.forEach(r => {
                    text += decodeURIComponent(r.T) + ' ';
                  });
                });
              }
              text += '\n\n';
            });
          }

          resolve({
            success: true,
            parser: 'pdf2json',
            text: text.trim(),
            numPages: pdfData.Pages ? pdfData.Pages.length : 0,
            metadata: pdfData.Meta,
            parsingTime: Date.now() - startTime,
          });
        } catch (error) {
          resolve({
            success: false,
            parser: 'pdf2json',
            error: error.message,
            parsingTime: Date.now() - startTime,
          });
        }
      });

      if (typeof input === 'string') {
        pdfParser.loadPDF(input);
      } else {
        // pdf2json works better with file paths
        resolve({
          success: false,
          parser: 'pdf2json',
          error: 'pdf2json requires file path, not buffer',
          parsingTime: Date.now() - startTime,
        });
      }
    } catch (error) {
      resolve({
        success: false,
        parser: 'pdf2json',
        error: error.message,
        parsingTime: Date.now() - startTime,
      });
    }
  });
}

/**
 * Parser 4: pdfreader
 */
async function parseWithPdfReader(input) {
  const PdfReader = require('pdfreader').PdfReader;
  const startTime = Date.now();

  return new Promise((resolve) => {
    try {
      const reader = new PdfReader();
      let text = '';
      let currentPage = 0;
      let pageCount = 0;

      reader.parseBuffer(
        typeof input === 'string' ? require('fs').readFileSync(input) : input,
        (err, item) => {
          if (err) {
            resolve({
              success: false,
              parser: 'pdfreader',
              error: err.message,
              parsingTime: Date.now() - startTime,
            });
          } else if (!item) {
            // End of file
            resolve({
              success: true,
              parser: 'pdfreader',
              text: text.trim(),
              numPages: pageCount,
              metadata: {},
              parsingTime: Date.now() - startTime,
            });
          } else if (item.page) {
            // New page
            currentPage = item.page;
            pageCount = Math.max(pageCount, currentPage);
            text += '\n\n';
          } else if (item.text) {
            // Text item
            text += item.text + ' ';
          }
        }
      );
    } catch (error) {
      resolve({
        success: false,
        parser: 'pdfreader',
        error: error.message,
        parsingTime: Date.now() - startTime,
      });
    }
  });
}

/**
 * Generate SHA-256 hash of text content
 */
function generateHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Compare all parsers on the same PDF
 */
async function compareAllParsers(pdfPath) {
  console.log(`\n${'='.repeat(70)}`);
  console.log('PDF PARSER COMPARISON');
  console.log(`${'='.repeat(70)}\n`);
  console.log(`📄 File: ${pdfPath}\n`);

  const results = [];

  // Test each parser
  console.log('Testing parsers...\n');

  // 1. pdf-parse
  console.log('1️⃣  Testing pdf-parse...');
  const result1 = await parseWithPdfParse(pdfPath);
  results.push(result1);
  console.log(`   Status: ${result1.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Time: ${result1.parsingTime}ms`);
  if (result1.success) {
    console.log(`   Pages: ${result1.numPages}`);
    console.log(`   Text Length: ${result1.text.length} characters`);
  } else {
    console.log(`   Error: ${result1.error}`);
  }

  // 2. pdfjs-dist
  console.log('\n2️⃣  Testing pdfjs-dist (Mozilla)...');
  const result2 = await parseWithPdfJs(pdfPath);
  results.push(result2);
  console.log(`   Status: ${result2.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Time: ${result2.parsingTime}ms`);
  if (result2.success) {
    console.log(`   Pages: ${result2.numPages}`);
    console.log(`   Text Length: ${result2.text.length} characters`);
  } else {
    console.log(`   Error: ${result2.error}`);
  }

  // 3. pdf2json
  console.log('\n3️⃣  Testing pdf2json...');
  const result3 = await parseWithPdf2Json(pdfPath);
  results.push(result3);
  console.log(`   Status: ${result3.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Time: ${result3.parsingTime}ms`);
  if (result3.success) {
    console.log(`   Pages: ${result3.numPages}`);
    console.log(`   Text Length: ${result3.text.length} characters`);
  } else {
    console.log(`   Error: ${result3.error}`);
  }

  // 4. pdfreader
  console.log('\n4️⃣  Testing pdfreader...');
  const result4 = await parseWithPdfReader(pdfPath);
  results.push(result4);
  console.log(`   Status: ${result4.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Time: ${result4.parsingTime}ms`);
  if (result4.success) {
    console.log(`   Pages: ${result4.numPages}`);
    console.log(`   Text Length: ${result4.text.length} characters`);
  } else {
    console.log(`   Error: ${result4.error}`);
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('COMPARISON SUMMARY');
  console.log(`${'='.repeat(70)}\n`);

  const successful = results.filter(r => r.success);
  const fastest = successful.reduce((prev, curr) => 
    prev.parsingTime < curr.parsingTime ? prev : curr
  , successful[0]);

  console.log('📊 Performance Ranking (fastest to slowest):');
  successful
    .sort((a, b) => a.parsingTime - b.parsingTime)
    .forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.parser}: ${result.parsingTime}ms`);
    });

  console.log(`\n🏆 Winner: ${fastest.parser} (${fastest.parsingTime}ms)`);
  console.log(`✅ Success Rate: ${successful.length}/${results.length} parsers`);

  // Generate hashes for successful parsers
  console.log('\n🔐 Content Hashes (SHA-256):');
  successful.forEach(result => {
    const hash = generateHash(result.text);
    console.log(`   ${result.parser}: ${hash.substring(0, 16)}...`);
  });

  return {
    results,
    fastest,
    successful: successful.length,
    total: results.length,
  };
}

/**
 * Parser 5: unpdf (Modern alternative to pdf-parse)
 */
async function parseWithUnpdf(input) {
  const startTime = Date.now();
  
  try {
    let dataBuffer;
    if (typeof input === 'string') {
      dataBuffer = await fs.readFile(input);
    } else {
      dataBuffer = input;
    }

    const { totalPages, text } = await extractText(new Uint8Array(dataBuffer), {
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
        pdfjs_version: '5.4.296',
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
  parseWithPdfParse,
  parseWithPdfJs,
  parseWithPdf2Json,
  parseWithPdfReader,
  parseWithUnpdf,
  generateHash,
  compareAllParsers,
};
