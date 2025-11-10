/**
 * Utility functions for campaign management
 */

/**
 * Generates a unique blank sequence ID using UUID v4
 * @returns {string} A new sequence ID using UUID v4
 */
export const generateBlankSequenceId = (): string => {
  // Use crypto.randomUUID which is the modern UUID v4 implementation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Creates a blank campaign object with default values
 * @param {string} id - The campaign ID (optional, will generate if not provided)
 * @returns {Object} A blank campaign object
 */
export const createBlankCampaign = (id?: string) => {
  const campaignId = id || generateBlankSequenceId();

  return {
    id: campaignId,
    name: 'New Sequence',
    description: 'Add a description for your sequence',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    goals: '',
    targetAudience: '',
    steps: [],
    prospects: []
  };
};
