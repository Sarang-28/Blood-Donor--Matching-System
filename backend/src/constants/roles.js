const ROLES = {
    DONOR: 'donor',
    HOSPITAL: 'hospital',
    PATIENT: 'patient',
    BLOOD_BANK: 'blood_bank',
    NGO: 'blood_bank', // Backward compatibility alias
    ADMIN: 'admin',
};

const ALL_ROLES = ['donor', 'hospital', 'patient', 'blood_bank', 'admin'];

module.exports = {
    ROLES,
    ALL_ROLES,
};
