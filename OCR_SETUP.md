# OCR (Optical Character Recognition) Setup Guide

## What is OCR?

OCR extracts text from **images** within PDFs, such as:
- Scanned documents
- Screenshots
- Photos of resumes
- Images embedded in PDFs

## Installation

OCR support is now included! The following packages are installed:
- `tesseract.js` - Free, open-source OCR engine
- `pdf-img-convert` - Converts PDF pages to images

## Usage

### Test OCR on a PDF:

```bash
npm run ocr /path/to/scanned-resume.pdf
```

### With different language:

```bash
npm run ocr /path/to/resume.pdf fra  # French
npm run ocr /path/to/resume.pdf deu  # German
npm run ocr /path/to/resume.pdf spa  # Spanish
```

### Supported Languages:

- `eng` - English (default)
- `fra` - French
- `deu` - German
- `spa` - Spanish
- `ita` - Italian
- `por` - Portuguese
- `rus` - Russian
- `chi_sim` - Chinese Simplified
- `jpn` - Japanese
- `kor` - Korean
- Many more...

## How It Works

1. **Converts PDF to Images** - Each page becomes a high-res image
2. **Runs OCR** - Tesseract extracts text from images
3. **Returns Text** - Combined text from all pages

### Processing Time:
- Regular PDF parsing: ~300ms per resume
- OCR parsing: ~3-5 seconds per page
- Example: 2-page scanned resume = ~10 seconds

## Smart Parsing (Automatic OCR Detection)

The system can automatically detect if OCR is needed:

```javascript
const { smartParse } = require('./src/parsers/ocrParser');
const { parseWithPdfJs } = require('./src/parsers/allParsers');

// Automatically uses OCR if regular parsing finds minimal text
const result = await smartParse(pdfPath, parseWithPdfJs);

if (result.usedOCR) {
  console.log('Used OCR! Confidence:', result.metadata.ocrConfidence);
}
```

## Integration with Resume Service

To add OCR to your resume processing:

### Option 1: Manual OCR
```bash
# Test if a PDF needs OCR
npm run compare /path/to/resume.pdf

# If parsers fail or extract very little text:
npm run ocr /path/to/resume.pdf
```

### Option 2: Automatic Detection (Recommended)

The system automatically detects scanned PDFs:
- If text extraction < 50 chars/page → Uses OCR
- If regular parsing fails → Tries OCR
- Otherwise → Uses regular parsing (faster)

## Performance Comparison

| Type | Method | Time | Accuracy |
|------|--------|------|----------|
| Regular PDF | pdfjs-dist | ~300ms | 99% |
| Scanned PDF | Regular parser | ~300ms | 0% (no text) |
| Scanned PDF | OCR | ~5s/page | 85-95% |

## OCR Confidence Levels

- **90-100%**: Excellent - Clear, high-quality scan
- **80-90%**: Good - Readable text
- **70-80%**: Fair - May have some errors
- **<70%**: Poor - Low quality, many errors

## Example Output

```
🔤 Processing page 1/2 with OCR...
   recognizing text: 100%
✓ Page 1 completed (confidence: 92.45%)

🔤 Processing page 2/2 with OCR...
   recognizing text: 100%
✓ Page 2 completed (confidence: 89.32%)

✅ OCR completed successfully!

📊 Results:
   Pages Processed: 2
   Text Length: 1543 characters
   Average Confidence: 90.89%
   Processing Time: 8934ms (~8.9s)
   Speed: 4.5s per page

──────────────────────────────────────────────
📄 EXTRACTED TEXT
──────────────────────────────────────────────
John Doe
Software Engineer
...
```

## When to Use OCR

✅ **Use OCR for:**
- Scanned paper resumes
- Photos of resumes
- Screenshots
- PDFs with images containing text
- Old documents

❌ **Don't use OCR for:**
- Regular digital PDFs (use pdfjs-dist - much faster!)
- PDFs with embedded text
- Modern resumes from Word/Google Docs

## Tips for Better OCR Results

1. **Higher Resolution**: Better image = better OCR
2. **Good Lighting**: For scanned documents
3. **Clear Text**: No blur or distortion
4. **Correct Language**: Use the right language code
5. **Clean Background**: Avoid noise/patterns

## Cost

✅ **Tesseract.js is 100% FREE**
- No API costs
- No usage limits
- Runs locally
- Open source

## Limitations

- **Slower**: ~5 seconds per page vs 0.3 seconds
- **Not 100% accurate**: Especially with poor quality
- **CPU intensive**: Uses more processing power
- **No handwriting**: Can't read handwritten text

## Alternative: Commercial OCR

For production with budget, consider:

### Google Cloud Vision API
```bash
npm install @google-cloud/vision
```
- Cost: $1.50 per 1000 pages
- Accuracy: 98-99%
- Speed: ~1 second per page
- Better with complex layouts

### AWS Textract
```bash
npm install @aws-sdk/client-textract
```
- Cost: $1.50 per 1000 pages
- Excellent for forms/tables
- Fast processing

## Current Project Status

✅ OCR support added with Tesseract.js
✅ Free and open source
✅ Works offline
✅ Automatic detection available
✅ Multi-language support

Ready to use: `npm run ocr <pdf-file>`
