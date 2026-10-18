const db=require('../src/config/db');
const bcrypt=require('bcryptjs');
const {validPassword}=require('../src/utils/security');
(async()=>{try{
 const {ADMIN_EMAIL,ADMIN_PASSWORD,ADMIN_PHONE}=process.env;
 if(!ADMIN_EMAIL?.includes('@')||!validPassword(ADMIN_PASSWORD)||!ADMIN_PHONE)throw new Error('Set ADMIN_EMAIL, ADMIN_PHONE and a strong ADMIN_PASSWORD in the process environment.');
 await db.query("INSERT INTO users(email,password_hash,role,phone) VALUES($1,$2,'admin',$3)",[ADMIN_EMAIL.trim().toLowerCase(),await bcrypt.hash(ADMIN_PASSWORD,12),ADMIN_PHONE]);
 console.log('Administrator created. Clear ADMIN_PASSWORD from your environment.');
}catch(e){console.error('Admin provisioning failed:',e.code||e.message);process.exitCode=1;}finally{await db.pool.end();}})();
