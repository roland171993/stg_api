// Handles lookup tables like sectors, genders, contract types, and work modes
const Sector = require('../models/secteurActiviteModel');
const Gender = require('../models/sexeModel');
const ContractType = require('../models/typeTravailModel');
const WorkMode = require('../models/modeTravailModel');

exports.getSectors = async (req, res, next) => {
  try {
    const sectors = await Sector.find().sort('name');
    res.json({ sectors });
  } catch (err) {
    next(err);
  }
};

exports.getGenders = async (req, res, next) => {
  try {
    const genders = await Gender.find().sort('name');
    res.json({ genders });
  } catch (err) {
    next(err);
  }
};

exports.getContractTypes = async (req, res, next) => {
  try {
    const contractTypes = await ContractType.find().sort('name');
    res.json({ contractTypes });
  } catch (err) {
    next(err);
  }
};

exports.getWorkModes = async (req, res, next) => {
  try {
    const workModes = await WorkMode.find().sort('name');
    res.json({ workModes });
  } catch (err) {
    next(err);
  }
};