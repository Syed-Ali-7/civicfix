const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const statuses = ['Open', 'In Progress', 'Resolved'];

const Issue = sequelize.define(
  'Issue',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    photo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resolved_photo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Perceptual hash of the uploaded image for duplicate/fake detection
    phash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Flag to mark issues that require manual review (e.g. when EXIF GPS is missing)
    needs_review: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // AI verification - whether the image contains a pothole
    ai_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    },
    // AI confidence score (0-1)
    ai_confidence: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      defaultValue: null,
    },
    // AI detection label (pothole, not_pothole, etc.)
    ai_label: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM(...statuses),
      allowNull: false,
      defaultValue: 'Open',
    },
  },
  {
    tableName: 'issues',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
  }
);

module.exports = {
  Issue,
  statuses,
};
