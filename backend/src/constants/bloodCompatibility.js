const BLOOD_COMPATIBILITY=require('../../../shared/bloodCompatibility.json');
const ALL_BLOOD_GROUPS=Object.keys(BLOOD_COMPATIBILITY);
const getCompatibleDonorGroups=recipient=>BLOOD_COMPATIBILITY[recipient]||[];
module.exports={BLOOD_COMPATIBILITY,ALL_BLOOD_GROUPS,getCompatibleDonorGroups};
