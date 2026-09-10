/**
 * Red Blood Cell (RBC) Compatibility Matrix
 * Key: Recipient blood group
 * Value: Array of acceptable donor blood groups
 */
const BLOOD_COMPATIBILITY = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'], // Universal Donor
};

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Get compatible donor blood groups for a given recipient blood group
 * @param {string} recipientGroup 
 * @returns {string[]}
 */
const getCompatibleDonorGroups = (recipientGroup) => {
    return BLOOD_COMPATIBILITY[recipientGroup] || [recipientGroup];
};

module.exports = {
    BLOOD_COMPATIBILITY,
    ALL_BLOOD_GROUPS,
    getCompatibleDonorGroups,
};
