const express = require('express');
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');
const { runEscalationCheck } = require('../services/slaEscalationService');

const router = express.Router();

// ESCALATION SYSTEM: manual escalation trigger for demo/admin operations
router.post(
  '/trigger-escalation',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res, next) => {
    try {
      const escalatedCount = await runEscalationCheck();
      return res.json({
        success: true,
        message: 'Escalation check complete',
        escalated_count: escalatedCount,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
