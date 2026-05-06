const express = require('express');
const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');
const { Issue, User } = require('../models');

const router = express.Router();

// DEMO CONTROLS: protect all demo routes by auth + admin role
router.use(authenticateToken, authorizeRoles('admin'));

// DEMO CONTROLS: supervisor-only designation guard for all demo routes
router.use((req, res, next) => {
  if (req.user.designation !== 'supervisor') {
    return res.status(403).json({
      success: false,
      message: 'Only supervisors can access demo controls',
    });
  }
  return next();
});

// DEMO CONTROLS: reset issue back to Level 0 baseline
router.post('/reset-issue', async (req, res, next) => {
  try {
    const { issueId } = req.body || {};
    if (!issueId) {
      return res.status(400).json({ success: false, message: 'issueId is required' });
    }

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const fieldEngineer = await User.findOne({
      where: { designation: 'field_engineer' },
      order: [['created_at', 'ASC']],
    });

    if (!fieldEngineer) {
      return res.status(404).json({
        success: false,
        message: 'No field engineer found',
      });
    }

    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 7);

    await issue.update({
      escalation_level: 0,
      escalation_label: 'Field Engineer',
      assigned_to: fieldEngineer.id,
      escalated: false,
      escalated_at: null,
      status: 'Open',
      severity: 'high',
      created_at: now,
      sla_deadline: deadline,
    });

    return res.json({
      success: true,
      message: 'Issue reset to Level 0',
      issue,
    });
  } catch (error) {
    return next(error);
  }
});

// DEMO CONTROLS: simulate day-based SLA breach state
router.post('/simulate-breach', async (req, res, next) => {
  try {
    const { issueId, day } = req.body || {};
    if (!issueId || ![5, 7].includes(Number(day))) {
      return res.status(400).json({
        success: false,
        message: 'issueId and day (5 or 7) are required',
      });
    }

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const now = new Date();

    if (Number(day) === 5) {
      const zonalOfficer = await User.findOne({
        where: { designation: 'zonal_officer' },
        order: [['created_at', 'ASC']],
      });

      if (!zonalOfficer) {
        return res.status(404).json({
          success: false,
          message: 'No zonal officer found',
        });
      }

      const createdAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const deadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      await issue.update({
        created_at: createdAt,
        sla_deadline: deadline,
        severity: 'high',
        escalation_level: 1,
        escalation_label: 'Zonal Officer',
        assigned_to: zonalOfficer.id,
        escalated: true,
        escalated_at: now,
        status: 'Escalated',
      });

      return res.json({
        success: true,
        message: 'Day 5 simulated — assigned to Zonal Officer',
      });
    }

    const supervisor = await User.findOne({
      where: { designation: 'supervisor' },
      order: [['created_at', 'ASC']],
    });

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'No supervisor found',
      });
    }

    const createdAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const breachedAt = new Date(now.getTime() - 60 * 60 * 1000);

    await issue.update({
      created_at: createdAt,
      sla_deadline: breachedAt,
      severity: 'high',
      escalation_level: 2,
      escalation_label: 'Supervisor',
      assigned_to: supervisor.id,
      escalated: true,
      escalated_at: breachedAt,
      status: 'Escalated',
    });

    return res.json({
      success: true,
      message: 'Day 7 simulated — assigned to Supervisor',
    });
  } catch (error) {
    return next(error);
  }
});

// DEMO CONTROLS: undo previous demo action using captured previous state
router.post('/undo', async (req, res, next) => {
  try {
    const { issueId, previousState } = req.body || {};
    if (!issueId || !previousState) {
      return res.status(400).json({
        success: false,
        message: 'issueId and previousState are required',
      });
    }

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    await issue.update({
      escalation_level: previousState.escalation_level,
      escalation_label: previousState.escalation_label,
      assigned_to: previousState.assigned_to,
      escalated: previousState.escalated,
      escalated_at: previousState.escalated_at,
      status: previousState.status,
      severity: previousState.severity,
      created_at: previousState.created_at,
      sla_deadline: previousState.sla_deadline,
    });

    return res.json({
      success: true,
      message: 'Action undone',
      issue,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
