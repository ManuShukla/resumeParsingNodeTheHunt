const { performOCR, terminateWorker } = require('../parsers/ocrParser');

/**
 * Test OCR performance - Normal vs Fast mode
 * Usage: node src/examples/testOCRSpeed.js <pdf_path>
 */
async function testOCRSpeed() {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('Usage: node src/examples/testOCRSpeed.js <pdf_path>');
    process.exit(1);
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  OCR PERFORMANCE COMPARISON: Normal vs Fast Mode');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`📄 Test file: ${pdfPath}\n`);
  
  try {
    // Test 1: Normal Mode (1.5x scale, reusable worker)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  TEST 1: NORMAL MODE (1.5x scale)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const normalResult = await performOCR(pdfPath, {
      fast: false,
      reuseWorker: true,
      verbose: false,
    });
    
    console.log('\n📊 Normal Mode Results:');
    console.log(`   ✓ Success: ${normalResult.success}`);
    console.log(`   ✓ Pages: ${normalResult.numPages}`);
    console.log(`   ✓ Characters: ${normalResult.text.length}`);
    console.log(`   ✓ Average confidence: ${normalResult.averageConfidence.toFixed(1)}%`);
    console.log(`   ✓ Total time: ${normalResult.parsingTime}ms`);
    console.log(`   ✓ Time per page: ${normalResult.metadata.timing.perPageMs}ms`);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Fast Mode (1.0x scale, reusable worker)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  TEST 2: FAST MODE (1.0x scale)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const fastResult = await performOCR(pdfPath, {
      fast: true,
      reuseWorker: true,
      verbose: false,
    });
    
    console.log('\n📊 Fast Mode Results:');
    console.log(`   ✓ Success: ${fastResult.success}`);
    console.log(`   ✓ Pages: ${fastResult.numPages}`);
    console.log(`   ✓ Characters: ${fastResult.text.length}`);
    console.log(`   ✓ Average confidence: ${fastResult.averageConfidence.toFixed(1)}%`);
    console.log(`   ✓ Total time: ${fastResult.parsingTime}ms`);
    console.log(`   ✓ Time per page: ${fastResult.metadata.timing.perPageMs}ms`);
    
    // Clean up worker
    await terminateWorker();
    
    // Calculate improvements
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  PERFORMANCE COMPARISON');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const timeImprovement = ((normalResult.parsingTime - fastResult.parsingTime) / normalResult.parsingTime * 100).toFixed(1);
    const confidenceDiff = (normalResult.averageConfidence - fastResult.averageConfidence).toFixed(1);
    const charDiff = normalResult.text.length - fastResult.text.length;
    
    console.log(`⏱️  Speed Improvement: ${timeImprovement}% faster`);
    console.log(`   Normal: ${normalResult.parsingTime}ms`);
    console.log(`   Fast:   ${fastResult.parsingTime}ms`);
    console.log(`   Saved:  ${normalResult.parsingTime - fastResult.parsingTime}ms\n`);
    
    console.log(`🎯 Confidence Trade-off: ${confidenceDiff}%`);
    console.log(`   Normal: ${normalResult.averageConfidence.toFixed(1)}%`);
    console.log(`   Fast:   ${fastResult.averageConfidence.toFixed(1)}%\n`);
    
    console.log(`📝 Character Difference: ${charDiff} chars`);
    console.log(`   Normal: ${normalResult.text.length} chars`);
    console.log(`   Fast:   ${fastResult.text.length} chars\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  RECOMMENDATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (Math.abs(parseFloat(confidenceDiff)) < 5 && Math.abs(charDiff) < 50) {
      console.log('✅ Fast mode recommended: Minimal accuracy loss with significant speed gain!');
    } else if (parseFloat(timeImprovement) > 30) {
      console.log('⚖️  Fast mode recommended for batch processing: Speed gain outweighs minor accuracy loss.');
    } else {
      console.log('🎯 Normal mode recommended: Better accuracy with acceptable performance.');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await terminateWorker();
    process.exit(1);
  }
}

testOCRSpeed();
