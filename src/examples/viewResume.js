/**
 * View a stored resume from database
 * Usage: npm run view <resume-id>
 */

require('dotenv').config();
const { getResumeById } = require('../services/resumeService');

async function viewResume() {
  try {
    const resumeId = parseInt(process.argv[2]);

    if (!resumeId || isNaN(resumeId)) {
      console.error('❌ Please provide a valid resume ID');
      console.log('\nUsage: npm run view <resume-id>');
      console.log('Example: npm run view 1');
      process.exit(1);
    }

    console.log(`\n🔍 Fetching resume ID: ${resumeId}...\n`);

    const result = await getResumeById(resumeId);

    if (result.success) {
      const resume = result.data;
      
      console.log('✅ Resume Found!\n');
      console.log('─'.repeat(70));
      console.log('📊 RESUME DETAILS');
      console.log('─'.repeat(70));
      console.log(`ID:              ${resume.id}`);
      console.log(`Filename:        ${resume.filename}`);
      console.log(`Content Hash:    ${resume.content_hash}`);
      console.log(`Parser Used:     ${resume.parser_used}`);
      console.log(`Pages:           ${resume.page_count}`);
      console.log(`File Size:       ${resume.file_size ? (resume.file_size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
      console.log(`Parsing Time:    ${resume.parsing_time_ms}ms`);
      console.log(`Created:         ${resume.created_at}`);
      console.log(`Updated:         ${resume.updated_at}`);
      
      console.log('\n' + '─'.repeat(70));
      console.log('📄 PARSED TEXT CONTENT');
      console.log('─'.repeat(70));
      console.log(resume.raw_text);
      console.log('─'.repeat(70));
      
      console.log(`\nText Length: ${resume.raw_text.length} characters`);
      console.log(`Word Count: ${resume.raw_text.split(/\s+/).filter(w => w.length > 0).length} words\n`);
    } else {
      console.error(`\n❌ ${result.error}\n`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

viewResume();
