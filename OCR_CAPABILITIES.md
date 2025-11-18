# OCR Support for Resume Parsing

## Current Limitation

**pdfjs-dist and all other PDF parsers CANNOT extract text from images.**

They can only extract:
- ✅ Real text embedded in PDF
- ✅ Text rendered with fonts
- ❌ Text in images/screenshots
- ❌ Scanned documents
- ❌ Text in logos/graphics

## Why This Matters for Resumes

Some resumes may have:
- Screenshots of projects/code
- Scanned copies
- Images with text
- Logos with company names
- Charts/graphs with labels

**These will be missed by current parsers!**

## Solutions for OCR

### Option 1: Tesseract.js (Free, Open Source)

**Pros:**
- Free and open source
- Runs in Node.js
- Supports 100+ languages
- No external dependencies after installation

**Cons:**
- Slower (1-5 seconds per page)
- Lower accuracy than commercial solutions
- Requires image extraction first

**Implementation:**
```bash
npm install tesseract.js pdf-to-img
```

### Option 2: Google Cloud Vision API (Commercial)

**Pros:**
- Very high accuracy
- Fast (< 1 second)
- Handles complex layouts
- Multi-language support

**Cons:**
- Costs money ($1.50 per 1000 pages)
- Requires Google Cloud account
- Network dependency

### Option 3: AWS Textract (Commercial)

**Pros:**
- Excellent accuracy
- Understands forms/tables
- Fast processing
- Integrates with AWS

**Cons:**
- Costs money ($1.50 per 1000 pages)
- Requires AWS account
- Network dependency

### Option 4: Azure Computer Vision (Commercial)

**Pros:**
- High accuracy
- Fast processing
- Good for business use

**Cons:**
- Costs money
- Requires Azure account
- Network dependency

## Recommended Approach

### For Most Users (Free Solution):

**Hybrid Approach:**
1. Use pdfjs-dist for regular text extraction (fast, free)
2. Add Tesseract.js for scanned/image text (slower, free)
3. Only run OCR if needed (detect scanned PDFs)

### For Production/Business (Paid Solution):

**Google Cloud Vision or AWS Textract:**
- Much faster and more accurate
- Worth the cost for business use
- Better handling of complex layouts

## How to Detect if OCR is Needed

Check if PDF has minimal text but has images:

```javascript
const parseResult = await parseWithPdfJs(pdfPath);

// If very little text extracted, might be scanned
if (parseResult.text.length < 100 && parseResult.numPages > 0) {
  console.log('⚠️  Warning: Very little text found.');
  console.log('This might be a scanned PDF that requires OCR.');
}
```

## Current Project Status

**Current capabilities:**
- ✅ Extract text from standard PDFs
- ✅ Handle ReportLab, LaTeX, Word-generated PDFs
- ✅ Parse embedded text
- ❌ NO OCR support yet

**To add OCR, you would need to:**
1. Install an OCR library
2. Extract images from PDF
3. Run OCR on each image
4. Combine results with regular text extraction

## Cost Comparison

**Processing 1000 resumes (average 2 pages each = 2000 pages):**

| Solution | Cost | Speed per Resume |
|----------|------|------------------|
| pdfjs-dist only | $0 | ~0.3 seconds |
| Tesseract.js (free) | $0 | ~5 seconds |
| Google Vision API | $3 | ~1 second |
| AWS Textract | $3 | ~1 second |
| Azure CV | $3 | ~1 second |

## Recommendation for Your Project

**For resume parsing from job applications:**

1. **Start with pdfjs-dist (current solution)** ✅
   - 95% of resumes have embedded text
   - Fast and free
   - Good enough for most cases

2. **Add warning detection:**
   - Warn if very little text extracted
   - Flag as "possible scanned PDF"
   - Manual review or resubmit request

3. **Optional: Add Tesseract.js later** (if needed)
   - Only for flagged resumes
   - Free but slower
   - Better than nothing

4. **For production with budget:**
   - Use Google Cloud Vision API
   - Much better results
   - Worth the cost for business

## Example: Scanned vs Regular PDF

**Regular PDF (works with current setup):**
```
Text extracted: "John Doe, Software Engineer, 5 years experience..."
Length: 1859 characters ✅
OCR needed: No
```

**Scanned PDF (needs OCR):**
```
Text extracted: ""
Length: 0 characters ❌
OCR needed: Yes
```

## Bottom Line

**pdfjs-dist CANNOT read text in images.**

If you need OCR:
- **Free**: Add Tesseract.js (~5 sec/resume)
- **Paid**: Use Google Vision (~1 sec/resume, $3/1000)

For most resume parsing: **pdfjs-dist alone is sufficient** since 95%+ of resumes have embedded text, not images.
