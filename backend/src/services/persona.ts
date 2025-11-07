import axios from 'axios';
import logger from '../utils/logger';

const PERSONA_API_BASE = 'https://withpersona.com/api/v1';
const PERSONA_API_KEY = process.env.PERSONA_API_KEY;

if (!PERSONA_API_KEY) {
  logger.warn('Persona API key not configured');
}

export interface CreateInquiryParams {
  referenceId: string; // Merchant ID
  templateId?: string;
  redirectUri?: string;
  fields?: {
    nameFirst?: string;
    nameLast?: string;
    emailAddress?: string;
    phoneNumber?: string;
    addressStreet1?: string;
    addressCity?: string;
    addressSubdivision?: string;
    addressPostalCode?: string;
  };
}

export interface InquiryResponse {
  id: string;
  status: string;
  referenceId: string;
  fields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a Persona inquiry for KYC verification
 */
export const createInquiry = async (params: CreateInquiryParams): Promise<InquiryResponse> => {
  try {
    const response = await axios.post(
      `${PERSONA_API_BASE}/inquiries`,
      {
        data: {
          type: 'inquiry',
          attributes: {
            'reference-id': params.referenceId,
            'inquiry-template-id': params.templateId || process.env.PERSONA_TEMPLATE_ID,
            'redirect-uri': params.redirectUri,
            fields: params.fields,
          },
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${PERSONA_API_KEY}`,
          'Content-Type': 'application/json',
          'Persona-Version': '2023-01-05',
        },
      }
    );

    logger.info(`Created Persona inquiry: ${response.data.data.id}`);
    return {
      id: response.data.data.id,
      status: response.data.data.attributes.status,
      referenceId: response.data.data.attributes['reference-id'],
      fields: response.data.data.attributes.fields || {},
      createdAt: response.data.data.attributes['created-at'],
      updatedAt: response.data.data.attributes['updated-at'],
    };
  } catch (error: any) {
    logger.error('Failed to create Persona inquiry:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get inquiry status
 */
export const getInquiry = async (inquiryId: string): Promise<InquiryResponse> => {
  try {
    const response = await axios.get(
      `${PERSONA_API_BASE}/inquiries/${inquiryId}`,
      {
        headers: {
          'Authorization': `Bearer ${PERSONA_API_KEY}`,
          'Persona-Version': '2023-01-05',
        },
      }
    );

    return {
      id: response.data.data.id,
      status: response.data.data.attributes.status,
      referenceId: response.data.data.attributes['reference-id'],
      fields: response.data.data.attributes.fields || {},
      createdAt: response.data.data.attributes['created-at'],
      updatedAt: response.data.data.attributes['updated-at'],
    };
  } catch (error: any) {
    logger.error(`Failed to get Persona inquiry ${inquiryId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get verification details
 */
export const getVerification = async (verificationId: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${PERSONA_API_BASE}/verifications/${verificationId}`,
      {
        headers: {
          'Authorization': `Bearer ${PERSONA_API_KEY}`,
          'Persona-Version': '2023-01-05',
        },
      }
    );

    return response.data.data;
  } catch (error: any) {
    logger.error(`Failed to get verification ${verificationId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Resume an inquiry (generate session token for embedded flow)
 */
export const resumeInquiry = async (inquiryId: string): Promise<{ sessionToken: string }> => {
  try {
    const response = await axios.post(
      `${PERSONA_API_BASE}/inquiries/${inquiryId}/resume`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${PERSONA_API_KEY}`,
          'Persona-Version': '2023-01-05',
        },
      }
    );

    return {
      sessionToken: response.data.data.attributes['session-token'],
    };
  } catch (error: any) {
    logger.error(`Failed to resume inquiry ${inquiryId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
