const EmailLog = require('../models/EmailLog');
const { sendMailMessage } = require('./emailService');
const { logLeadActivity } = require('./leadActivityService');
const { invalidateMailboxCache } = require('./emailMailboxCache');

const queue = [];
let processing = false;

function enqueueEmailJob(job) {
  queue.push(job);
  setImmediate(processEmailQueue);
}

async function processEmailQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    try {
      const info = await sendMailMessage({
        companyId: job.companyId || null,
        to: job.to,
        cc: job.cc,
        bcc: job.bcc,
        subject: job.subject,
        html: job.html,
        text: job.text,
        attachments: job.attachments,
        headers: {
          'X-CRM-Email-Log-Id': String(job.logId),
        },
      });

      await EmailLog.findByIdAndUpdate(job.logId, {
        status: 'sent',
        sentAt: new Date(),
        errorMessage: '',
        messageId: info.messageId || '',
      });
      invalidateMailboxCache().catch(() => {});

      if (job.leadId && job.actor) {
        await logLeadActivity({
          leadId: job.leadId,
          branchId: job.branchId,
          type: 'email_sent',
          title: 'Email Sent',
          description: job.subject,
          actor: job.actor,
          meta: {
            emailLogId: job.logId,
            category: job.category,
            to: job.to,
          },
        });

        if (job.category === 'quotation' && job.leadId) {
          const Lead = require('../models/Lead');
          const lead = await Lead.findById(job.leadId);
          if (lead) {
            lead.lastContactedAt = new Date();
            lead.lastContactMethod = 'email';
            lead.lastContactedBy = job.actor._id || job.actor.id;
            await lead.save();
          }
        }
      }
    } catch (err) {
      await EmailLog.findByIdAndUpdate(job.logId, {
        status: 'failed',
        sentAt: new Date(),
        errorMessage: err.message || 'Failed to send email',
      });
      invalidateMailboxCache().catch(() => {});
    }
  }

  processing = false;
}

module.exports = { enqueueEmailJob, processEmailQueue };
