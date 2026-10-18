const db=require('../config/db');
const env=require('../config/env');
async function settings(){const r=await db.query("SELECT value FROM system_settings WHERE key='matching'");return r.rows[0]?.value || env.matching;}
module.exports=settings;
