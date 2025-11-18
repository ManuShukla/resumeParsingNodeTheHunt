# OCR Scale Quick Reference

## 🚀 Usage

```bash
# Syntax
node src/examples/testOCR.js <pdf> [scale] [language] [--fast]

# Examples
node src/examples/testOCR.js resume.pdf              # Default (1.5x)
node src/examples/testOCR.js resume.pdf --fast       # Fast (1.0x)
node src/examples/testOCR.js resume.pdf 2.0          # Custom scale
node src/examples/testOCR.js resume.pdf 1.25 eng     # Scale + language
```

## 📊 Performance Table

| Scale | Time | Confidence | Recommendation |
|-------|------|------------|----------------|
| 0.5x  | 1.1s | 19% ❌ | Don't use |
| 0.75x | 1.1s | 58% ⚠️  | Preview only |
| **1.0x** | **3.1s** | **77%** ✅ | **Batch processing** |
| 1.25x | 3.6s | 85% ✅ | Fast + good quality |
| **1.5x** | **3.9s** | **89%** ✅ | **Default (recommended)** |
| 1.75x | 4.3s | 91% ✅ | High quality |
| **2.0x** | **4.8s** | **93%** ✅ | **Critical documents** |
| 2.5x  | 5.5s | 95% ✅ | Maximum quality |

## 🎯 When to Use

**0.75x**: Quick preview, testing only  
**1.0x**: Batch processing, development  
**1.25x**: Fast with good accuracy  
**1.5x**: Default - best all-around  
**2.0x**: High-quality scans, critical docs  
**2.5x+**: Maximum quality needed  

## 💻 Programmatic

```javascript
const { performOCR, terminateWorker } = require('./src/parsers/ocrParser');

// Custom scale
const result = await performOCR(pdfPath, {
  scale: 1.25,        // Any value 0.5-3.0
  reuseWorker: true,
  language: 'eng'
});

await terminateWorker();
```

## 🔍 Scale Selection Logic

```javascript
// Choose based on needs
const scale = 
  isBatch ? 1.0 :           // Fast for batches
  isCritical ? 2.0 :        // High quality for important docs
  1.5;                      // Default for everything else
```

## 📈 Speed vs Quality

```
Quality ↑
   95% |                    ●  2.5x
       |                 ●     2.0x
   89% |              ●        1.5x (default)
   85% |           ●           1.25x
   77% |        ●              1.0x (fast)
   58% |  ●                    0.75x
       |___________________________
       1s   2s   3s   4s   5s  → Time
```

## 💡 Pro Tips

1. **Start with default (1.5x)**, adjust if needed
2. **Use 1.0x for batch** - 20% faster, still good
3. **Use 2.0x for critical** - 93% confidence
4. **Test your documents** - quality varies
5. **Enable worker reuse** - much faster for multi-page

## 🚦 Quick Decision

- Need speed? → **1.0x**
- Need balance? → **1.5x** (default)
- Need quality? → **2.0x**
- Just testing? → **0.75x**

---

**Remember**: You can use ANY decimal value from 0.5 to 3.0!
