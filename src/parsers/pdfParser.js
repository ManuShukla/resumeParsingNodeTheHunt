const fs = require('fs').promises;
const pdf = require('pdf-parse');

/**
 * Parse PDF file and extract text content
 * @param {string|Buffer} input - File path or buffer
 * @returns {Promise<Object>} Parsed PDF data
 */
async function parsePDF(input) {
  try {
    let dataBuffer;

    // Check if input is a file path or buffer
    if (typeof input === 'string') {
      dataBuffer = await fs.readFile(input);
    } else if (Buffer.isBuffer(input)) {
      dataBuffer = input;
    } else {
      throw new Error('Input must be a file path (string) or Buffer');
    }

    // Parse the PDF
    const data = await pdf(dataBuffer);

    return {
      success: true,
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract structured information from resume text
 * @param {string} text - Raw text from PDF
 * @returns {Object} Structured resume data
 */
function extractResumeData(text) {
  const resumeData = {
    contact: extractContactInfo(text),
    skills: extractSkills(text),
    experience: extractWorkExperience(text),
    education: extractEducation(text),
  };

  return resumeData;
}

/**
 * Extract contact information (email, phone, LinkedIn, etc.)
 */
function extractContactInfo(text) {
  const contact = {
    email: null,
    phone: null,
    linkedin: null,
    github: null,
    website: null,
    location: null,
    name: null,
  };

  // Extract email
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/gi;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    contact.email = emailMatch[0];
  }

  // Extract phone (various formats)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    contact.phone = phoneMatch[0];
  }

  // Extract LinkedIn
  const linkedinRegex = /(linkedin\.com\/in\/[\w-]+)/gi;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) {
    contact.linkedin = `https://${linkedinMatch[0].replace('https://', '').replace('http://', '')}`;
  }

  // Extract GitHub
  const githubRegex = /(github\.com\/[\w-]+)/gi;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    contact.github = `https://${githubMatch[0].replace('https://', '').replace('http://', '')}`;
  }

  // Extract website/portfolio
  const websiteRegex = /(https?:\/\/[\w\.-]+\.\w+[\w\/-]*)/gi;
  const websiteMatches = text.match(websiteRegex);
  if (websiteMatches) {
    // Filter out LinkedIn and GitHub URLs
    const websites = websiteMatches.filter(
      url => !url.includes('linkedin.com') && !url.includes('github.com')
    );
    if (websites.length > 0) {
      contact.website = websites[0];
    }
  }

  // Extract name (assume first non-empty line is name)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length > 0) {
    // Usually the name is at the top, before contact info
    const firstLine = lines[0];
    // Check if it's not an email or phone number
    if (!emailRegex.test(firstLine) && !phoneRegex.test(firstLine)) {
      contact.name = firstLine;
    }
  }

  return contact;
}

/**
 * Extract skills from resume text
 */
function extractSkills(text) {
  const skills = [];
  
  // Common skill keywords
  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node\\.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP\\.NET',
    'HTML', 'CSS', 'TypeScript', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'Jenkins', 'CI/CD', 'Agile', 'Scrum',
    'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'REST API', 'GraphQL',
    'Microservices', 'Linux', 'Bash', 'Shell Scripting'
  ];

  // Look for skills section
  const skillsSectionRegex = /(?:Skills|Technical Skills|Core Competencies)[:\s]+([\s\S]*?)(?:\n\n|Experience|Education|Projects|$)/i;
  const skillsSection = text.match(skillsSectionRegex);

  if (skillsSection) {
    const skillText = skillsSection[1];
    skillKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      if (regex.test(skillText)) {
        skills.push(keyword.replace(/\\./g, '.').replace(/\\/g, ''));
      }
    });
  } else {
    // If no skills section, search entire text
    skillKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      if (regex.test(text)) {
        skills.push(keyword.replace(/\\./g, '.').replace(/\\/g, ''));
      }
    });
  }

  return [...new Set(skills)]; // Remove duplicates
}

/**
 * Extract work experience from resume text
 */
function extractWorkExperience(text) {
  const experiences = [];
  
  // Look for experience section
  const experienceRegex = /(?:Experience|Work Experience|Professional Experience)[:\s]+([\s\S]*?)(?:Education|Skills|Projects|$)/i;
  const experienceSection = text.match(experienceRegex);

  if (experienceSection) {
    const expText = experienceSection[1];
    
    // Try to identify job entries (this is a simple heuristic)
    const lines = expText.split('\n').filter(line => line.trim().length > 0);
    
    let currentExp = null;
    
    lines.forEach(line => {
      // Check if line looks like a date range (e.g., "2020 - 2023", "Jan 2020 - Present")
      const dateRegex = /(\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[-–—]\s*(\d{4}|Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i;
      
      if (dateRegex.test(line)) {
        if (currentExp) {
          experiences.push(currentExp);
        }
        currentExp = {
          company: '',
          title: '',
          dates: line.trim(),
          description: '',
        };
      } else if (currentExp) {
        // Add to description
        if (!currentExp.company && line.length < 100) {
          currentExp.company = line.trim();
        } else if (!currentExp.title && line.length < 100) {
          currentExp.title = line.trim();
        } else {
          currentExp.description += line.trim() + ' ';
        }
      }
    });
    
    if (currentExp) {
      experiences.push(currentExp);
    }
  }

  return experiences;
}

/**
 * Extract education from resume text
 */
function extractEducation(text) {
  const education = [];
  
  // Look for education section
  const educationRegex = /(?:Education|Academic Background)[:\s]+([\s\S]*?)(?:Experience|Skills|Projects|$)/i;
  const educationSection = text.match(educationRegex);

  if (educationSection) {
    const eduText = educationSection[1];
    
    // Common degree keywords
    const degreeRegex = /(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|MBA|Associate)/i;
    
    const lines = eduText.split('\n').filter(line => line.trim().length > 0);
    
    let currentEdu = null;
    
    lines.forEach(line => {
      if (degreeRegex.test(line)) {
        if (currentEdu) {
          education.push(currentEdu);
        }
        currentEdu = {
          degree: line.trim(),
          institution: '',
          dates: '',
          details: '',
        };
      } else if (currentEdu) {
        const dateRegex = /\d{4}/;
        if (dateRegex.test(line) && !currentEdu.dates) {
          currentEdu.dates = line.trim();
        } else if (!currentEdu.institution && line.length < 100) {
          currentEdu.institution = line.trim();
        } else {
          currentEdu.details += line.trim() + ' ';
        }
      }
    });
    
    if (currentEdu) {
      education.push(currentEdu);
    }
  }

  return education;
}

module.exports = {
  parsePDF,
  extractResumeData,
  extractContactInfo,
  extractSkills,
  extractWorkExperience,
  extractEducation,
};
