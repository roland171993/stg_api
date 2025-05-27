require('dotenv').config();
const mongoose    = require('mongoose');
const { faker }   = require('@faker-js/faker');

// import your models
const User        = require('../src/models/user.model');           // :contentReference[oaicite:0]{index=0}
const Job         = require('../src/models/job.model');            // :contentReference[oaicite:1]{index=1}
const Resume      = require('../src/models/resume.model');         // :contentReference[oaicite:2]{index=2}
const CoverLetter = require('../src/models/cover-letter.model');   // :contentReference[oaicite:3]{index=3}

async function seed() {
  // 1) connect
  await mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // 2) wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Resume.deleteMany({}),
    CoverLetter.deleteMany({})
  ]);

  // 3) create 100 users
  const userPromises = [];
  for (let i = 0; i < 100; i++) {
    userPromises.push(User.create({
      username: faker.internet.username(),
      password: faker.internet.password(8)   // will be hashed by your pre-save hook
    }));
  }
  const users = await Promise.all(userPromises);

  // 4) create 100 jobs
  const sectorOptions      = ['IT','Finance','Healthcare','Education','Retail'];
  const genderOptions      = ['Any','Male','Female'];
  const contractOptions    = ['Full-time','Part-time','Contract','Temporary'];
  const workModeOptions    = ['On-site','Remote','Hybrid'];
  const educationOptions   = ['High School','Associate','Bachelor','Master','PhD'];

  const jobPromises = [];
  for (let i = 0; i < 100; i++) {
    jobPromises.push(Job.create({
      title:          faker.lorem.words(4),
      description:    faker.lorem.sentences(2),
      authorEmail:    faker.internet.email(),
      authorWebsite:  faker.internet.url(),
      authorMobile1:  faker.phone.number(),
      authorLongitude:faker.location.longitude(),
      authorLatitude: faker.location.latitude(),
      company:        faker.company.name(),
      companyLogoUrl: faker.image.avatar(),
      salary:         `${faker.number.int({min:30000,max:150000})}`,
      city:           faker.location.city(),
      experience:     `${faker.number.int({min:0,max:10})} years`,
      educationLevel: faker.helpers.arrayElement(educationOptions),
      sector: {
        id:   faker.string.uuid(),
        name: faker.helpers.arrayElement(sectorOptions)
      },
      gender: {
        id:   faker.string.uuid(),
        name: faker.helpers.arrayElement(genderOptions)
      },
      contractType: {
        id:   faker.string.uuid(),
        name: faker.helpers.arrayElement(contractOptions)
      },
      workMode: {
        id:   faker.string.uuid(),
        name: faker.helpers.arrayElement(workModeOptions)
      },
      deadline: faker.date.soon(60)
    }));
  }
  await Promise.all(jobPromises);

  // 5) create 100 resumes
  const resumePromises = [];
  for (let i = 0; i < 100; i++) {
    resumePromises.push(Resume.create({
      title:       `${faker.name.firstName()} ${faker.name.lastName()} CV`,
      downloadUrl: faker.internet.url(),
      content:     faker.lorem.paragraphs(2)
    }));
  }
  await Promise.all(resumePromises);

  // 6) create 100 cover letters
  const coverLetterPromises = [];
  for (let i = 0; i < 100; i++) {
    coverLetterPromises.push(CoverLetter.create({
      title:   `Cover Letter for ${faker.company.name()}`,
      content: faker.lorem.paragraphs(2)
    }));
  }
  await Promise.all(coverLetterPromises);

  console.log('✅  Database seeded with 100 users, jobs, resumes & cover letters.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});