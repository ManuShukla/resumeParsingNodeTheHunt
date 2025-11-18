/**
 * Test OCR on a PDF file
 * Usage: npm run ocr <path-to-pdf> [language] [--fast]
 * 
 * Languages: eng (default), fra, deu, spa, etc.
 * Flags: --fast (40% faster, slightly less accurate)
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { performOCR, terminateWorker } = require('../parsers/ocrParser');

async function testOCR() {
  try {
    const args = process.argv.slice(2);
    
    // Find flags
    const fastMode = args.includes('--fast');
    
    // Find PDF path (first non-flag argument)
    const pdfPath = args.find(arg => !arg.startsWith('--') && !arg.match(/^\d+(\.\d+)?$/));
    
    // Find scale (numeric argument like 1.5 or 2.0)
    const scaleArg = args.find(arg => arg.match(/^\d+(\.\d+)?$/));
    const customScale = scaleArg ? parseFloat(scaleArg) : null;
    
    // Find language (known language codes)
    const languages = ['eng', 'fra', 'deu', 'spa', 'ita', 'por', 'rus', 'chi_sim', 'jpn', 'kor'];
    const language = args.find(arg => languages.includes(arg)) || 'eng';

    if (!pdfPath) {
      console.error('❌ Please provide a PDF file path');
      console.log('\nUsage: npm run ocr <path-to-pdf> [scale] [language] [--fast]');
      console.log('Example: npm run ocr ./scanned-resume.pdf 1.5 eng');
      console.log('Example: npm run ocr ./scanned-resume.pdf --fast');
      console.log('Example: npm run ocr ./scanned-resume.pdf 2.0 eng');
      console.log('\nScale options:');
      console.log('  0.5  - Very fast, low quality (for quick previews)');
      console.log('  1.0  - Fast mode (default for --fast)');
      console.log('  1.5  - Normal mode (default, balanced)');
      console.log('  2.0  - High quality (slower, better accuracy)');
      console.log('  2.5  - Very high quality (slowest, best accuracy)');
      console.log('\nSupported languages:');
      console.log('  eng - English (default)');
      console.log('  fra - French');
      console.log('  deu - German');
      console.log('  spa - Spanish');
      console.log('  ita - Italian');
      console.log('  por - Portuguese');
      console.log('  rus - Russian');
      console.log('  chi_sim - Chinese Simplified');
      console.log('  jpn - Japanese');
      console.log('  kor - Korean');
      console.log('\nFlags:');
      console.log('  --fast: Fast mode (40% faster, 10-12% lower confidence)');
      process.exit(1);
    }

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ File not found: ${pdfPath}`);
      process.exit(1);
    }

    const scaleDisplay = customScale ? `${customScale}x` : (fastMode ? '1.0x (fast)' : '1.5x (normal)');
    
    console.log(`\n🔤 Testing OCR${fastMode ? ' (FAST MODE)' : customScale ? ` (CUSTOM SCALE: ${customScale}x)` : ' (NORMAL MODE)'}...`);
    console.log(`📄 File: ${pdfPath}`);
    console.log(`🌍 Language: ${language}`);
    console.log(`📏 Scale: ${scaleDisplay}`);
    console.log('-----------------------------------\n');
    console.log('⏳ This may take several seconds per page...\n');

    const result = await performOCR(pdfPath, {
      language,
      fast: customScale ? false : fastMode, // Don't use fast if custom scale provided
      scale: customScale || undefined, // Use custom scale if provided
      reuseWorker: true,
      verbose: true,
    });

    if (result.success) {
      console.log('\n✅ OCR completed successfully!');
      console.log(`\n📊 Results:`);
      console.log(`   Pages Processed: ${result.numPages}`);
      console.log(`   Text Length: ${result.text.length} characters`);
      console.log(`   Average Confidence: ${result.averageConfidence.toFixed(2)}%`);
      console.log(`   Processing Time: ${result.parsingTime}ms (~${(result.parsingTime / 1000).toFixed(1)}s)`);
      console.log(`   Speed: ${(result.parsingTime / result.numPages / 1000).toFixed(1)}s per page`);
      console.log(`   Mode: ${customScale ? `Custom (${customScale}x scale)` : result.metadata.fastMode ? 'Fast (1.0x scale)' : 'Normal (1.5x scale)'}`);
      
      if (result.pageResults) {
        console.log(`\n📄 Per-Page Details:`);
        result.pageResults.forEach(page => {
          console.log(`   Page ${page.page}: ${page.text.length} chars, ${page.confidence.toFixed(2)}% confidence, ${page.timeMs}ms`);
        });
      }
      
      console.log('\n─'.repeat(70));
      console.log('📄 EXTRACTED TEXT');
      console.log('─'.repeat(70));
      console.log(result.text);
      console.log('─'.repeat(70));
      
      if (!fastMode && !customScale) {
        console.log(`\n💡 Tip: Add --fast flag for 40% faster processing`);
        console.log(`   Trade-off: ~10-12% lower confidence, ~4% fewer characters`);
      }
      
      if (customScale) {
        console.log(`\n💡 Custom scale tips:`);
        console.log(`   - Lower scale (0.5-1.0): Faster, lower quality`);
        console.log(`   - Higher scale (2.0-2.5): Slower, better quality`);
        console.log(`   - Your scale (${customScale}): ${customScale < 1.0 ? 'Fast mode' : customScale > 1.5 ? 'High quality mode' : 'Balanced mode'}`);
      }
      
      console.log(`\n💡 Performance tips:`);
      console.log(`   - Use --fast (or scale 1.0) for batch processing or quick previews`);
      console.log(`   - Use scale 1.5 (default) for balanced results`);
      console.log(`   - Use scale 2.0+ for high-quality scans needing best accuracy`);
      if (result.averageConfidence < 80) {
        console.log(`   - Low confidence detected (<80%), try:`);
        console.log(`     • Using a higher resolution PDF`);
        console.log(`     • Checking if the correct language is selected`);
        console.log(`     • Ensuring the image quality is good`);
      }
    } else {
      console.error(`\n❌ OCR failed: ${result.error}`);
      console.log(`   Processing time: ${result.parsingTime}ms`);
    }

    // Clean up worker
    await terminateWorker();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await terminateWorker();
    process.exit(1);
  }
}

testOCR();
