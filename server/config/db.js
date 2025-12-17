const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed vaccines if none exist
    const Vaccine = require('../models/Vaccine');
    const count = await Vaccine.countDocuments();
    if (count === 0) {
      console.log('Seeding national vaccination calendar...');
      const nationalVaccines = [
        {
          name: 'BCG',
          description: 'Vaccin contre la tuberculose',
          recommendedAges: [0],
          totalDoses: 1,
          isMandatory: true
        },
        {
          name: 'Hépatite B',
          description: 'Vaccin contre l\'hépatite B',
          recommendedAges: [0, 1, 6],
          totalDoses: 3,
          isMandatory: true
        },
        {
          name: 'DTP-Hib-HepB (Pentavalent)',
          description: 'Diphtérie, Tétanos, Coqueluche, Haemophilus influenzae b, Hépatite B',
          recommendedAges: [2, 3, 4],
          totalDoses: 3,
          isMandatory: true
        },
        {
          name: 'Polio (VPO)',
          description: 'Vaccin oral contre la poliomyélite',
          recommendedAges: [2, 3, 4, 16],
          totalDoses: 4,
          isMandatory: true
        },
        {
          name: 'Pneumocoque',
          description: 'Vaccin contre les infections à pneumocoque',
          recommendedAges: [2, 4, 12],
          totalDoses: 3,
          isMandatory: true
        },
        {
          name: 'Rougeole-Rubéole (RR)',
          description: 'Vaccin contre la rougeole et la rubéole',
          recommendedAges: [9, 18],
          totalDoses: 2,
          isMandatory: true
        },
        {
          name: 'DTP (Rappel)',
          description: 'Rappel Diphtérie, Tétanos, Coqueluche',
          recommendedAges: [18, 72],
          totalDoses: 2,
          isMandatory: true
        }
      ];
      await Vaccine.insertMany(nationalVaccines);
      console.log('✅ Vaccination calendar seeded successfully!');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
