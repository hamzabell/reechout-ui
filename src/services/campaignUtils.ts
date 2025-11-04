/**
 * Utility functions for campaign management
 */

/**
 * Generates a unique blank sequence ID
 * @returns {string} A new sequence ID in the format seq_timestamp
 */
export const generateBlankSequenceId = (): string => {
  return `seq_${Date.now()}`;
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