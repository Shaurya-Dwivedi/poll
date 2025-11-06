require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');

/**
 * Seed Script to Import Students from CSV
 * Usage: node server/scripts/seedStudents.js
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const parseCSV = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const students = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, handling potential quoted fields
    const fields = line.split(',').map(f => f.trim());
    
    if (fields.length >= 8) {
      const student = {
        sn: parseInt(fields[0]),
        name: fields[1],
        rollNo: fields[2],
        email: fields[3],
        section: fields[4],
        subGroup: fields[5],
        branch: fields[6],
        language: fields[7]
      };

      // Only add if rollNo is valid
      if (student.rollNo && student.rollNo.match(/^B24[A-Z]{2}\d{4}$/)) {
        students.push(student);
      }
    }
  }

  return students;
};

const generateUniqueDeviceCode = async () => {
  const chars = 'ABCD';
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
    
    // Check if code already exists
    const existing = await Student.findOne({ deviceCode: code });
    if (!existing) break;
    
    if (attempts >= maxAttempts) {
      throw new Error('Could not generate unique device code after 100 attempts');
    }
  } while (true);

  return code;
};

const seedStudents = async () => {
  try {
    console.log('\n🌱 Starting student data seeding...\n');

    // Path to CSV file
    const csvPath = path.join(__dirname, '../models/students list/AY 2024-25 Semester-II Slot System (B.Tech. 1st Year) - Section and Group UG 1st Year.csv');
    
    console.log(`📄 Reading CSV from: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error('CSV file not found at: ' + csvPath);
    }

    // Parse CSV
    const studentsData = parseCSV(csvPath);
    console.log(`✅ Parsed ${studentsData.length} students from CSV\n`);

    // Clear existing students (optional - comment out if you want to keep existing)
    const existingCount = await Student.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing students in database`);
      console.log('🗑️  Clearing existing students...');
      await Student.deleteMany({});
      console.log('✅ Cleared existing students\n');
    }

    // Insert students with device codes
    console.log('📥 Inserting students into database...\n');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < studentsData.length; i++) {
      try {
        const studentData = studentsData[i];
        
        // Generate unique device code
        studentData.deviceCode = await generateUniqueDeviceCode();
        
        // Create student
        await Student.create(studentData);
        successCount++;
        
        // Progress indicator
        if ((i + 1) % 50 === 0 || i === studentsData.length - 1) {
          console.log(`   Processed ${i + 1}/${studentsData.length} students...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error inserting student ${studentsData[i].rollNo}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Results:`);
    console.log(`   ✅ Successfully inserted: ${successCount} students`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Total in database: ${await Student.countDocuments()}`);
    console.log('='.repeat(60) + '\n');

    // Display sample students with device codes
    console.log('📋 Sample Students (first 5):');
    const samples = await Student.find().limit(5);
    samples.forEach(s => {
      console.log(`   ${s.rollNo} - ${s.name} - Code: ${s.deviceCode}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Main execution
const run = async () => {
  await connectDB();
  await seedStudents();
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  console.log('✅ Seeding script completed successfully!\n');
  process.exit(0);
};

run();
