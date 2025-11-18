const { parseWithUnpdf } = require('../parsers/unpdfParser');

async function testUnpdf() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Usage: npm run unpdf <path-to-pdf>');
    console.log('Example: npm run unpdf /home/manu/Desktop/resume.pdf');
    console.log('\n💡 Note: unpdf is for TEXT extraction only.');
    console.log('   For hybrid text+OCR in Node.js, use: npm run hybrid <pdf>');
    process.exit(1);
  }

  const pdfPath = args[0];
  
  console.log('🚀 Testing UNPDF (Text Extraction)');
  console.log(`📄 File: ${pdfPath}`);
  console.log('═'.repeat(70));
  console.log('');
  
  try {
    const result = await parseWithUnpdf(pdfPath);
    
    if (result.success) {
      console.log('✅ UNPDF PARSING COMPLETED!\n');
      
      console.log('📊 Statistics:');
      console.log(`   Parser: ${result.parser}`);
      console.log(`   Pages: ${result.numPages}`);
      console.log(`   Text Length: ${result.text.length} characters`);
      console.log(`   PDF.js Version: ${result.metadata.pdfjs_version} (bundled)`);
      console.log('');
      
      console.log('⏱️  Performance:');
      console.log(`   Parsing Time: ${result.parsingTime}ms`);
      console.log('');
      
      console.log('═'.repeat(70));
      console.log('📄 EXTRACTED TEXT');
      console.log('═'.repeat(70));
      console.log(result.text);
      console.log('═'.repeat(70));
      
      console.log('');
      console.log('💡 unpdf advantages (for text extraction):');
      console.log('   ✓ Fast and reliable');
      console.log('   ✓ Zero dependencies (bundled PDF.js 5.4.296)');
      console.log('   ✓ Modern, maintained codebase');
      console.log('   ✓ Optimized for serverless/browser');
      console.log('');
      console.log('� Limitation: unpdf cannot do OCR in Node.js due to canvas');
      console.log('   serialization issues. For OCR, use:');
      console.log('   npm run hybrid <pdf>  (pdf2json + pdf-to-png-converter + Tesseract)');
      
    } else {
      console.log('❌ Parsing failed');
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
testUnpdf().catch(console.error);
