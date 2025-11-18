const { hybridParse } = require('../parsers/ocrParser');
const { parseWithPdf2Json } = require('../parsers/allParsers'); // Use pdf2json instead of pdfjs to avoid version conflict

async function testHybridMode() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Usage: npm run hybrid <path-to-pdf>');
    console.log('Example: npm run hybrid /home/manu/Desktop/resume.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];
  
  console.log('🔀 Testing HYBRID MODE (Regular PDF + OCR)');
  console.log(`📄 File: ${pdfPath}`);
  console.log('═'.repeat(70));
  console.log('');
  
  try {
    const result = await hybridParse(pdfPath, parseWithPdf2Json, {
      language: 'eng',
      verbose: true,  // Enable verbose to see what's happening
    });
    
    if (result.success) {
      console.log('═'.repeat(70));
      console.log('✅ HYBRID PARSING COMPLETED!\n');
      
      console.log('📊 Statistics:');
      console.log(`   Regular PDF Text: ${result.metadata.regularTextLength} characters`);
      console.log(`   OCR Text: ${result.metadata.ocrTextLength} characters`);
      console.log(`   Combined Text: ${result.metadata.combinedTextLength} characters`);
      console.log(`   Duplicates Removed: ${result.metadata.duplicateCharsRemoved} lines`);
      console.log(`   OCR Confidence: ${result.metadata.ocrConfidence?.toFixed(2)}%`);
      console.log('');
      
      console.log('⏱️  Performance:');
      console.log(`   Regular Parsing: ${result.metadata.breakdown.regularParsing}ms`);
      console.log(`   OCR Processing: ${result.metadata.breakdown.ocrParsing}ms`);
      console.log(`   Total Time: ${result.metadata.breakdown.total}ms (~${(result.metadata.breakdown.total / 1000).toFixed(1)}s)`);
      console.log('');
      
      console.log('═'.repeat(70));
      console.log('📄 COMBINED TEXT (Regular + OCR)');
      console.log('═'.repeat(70));
      console.log(result.text);
      console.log('═'.repeat(70));
      
      console.log('');
      console.log('💡 Tip: The hybrid mode ensures you capture:');
      console.log('   • Native PDF text (fast & accurate)');
      console.log('   • Text from embedded images');
      console.log('   • Text from charts, logos, and graphics');
      console.log('   • Everything in scanned sections');
      
    } else {
      console.log('❌ Hybrid parsing failed');
      console.log(`Error: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testHybridMode().catch(console.error);
