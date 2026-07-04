const fs = require('fs');
const path = require('path');
const Company = require('../superadmin/models/Company');
const ApiError = require('../utils/apiError');

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function isMetaGraphUrl(url) {
  return /graph\.facebook\.com/i.test(String(url || ''));
}

function resolveMessagesEndpoint(apiUrl) {
  const url = String(apiUrl || '').trim().replace(/\/$/, '');
  if (!url) return '';
  if (/\/messages$/i.test(url)) return url;
  if (/\/\d+$/.test(url)) return `${url}/messages`;
  return url;
}

function resolveMediaEndpoint(messagesUrl) {
  return String(messagesUrl || '').replace(/\/messages$/i, '/media');
}

async function loadCompanyWhatsAppConfig(companyId) {
  if (!companyId) {
    throw new ApiError(403, 'Company context is required for WhatsApp');
  }

  const company = await Company.findById(companyId).lean();
  if (!company) throw new ApiError(404, 'Company not found');

  const settings = company.tenantSettings || {};
  const apiUrl = settings.whatsappApiUrl || process.env.WHATSAPP_API_URL || '';
  const apiKey = settings.whatsappApiKey || process.env.WHATSAPP_API_KEY || '';

  if (!apiUrl || !apiKey) {
    throw new ApiError(
      503,
      'WhatsApp Business API is not configured for this company. Add WhatsApp API URL and API Key in Company Settings. Browser WhatsApp Web cannot attach PDF files automatically.'
    );
  }

  if (!company.features?.whatsapp && !settings.whatsappApiUrl) {
    throw new ApiError(403, 'WhatsApp feature is not enabled for this company');
  }

  return {
    company,
    apiUrl: resolveMessagesEndpoint(apiUrl),
    apiKey,
    isMeta: isMetaGraphUrl(apiUrl),
  };
}

async function parseErrorResponse(response) {
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch {
    bodyText = '';
  }

  let detail = bodyText;
  try {
    const json = JSON.parse(bodyText);
    detail =
      json?.error?.message ||
      json?.message ||
      json?.error_data?.details ||
      bodyText;
  } catch {
    /* plain text */
  }

  return detail || `HTTP ${response.status}`;
}

/**
 * Server-side WhatsApp Business API client.
 * Supports Meta Cloud API and compatible HTTP gateways.
 *
 * IMPORTANT: This is NOT WhatsApp Web. Browsers cannot auto-attach PDFs to wa.me.
 */
class WhatsAppService {
  async sendText({ companyId, phone, message }) {
    const to = normalizePhone(phone);
    if (!to) throw new ApiError(400, 'Customer phone number is missing or invalid');
    if (!message?.trim()) throw new ApiError(400, 'Message text is required');

    const config = await loadCompanyWhatsAppConfig(companyId);

    if (config.isMeta) {
      return this.#sendMetaJson(config, {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message.trim() },
      });
    }

    return this.#sendGenericJson(config, {
      to,
      type: 'text',
      message: message.trim(),
      text: message.trim(),
    });
  }

  async sendDocument({ companyId, phone, filePath, fileName, mimeType = 'application/pdf', caption = '' }) {
    const to = normalizePhone(phone);
    if (!to) throw new ApiError(400, 'Customer phone number is missing or invalid');
    if (!filePath) throw new ApiError(400, 'Document file path is required');

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, '../../uploads', filePath.replace(/^[/\\]+/, ''));

    if (!fs.existsSync(absolutePath)) {
      throw new ApiError(404, 'PDF file not found on server. Regenerate the quotation PDF and try again.');
    }

    const config = await loadCompanyWhatsAppConfig(companyId);
    const buffer = fs.readFileSync(absolutePath);
    const safeName = fileName || path.basename(absolutePath);

    if (config.isMeta) {
      const mediaId = await this.#uploadMetaMedia(config, {
        buffer,
        fileName: safeName,
        mimeType,
      });
      return this.#sendMetaJson(config, {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: {
          id: mediaId,
          filename: safeName,
          caption: caption || undefined,
        },
      });
    }

    return this.#sendGenericMultipart(config, {
      to,
      type: 'document',
      caption,
      fileName: safeName,
      mimeType,
      buffer,
    });
  }

  async sendImage({ companyId, phone, filePath, fileName, mimeType = 'image/jpeg', caption = '' }) {
    const to = normalizePhone(phone);
    if (!to) throw new ApiError(400, 'Customer phone number is missing or invalid');
    if (!filePath) throw new ApiError(400, 'Image file path is required');

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, '../../uploads', filePath.replace(/^[/\\]+/, ''));

    if (!fs.existsSync(absolutePath)) {
      throw new ApiError(404, 'Image file not found on server');
    }

    const config = await loadCompanyWhatsAppConfig(companyId);
    const buffer = fs.readFileSync(absolutePath);
    const safeName = fileName || path.basename(absolutePath);

    if (config.isMeta) {
      const mediaId = await this.#uploadMetaMedia(config, {
        buffer,
        fileName: safeName,
        mimeType,
      });
      return this.#sendMetaJson(config, {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: {
          id: mediaId,
          caption: caption || undefined,
        },
      });
    }

    return this.#sendGenericMultipart(config, {
      to,
      type: 'image',
      caption,
      fileName: safeName,
      mimeType,
      buffer,
    });
  }

  async #sendMetaJson(config, payload) {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await parseErrorResponse(response);
      throw new ApiError(502, `WhatsApp API rejected the message: ${detail}`);
    }

    const data = await response.json().catch(() => ({}));
    return {
      provider: 'meta',
      messageId: data?.messages?.[0]?.id || data?.messageId || null,
      raw: data,
    };
  }

  async #uploadMetaMedia(config, { buffer, fileName, mimeType }) {
    const mediaUrl = resolveMediaEndpoint(config.apiUrl);
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', new Blob([buffer], { type: mimeType }), fileName);

    const response = await fetch(mediaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const detail = await parseErrorResponse(response);
      throw new ApiError(502, `WhatsApp media upload failed: ${detail}`);
    }

    const data = await response.json().catch(() => ({}));
    const mediaId = data?.id;
    if (!mediaId) {
      throw new ApiError(502, 'WhatsApp media upload did not return a media id');
    }
    return mediaId;
  }

  async #sendGenericJson(config, payload) {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await parseErrorResponse(response);
      throw new ApiError(502, `WhatsApp API rejected the message: ${detail}`);
    }

    const data = await response.json().catch(() => ({}));
    return {
      provider: 'generic',
      messageId: data?.messageId || data?.id || null,
      raw: data,
    };
  }

  async #sendGenericMultipart(config, { to, type, caption, fileName, mimeType, buffer }) {
    const form = new FormData();
    form.append('to', to);
    form.append('type', type);
    if (caption) form.append('caption', caption);
    form.append('filename', fileName);
    form.append('file', new Blob([buffer], { type: mimeType }), fileName);

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'X-API-Key': config.apiKey,
      },
      body: form,
    });

    if (!response.ok) {
      const detail = await parseErrorResponse(response);
      throw new ApiError(502, `WhatsApp API rejected the document: ${detail}`);
    }

    const data = await response.json().catch(() => ({}));
    return {
      provider: 'generic',
      messageId: data?.messageId || data?.id || null,
      raw: data,
    };
  }
}

module.exports = new WhatsAppService();
module.exports.normalizePhone = normalizePhone;
