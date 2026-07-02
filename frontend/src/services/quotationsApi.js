import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result || '';
      resolve(String(dataUrl).split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function uploadQuotationPdf(quotationId, pdfBlob, savePath = '/quotations') {
  const pdfBase64 = await blobToBase64(pdfBlob);
  const { data } = await API.post(
    `${savePath}/${quotationId}/pdf`,
    { pdfBase64 },
    { skipSuccessToast: true },
  );
  return data;
}

export async function fetchQuotations(params = {}, endpoint = '/quotations') {
  const { data } = await API.get(endpoint, {
    params: buildListParams(params),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}

export async function fetchQuotationStats(params = {}) {
  const { data } = await API.get('/quotations/stats', {
    params,
    skipSuccessToast: true,
  });
  return data;
}
