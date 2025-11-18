/**
 * Compare different PDF parsing libraries
 * Usage: npm run compare <path-to-pdf>
 */

const { compareAllParsers } = require('../parsers/allParsers');

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error('❌ Please provide a PDF file path');
    console.log('\nUsage: npm run compare <path-to-pdf>');
    console.log('Example: npm run compare ./sample-resume.pdf');
    process.exit(1);
  }

  try {
    await compareAllParsers(pdfPath);
    
    console.log('\n📝 Notes:');
    console.log('   • pdf-parse: Best for simple text extraction, lightweight');
    console.log('   • pdfjs-dist: Most reliable, handles complex PDFs, maintained by Mozilla');
    console.log('   • pdf2json: Good for structured data, preserves positioning');
    console.log('   • pdfreader: Memory efficient, streaming API');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Comparison failed:', error.message);
    process.exit(1);
  }
}

main();
