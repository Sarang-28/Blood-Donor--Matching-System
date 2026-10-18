const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isValidCoordinates,resolveCoordinates}=require('../src/utils/geoUtils');
const {validPassword,hashOtp,createOtp}=require('../src/utils/security');
const {BLOOD_COMPATIBILITY,ALL_BLOOD_GROUPS}=require('../src/constants/bloodCompatibility');
test('Coordinates accept equator/meridian and reject partial or out of range input',()=>{
 assert.equal(isValidCoordinates(0,0),true);
 for(const pair of [[null,0],['',2],['12junk',1],[91,0],[0,-181],[Infinity,0]])assert.equal(isValidCoordinates(...pair),false);
 assert.throws(()=>resolveCoordinates(undefined,undefined));
});
test('RBC compatibility covers all 64 combinations',()=>{
 for(const recipient of ALL_BLOOD_GROUPS)for(const donor of ALL_BLOOD_GROUPS){
  const r=recipient.slice(0,-1),d=donor.slice(0,-1);
  const abo=d==='O'||r==='AB'||d===r;
  const rh=donor.endsWith('-')||recipient.endsWith('+');
  assert.equal(BLOOD_COMPATIBILITY[recipient].includes(donor),abo&&rh,`${donor} -> ${recipient}`);
 }
});
test('Passwords enforce bcrypt byte limit and OTPs are hashed',()=>{
 assert.equal(validPassword('a'.repeat(12)),true);assert.equal(validPassword('short'),false);assert.equal(validPassword('a'.repeat(73)),false);assert.equal(validPassword('💛'.repeat(20)),false);
 const otp=createOtp();assert.match(otp,/^\d{6}$/);assert.equal(hashOtp(otp).length,64);assert.notEqual(hashOtp(otp),otp);
});
