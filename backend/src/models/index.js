const { sequelize } = require('../config/db');
const { User, roles } = require('./User');
const { Issue, statuses } = require('./Issue');

User.hasMany(Issue, { foreignKey: 'assigned_to', as: 'assignedIssues' });

module.exports = {
  sequelize,
  User,
  Issue,
  roles,
  statuses,
};

