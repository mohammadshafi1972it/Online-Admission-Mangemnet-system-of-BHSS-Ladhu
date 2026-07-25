import QRCode from 'qrcode';

export interface QRCodeData {
  type: 'STUDENT_VERIFICATION' | 'ADMISSION_RECEIPT' | 'DC_VERIFICATION';
  id: string; // Application ID or Roll No
  name: string;
  course: string;
  status: string;
  timestamp: string;
}

export async function generateQRCodeDataUrl(dataString: string): Promise<string> {
  try {
    const url = await QRCode.toDataURL(dataString, {
      width: 250,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return url;
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    return '';
  }
}

export function buildCandidateQRPayload(candidateId: string, name: string, course: string, rollNo?: string): string {
  const payload: QRCodeData = {
    type: 'STUDENT_VERIFICATION',
    id: rollNo || candidateId,
    name,
    course,
    status: 'VERIFIED_RECORD',
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}
