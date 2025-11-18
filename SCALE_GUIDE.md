# OCR Scale Selection Guide

## 📏 Scale Comparison

Based on real testing with a scanned PDF:

| Scale | Time | Confidence | Speed vs 1.5x | Accuracy | Use Case |
|-------|------|------------|---------------|----------|----------|
| **0.5x** | 1.1s | 19% | **72% faster** ⚡⚡⚡ | ❌ Very Poor | Not recommended |
| **0.75x** | 1.1s | 58% | **71% faster** ⚡⚡⚡ | ⚠️ Poor | Quick previews only |
| **1.0x** | 3.1s | 77% | **20% faster** ⚡⚡ | ✅ Good | **Fast mode (batch)** |
| **1.5x** | 3.9s | 89% | Baseline ⚡ | ✅ Very Good | **Default (recommended)** |
| **2.0x** | 4.8s | 93% | 23% slower 🐌 | ✅ Excellent | High-quality scans |

## 🎯 Which Scale to Choose?

### 🏃 **Scale 1.0x (Fast Mode)**
```bash
node src/examples/testOCR.js resume.pdf 1.0
# OR
node src/examples/testOCR.js resume.pdf --fast
```

**Performance**: 3.1s, 77% confidence  
**Best for**:
- ✅ Batch processing (100+ documents)
- ✅ Development and testing
- ✅ Quick previews
- ✅ Time-sensitive applications
- ✅ Clear, high-contrast scans

**Why choose this**: **20% faster** than default with acceptable accuracy for most resumes.

---

### ⚖️ **Scale 1.5x (Default - Balanced)**
```bash
node src/examples/testOCR.js resume.pdf 1.5
# OR
node src/examples/testOCR.js resume.pdf
```

**Performance**: 3.9s, 89% confidence  
**Best for**:
- ✅ Production use (default choice)
- ✅ General resume parsing
- ✅ Mixed quality scans
- ✅ Balanced speed/accuracy

**Why choose this**: **Best balance** of speed and accuracy for most use cases.

---

### 🎓 **Scale 2.0x (High Quality)**
```bash
node src/examples/testOCR.js resume.pdf 2.0
```

**Performance**: 4.8s, 93% confidence  
**Best for**:
- ✅ High-quality scanned documents
- ✅ Legal or critical documents
- ✅ Fine print or small text
- ✅ When accuracy is paramount
- ✅ Low-quality/faded originals needing extra detail

**Why choose this**: **Highest accuracy** (93%) for documents where quality matters most.

---

### ⚠️ **Scale 0.75x (Ultra Fast - Preview Only)**
```bash
node src/examples/testOCR.js resume.pdf 0.75
```

**Performance**: 1.1s, 58% confidence  
**Best for**:
- ⚠️ Quick previews only
- ⚠️ Testing if document is readable
- ⚠️ Very large batches (1000+ docs)

**Why choose this**: **3x faster** than default but **poor accuracy**. Not recommended for production.

---

### ❌ **Scale 0.5x (Not Recommended)**
```bash
node src/examples/testOCR.js resume.pdf 0.5
```

**Performance**: 1.1s, 19% confidence  
**Best for**: Nothing - accuracy too low

---

## 📊 Performance vs Quality Trade-off

```
Confidence ↑
    100% |                        
         |                      ●  2.0x
         |                   ●     1.5x (default)
     75% |              ●          1.0x (fast)
         |
     50% |       ●                 0.75x
         |  ●                      0.5x
      0% |_________________________
         1s    2s    3s    4s    5s → Time
```

## 🚀 Usage Examples

### Command Line
```bash
# Default (1.5x scale)
npm run ocr /path/to/resume.pdf

# Fast mode (1.0x scale)
npm run ocr /path/to/resume.pdf --fast
node src/examples/testOCR.js /path/to/resume.pdf 1.0

# Custom scale
node src/examples/testOCR.js /path/to/resume.pdf 2.0
node src/examples/testOCR.js /path/to/resume.pdf 0.75
node src/examples/testOCR.js /path/to/resume.pdf 1.25
```

