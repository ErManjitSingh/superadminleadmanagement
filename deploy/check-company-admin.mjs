/**
 * Inspect a company + its admin user on the VPS Mongo.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/check-company-admin.mjs crm.exploremybharat.info
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const PASSWORD = process.env.VPS_PASSWORD;
const DOMAIN = process.argv[2] || 'crm.exploremybharat.info';
const APP_ROOT = '/var/www/leadmanagement';

if (!PASSWORD) { console.error('Set VPS_PASSWORD'); process.exit(1); }

const script = `
cd ${APP_ROOT}/backend
node -e '
const m=require("mongoose");
const env=require("./src/config/env");
const Company=require("./src/superadmin/models/Company");
const User=require("./src/models/User");
m.connect(env.mongoUri).then(async()=>{
  const c=await Company.findOne({primaryDomain:"${DOMAIN}"}).lean();
  if(!c){console.log("NO COMPANY");process.exit(0);}
  console.log("COMPANY:",JSON.stringify({id:String(c._id),name:c.name,ownerEmail:c.ownerEmail,ownerName:c.ownerName,adminUserId:String(c.adminUserId||""),status:c.status,subdomain:c.subdomain,primaryDomain:c.primaryDomain,domainVerified:c.domainVerified}));
  const users=await User.find({companyId:c._id}).select("+password name email role status").lean();
  console.log("USER_COUNT:",users.length);
  for(const u of users){console.log("USER:",JSON.stringify({id:String(u._id),name:u.name,email:u.email,role:u.role,status:u.status,hasPassword:!!u.password}));}
  process.exit(0);
}).catch(e=>{console.error("ERR",e.message);process.exit(1);});
'
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(script, (err, stream) => {
    if (err) { console.error(err.message); conn.end(); process.exit(1); }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => { conn.end(); process.exit(code || 0); });
  });
}).on('error', (e) => { console.error('SSH:', e.message); process.exit(1); })
  .connect({ host: HOST, username: 'root', password: PASSWORD, readyTimeout: 120000 });
