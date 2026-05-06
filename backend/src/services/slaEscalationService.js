/**
 * SLA Escalation Background Service
 * Runs every hour to find issues that have breached their SLA deadline
 * and automatically escalates them.
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Issue, User } = require('../models');
const logger = require('../utils/logger');

/**
 * SLA TRACKER — Escalation job logic
 * Finds all unresolved, non-escalated issues past their sla_deadline
 * and marks them as Escalated.
 */
async function runEscalationCheck() {
  try {
    const now = new Date();

    // ESCALATION SYSTEM: preload designated officers
    const [zonalOfficer, supervisor] = await Promise.all([
      User.findOne({
        where: { designation: 'zonal_officer' },
        order: [['created_at', 'ASC']],
      }),
      User.findOne({
        where: { designation: 'supervisor' },
        order: [['created_at', 'ASC']],
      }),
    ]);

    // ESCALATION SYSTEM: only unresolved issues that can still escalate
    const pendingIssues = await Issue.findAll({
      where: {
        status: { [Op.ne]: 'Resolved' },
        escalation_level: { [Op.lt]: 2 },
      },
    });

    if (pendingIssues.length === 0) {
      logger.info('[SLA] Escalation check complete — 0 issues updated');
      return 0;
    }

    let updatedCount = 0;

    for (const issue of pendingIssues) {
      try {
        const createdAt = new Date(issue.created_at || issue.createdAt);
        const daysElapsed = (now - createdAt) / (1000 * 60 * 60 * 24);
        const severity = (issue.severity || 'low').toLowerCase();

        // ESCALATION SYSTEM: threshold rules per severity
        const levelOneThreshold = severity === 'high' ? 5 : 10;
        const levelTwoThreshold = severity === 'high' ? 7 : 15;

        if (issue.escalation_level === 0 && daysElapsed >= levelOneThreshold) {
          if (!zonalOfficer) {
            logger.warn('[SLA] No zonal officer found for Level 1 escalation');
            continue;
          }

          await issue.update({
            escalation_level: 1,
            escalation_label: 'Zonal Officer',
            assigned_to: zonalOfficer.id,
            escalated: true,
            escalated_at: now,
            status: 'Escalated',
          });

          logger.info(
            `[SLA] Issue #${issue.id} -> Level 1 (Zonal Officer) - Day ${levelOneThreshold} breach`
          );
          updatedCount += 1;
          continue;
        }

        if (issue.escalation_level === 1 && daysElapsed >= levelTwoThreshold) {
          if (!supervisor) {
            logger.warn('[SLA] No supervisor found for Level 2 escalation');
            continue;
          }

          await issue.update({
            escalation_level: 2,
            escalation_label: 'Supervisor',
            assigned_to: supervisor.id,
            escalated: true,
            escalated_at: now,
            status: 'Escalated',
          });

          logger.info(
            `[SLA] Issue #${issue.id} -> Level 2 (Supervisor) - Day ${levelTwoThreshold} breach`
          );
          updatedCount += 1;
        }
      } catch (updateErr) {
        logger.error(`[SLA] Failed to process issue #${issue.id}`, {
          message: updateErr.message,
        });
      }
    }

    logger.info(`[SLA] Escalation check complete — ${updatedCount} issues updated`);
    return updatedCount;
  } catch (err) {
    logger.error('[SLA] Escalation job error', { message: err.message });
    return 0;
  }
}

/**
 * Start the SLA escalation cron job.
 * Runs at the start of every hour: 0 * * * *
 */
function start() {
  logger.info('[SLA] Starting SLA escalation service (runs every hour)');

  // Run immediately on startup to catch any missed escalations
  runEscalationCheck();

  // SLA TRACKER: Schedule hourly escalation checks
  cron.schedule('0 * * * *', () => {
    logger.info('[SLA] Running scheduled escalation check...');
    runEscalationCheck();
  });
}

module.exports = { start, runEscalationCheck };
