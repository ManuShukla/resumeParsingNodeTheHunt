# Parser Selection Guide

## Interactive Mode (Recommended)

Simply run without specifying a parser, and you'll be prompted:

```bash
npm test /path/to/resume.pdf
```

**Menu will appear:**
```
📚 Select a parser:
  1. pdfjs-dist (Mozilla PDF.js) - Most Reliable ⭐
  2. pdf-parse - Lightweight & Fast
  3. pdf-parse - Structured Data
  4. pdfreader - Streaming API
  5. Auto (Try pdfjs-dist with fallback)

Enter your choice (1-5) [default: 1]:
```

## Command-Line Mode

Specify the parser directly in the command:

```bash
# Use pdfjs-dist (most reliable)
npm test /path/to/resume.pdf pdfjs-dist

# Use pdf-parse (lightweight)
npm test /path/to/resume.pdf pdf-parse

# Use pdf2json (structured data)
npm test /path/to/resume.pdf pdf2json

# Use pdfreader (streaming)
npm test /path/to/resume.pdf pdfreader

# Use auto mode (tries pdfjs-dist with automatic fallback)
npm test /path/to/resume.pdf auto
```

## Parser Descriptions

### 1. pdfjs-dist (Default) ⭐
- **Best for**: Most PDFs, production use
- **Pros**: Highly reliable, handles complex PDFs
- **Cons**: Slightly slower, larger library
- **When to use**: Default choice, works with most resumes

### 2. pdf-parse
- **Best for**: Simple PDFs, speed-critical applications
- **Pros**: Fast, lightweight, simple
- **Cons**: May fail on complex/protected PDFs
- **When to use**: When you need speed and PDFs are simple

### 3. pdf2json
- **Best for**: When you need positioning data
- **Pros**: Fast, preserves text positioning
- **Cons**: Complex output format, file path required
- **When to use**: Need to know where text appears on page

### 4. pdfreader
- **Best for**: Very large PDF files
- **Pros**: Memory efficient, streaming API
- **Cons**: More complex, slower
- **When to use**: Processing huge PDF files

### 5. Auto Mode
- **Best for**: Ensuring success regardless of PDF type
- **Pros**: Tries multiple parsers automatically
- **Cons**: May be slower if fallbacks are needed
- **When to use**: Want guaranteed parsing success

## Automatic Fallback

All parsers have automatic fallback:
1. Tries your selected parser first
2. If it fails, tries pdfjs-dist
3. If that fails, tries pdf-parse
4. If that fails, tries pdf2json
5. Reports which parser succeeded

Example output:
```
Parsing PDF: resume.pdf using pdf-parse
pdf-parse failed (bad XRef entry), trying fallback parsers...
Trying pdfjs-dist...
✓ Fallback successful! Using pdfjs-dist instead of pdf-parse
```

## Quick Reference

| Use Case | Recommended Parser |
|----------|-------------------|
| General use | pdfjs-dist (option 1) |
| Need speed | pdf-parse (option 2) |
| Complex PDFs | pdfjs-dist (option 1) |
| Large files | pdfreader (option 4) |
| Don't know | Auto (option 5) |

## Testing Different Parsers

Use the compare command to see how all parsers perform:

```bash
npm run compare /path/to/resume.pdf
```

This shows speed and success rate for all 4 parsers!
