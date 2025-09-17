require('dotenv').config();
const mongoose    = require('mongoose');
const { faker }   = require('@faker-js/faker');


const User        = require('../src/models/user.model');
const Job         = require('../src/models/job.model');
const Resume      = require('../src/models/resume.model');
const CoverLetter = require('../src/models/cover-letter.model');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seed() {
  // 1) connect
  await mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // 2) wipe existing data
  await User.deleteMany({});
  await Job.deleteMany({});
  await Resume.deleteMany({});
  await CoverLetter.deleteMany({});

  // 3) create 100 users (sequential)
  const users = [];
  for (let i = 0; i < 100; i++) {
    const user = new User({
      username: faker.internet.username(),
      password: faker.internet.password(8)   // hashed by pre-save hook
    });
    await user.save();
    users.push(user);
  }

  // 4) create 100 jobs (sequential)
  const sectorOptions    = ['IT','Finance','Healthcare','Education','Retail'];
  const genderOptions    = ['Any','Male','Female'];
  const contractOptions  = ['Full-time','Part-time','Contract','Temporary'];
  const workModeOptions  = ['On-site','Remote','Hybrid'];
  const educationOptions = ['High School','Associate','Bachelor','Master','PhD'];

  for (let i = 0; i < 100; i++) {
    const job = new Job({
      title:          "Job N°" + i,
      description:    faker.lorem.sentences(2),
      authorEmail:    faker.internet.email(),
      authorWebsite:  faker.internet.url(),
      authorMobile1:  "05 00 78 01 "+i,
      authorMobile2:  "05 00 78 02 "+i,
      authorLongitude:faker.location.longitude(),
      authorLatitude: faker.location.latitude(),
      unpublished: true,
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
      deadline: faker.date.soon({ days: 60 })
    });
    await job.save();
    await sleep(2); // wait 2 ms and avoid When you insert fast, many docs can share the same createdAt millisecond and pagination by createdAt
  }

  // 5) create 100 resumes (sequential)
  for (let i = 0; i < 100; i++) {
    const resume = new Resume({
      title:       "Resume N° "+i,
      downloadUrl: faker.internet.url(),
      content:     faker.lorem.paragraphs(2)
    });
    await resume.save();
    await sleep(2); // wait 2 ms 
    
  }

  // 6) create 100 cover letters (sequential)
  for (let i = 0; i < 100; i++) {
    const coverLetter = new CoverLetter({
      title:    "Cover Letter N° "+i,
      content: faker.lorem.paragraphs(2)
    });
    await coverLetter.save();
    await sleep(2); // wait 2 ms 
  }

  console.log('✅ Database seeded with 100 users, jobs, resumes & cover letters in order.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