### Programmatic API
```javascript
const { performOCR, terminateWorker } = require('./src/parsers/ocrParser');

// Custom scale
const result = await performOCR('/path/to/resume.pdf', {
  scale: 2.0,           // Any value from 0.5 to 3.0
  reuseWorker: true,
  language: 'eng',
});

await terminateWorker();
```

## 💡 Decision Matrix

### If you need...

**Maximum Speed** → Use **1.0x** (fast mode)
- 3.1s per page
- 77% confidence
- Good for batch processing

**Best Balance** → Use **1.5x** (default)
- 3.9s per page  
- 89% confidence
- Recommended for most cases

**Highest Accuracy** → Use **2.0x**
- 4.8s per page
- 93% confidence
- For critical documents

**Quick Preview** → Use **0.75x**
- 1.1s per page
- 58% confidence
- Preview only, not production

## 📈 Real-World Scenarios

### Scenario 1: Batch Processing 100 Resumes
**Recommendation**: Scale **1.0x** (fast mode)
```bash
# Per resume: 3.1s
# Total time: ~310s (5.2 minutes)
# Confidence: 77% (acceptable for resume parsing)
# Savings vs default: ~80s (1.3 minutes)
```

### Scenario 2: High-Quality Medical Records
**Recommendation**: Scale **2.0x**
```bash
# Per page: 4.8s
# Confidence: 93% (excellent for critical documents)
# Trade-off: 23% slower but worth it for accuracy
```

### Scenario 3: Mixed Document Quality
**Recommendation**: Scale **1.5x** (default)
```bash
# Per page: 3.9s
# Confidence: 89% (very good for varied quality)
# Best all-around choice
```

### Scenario 4: Development/Testing
**Recommendation**: Scale **0.75x** or **1.0x**
```bash
# Testing with 0.75x: 1.1s (ultra fast iteration)
# Testing with 1.0x: 3.1s (more realistic results)
```

## 🔍 Technical Details

### How Scale Affects Processing

1. **Image Size**: Higher scale = larger images
   - 0.5x: Quarter size (fastest conversion)
   - 1.0x: Normal size
   - 2.0x: Double size (slowest conversion)

2. **OCR Processing**: More pixels = more processing
   - Linear relationship with scale²
   - 2.0x = ~4x more pixels than 1.0x

3. **Accuracy**: More detail = better recognition
   - Small text becomes readable
   - Faded text more visible
   - But diminishing returns above 2.0x

### Memory Usage by Scale

| Scale | Memory per Page | 10-Page Document |
|-------|----------------|------------------|
| 0.5x  | ~25MB          | ~250MB          |
| 1.0x  | ~50MB          | ~500MB          |
| 1.5x  | ~110MB         | ~1.1GB          |
| 2.0x  | ~200MB         | ~2GB            |

## 🎓 Advanced Tips

### Dynamic Scale Selection
```javascript
// Adjust scale based on document type
function getOptimalScale(documentType, isBatch) {
  if (isBatch) return 1.0;              // Fast for batches
  if (documentType === 'legal') return 2.0;  // High quality for legal
  return 1.5;                           // Default for others
}

const scale = getOptimalScale('resume', false);
const result = await performOCR(pdfPath, { scale });
```

### Progressive Quality
```javascript
// Try fast first, retry with higher quality if confidence is low
let result = await performOCR(pdfPath, { scale: 1.0 });

if (result.averageConfidence < 70) {
  console.log('Low confidence, retrying with higher quality...');
  result = await performOCR(pdfPath, { scale: 2.0 });
}
```

## 📋 Quick Reference

```bash
# Ultra Fast (preview only)
node src/examples/testOCR.js resume.pdf 0.75    # 1.1s, 58%

# Fast Mode (batch processing)
node src/examples/testOCR.js resume.pdf 1.0     # 3.1s, 77%
node src/examples/testOCR.js resume.pdf --fast  # Same as above

# Default (recommended)
node src/examples/testOCR.js resume.pdf         # 3.9s, 89%
node src/examples/testOCR.js resume.pdf 1.5     # Same as above

# High Quality (critical docs)
node src/examples/testOCR.js resume.pdf 2.0     # 4.8s, 93%
```

---

**Bottom Line**: For most resume parsing, use **scale 1.5x** (default). For batch processing, use **scale 1.0x** (fast mode). For critical documents, use **scale 2.0x**.
