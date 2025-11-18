/**
 * Test script to parse a sample PDF resume
 * Usage: npm test <path-to-pdf> [parser]
 * Parser options: pdf-parse, pdfjs-dist, pdf2json, pdfreader
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { processAndStoreResume } = require('../services/resumeService');

// Available parsers
const PARSERS = {
  '1': { name: 'pdfjs-dist', description: 'Mozilla PDF.js (Most Reliable)' },
  '2': { name: 'pdf-parse', description: 'pdf-parse (Lightweight & Fast)' },
  '3': { name: 'pdf2json', description: 'pdf2json (Structured Data)' },
  '4': { name: 'pdfreader', description: 'pdfreader (Streaming API)' },
};

function askForParser() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n📚 Select a parser:');
    console.log('  1. pdfjs-dist (Mozilla PDF.js) - Most Reliable ⭐');
    console.log('  2. pdf-parse - Lightweight & Fast');
    console.log('  3. pdf2json - Structured Data');
    console.log('  4. pdfreader - Streaming API');
    console.log('  5. Auto (Try pdfjs-dist with fallback)');
    
    rl.question('\nEnter your choice (1-5) [default: 1]: ', (answer) => {
      rl.close();
      const choice = answer.trim() || '1';
      
      if (choice === '5') {
        resolve('auto');
      } else if (PARSERS[choice]) {
        resolve(PARSERS[choice].name);
      } else {
        console.log('Invalid choice, using default (pdfjs-dist)');
        resolve('pdfjs-dist');
      }
    });
  });
}

async function testParser() {
  try {
    // Get PDF path from command line argument
    const pdfPath = process.argv[2];
    let selectedParser = process.argv[3]; // Optional parser argument

    if (!pdfPath) {
      console.error('❌ Please provide a PDF file path');
      console.log('\nUsage: npm test <path-to-pdf> [parser]');
      console.log('Example: npm test ./sample-resume.pdf pdfjs-dist');
      console.log('\nAvailable parsers:');
      console.log('  - pdfjs-dist (default, most reliable)');
      console.log('  - pdf-parse (lightweight)');
      console.log('  - pdf2json (structured)');
      console.log('  - pdfreader (streaming)');
      console.log('  - auto (try pdfjs-dist with fallback)');
      process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ File not found: ${pdfPath}`);
      process.exit(1);
    }

    console.log('\n🔍 Testing PDF Parser with Database Storage...');
    console.log(`📄 File: ${pdfPath}`);
    
    // If parser not provided as argument, ask user
    if (!selectedParser) {
      selectedParser = await askForParser();
    }
    
    console.log(`\n🔧 Selected Parser: ${selectedParser === 'auto' ? 'Auto (pdfjs-dist with fallback)' : selectedParser}`);
    console.log('-----------------------------------\n');

    const filename = path.basename(pdfPath);
    const stats = fs.statSync(pdfPath);
    
    // Use 'auto' for automatic parser selection, or specific parser name
    const parserToUse = selectedParser === 'auto' ? 'pdfjs-dist' : selectedParser;
    
    const result = await processAndStoreResume(
      pdfPath,
      filename,
      pdfPath,
      stats.size,
      parserToUse
    );

    if (result.success) {
      console.log('\n✅ Success! Resume parsed and stored in database.');
      console.log(`\n📊 Results:`);
      console.log(`   Resume ID: ${result.resumeId}`);
      console.log(`   Content Hash: ${result.hash}`);
      console.log(`   Pages: ${result.numPages}`);
      console.log(`   Text Length: ${result.textLength} characters`);
      console.log(`   Parsing Time: ${result.parsingTime}ms`);
      console.log(`   Parser Used: ${result.parserUsed}`);
      
      // Print parsed data
      if (result.parsedText) {
        console.log(`\n📄 Parsed Text Content:`);
        console.log('─'.repeat(70));
        console.log(result.parsedText);
        console.log('─'.repeat(70));
      }
      
      console.log(`\n💡 You can retrieve this resume using:`);
      console.log(`   GET /api/resume/${result.resumeId}`);
      console.log(`   GET /api/resume/search/hash?hash=${result.hash}`);
    } else if (result.duplicate) {
      console.log('\n⚠️  Duplicate detected!');
      console.log(`   ${result.message}`);
      console.log(`   Existing Resume ID: ${result.existingId}`);
      console.log(`   Content Hash: ${result.hash}`);
    } else {
      console.error('\n❌ Error:', result.error);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testParser();
