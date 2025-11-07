import axios from 'axios';
import logger from '../utils/logger';

const ONFIDO_API_BASE = process.env.ONFIDO_API_BASE || 'https://api.us.onfido.com/v3.6';
const ONFIDO_API_TOKEN = process.env.ONFIDO_API_TOKEN;

if (!ONFIDO_API_TOKEN) {
  logger.warn('Onfido API token not configured');
}

export interface CreateApplicantParams {
  firstName: string;
  lastName: string;
  email?: string;
  dob?: string; // YYYY-MM-DD
  address?: {
    line1?: string;
    line2?: string;
    town?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Create an Onfido applicant
 */
export const createApplicant = async (params: CreateApplicantParams): Promise<any> => {
  try {
    const response = await axios.post(
      `${ONFIDO_API_BASE}/applicants`,
      {
        first_name: params.firstName,
        last_name: params.lastName,
        email: params.email,
        dob: params.dob,
        address: params.address,
      },
      {
        headers: {
          'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Created Onfido applicant: ${response.data.id}`);
    return response.data;
  } catch (error: any) {
    logger.error('Failed to create Onfido applicant:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get applicant details
 */
export const getApplicant = async (applicantId: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${ONFIDO_API_BASE}/applicants/${applicantId}`,
      {
        headers: {
          'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error(`Failed to get Onfido applicant ${applicantId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create an SDK token for embedded flow
 */
export const createSDKToken = async (applicantId: string, referrer?: string): Promise<{ token: string }> => {
  try {
    const response = await axios.post(
      `${ONFIDO_API_BASE}/sdk_token`,
      {
        applicant_id: applicantId,
        referrer: referrer || '*://localhost:*/*',
      },
      {
        headers: {
          'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { token: response.data.token };
  } catch (error: any) {
    logger.error('Failed to create Onfido SDK token:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create a check (start verification process)
 */
export const createCheck = async (
  applicantId: string,
  reportNames: string[] = ['document', 'identity_enhanced']
): Promise<any> => {
  try {
    const response = await axios.post(
      `${ONFIDO_API_BASE}/checks`,
      {
        applicant_id: applicantId,
        report_names: reportNames,
      },
      {
        headers: {
          'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Created Onfido check: ${response.data.id}`);
    return response.data;
  } catch (error: any) {
    logger.error('Failed to create Onfido check:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get check status
 */
export const getCheck = async (checkId: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${ONFIDO_API_BASE}/checks/${checkId}`,
      {
        headers: {
          'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error(`Failed to get Onfido check ${checkId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * List checks for an applicant
 */
export const listChecks = async (applicantId: string): Promise<any[]> => {
  try {
    const response = await axios.get(
      `${ONFIDO_API_BASE}/checks?applicant_id=${applicantId}`,
      {
        headers: {
          'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
        },
      }
    );

    return response.data.checks || [];
  } catch (error: any) {
    logger.error(`Failed to list Onfido checks:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  token: string
): boolean => {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', token);
  const digest = hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
};
