const { Job } = require('../models');

async function getLookup(field) {
  return Job.aggregate([
    // group by the nested “.id” and grab one example of the “.name”
    { $group: { _id: `$${field}.id`, name: { $first: `$${field}.name` } } },
    // reshape to { id, name }
    { $project: { id: '$_id', name: 1, _id: 0 } },
    // sort alphabetically
    { $sort: { name: 1 } }
  ]);
}

exports.getSectors = async (req, res, next) => {
  try {
    const sectors = await getLookup('sector');
    res.json({ sectors });
  } catch (err) { next(err); }
};

exports.getGenders = async (req, res, next) => {
  try {
    const genders = await getLookup('gender');
    res.json({ genders });
  } catch (err) { next(err); }
};

exports.getContractTypes = async (req, res, next) => {
  try {
    const contractTypes = await getLookup('contractType');
    res.json({ contractTypes });
  } catch (err) { next(err); }
};

exports.getWorkModes = async (req, res, next) => {
  try {
    const workModes = await getLookup('workMode');
    res.json({ workModes });
  } catch (err) { next(err); }
};
