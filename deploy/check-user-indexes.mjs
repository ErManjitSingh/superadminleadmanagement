import { Client } from 'ssh2';

const remote = `cd /var/www/leadmanagement/backend && node -e '
const m=require("mongoose");
const e=require("./src/config/env");
const U=require("./src/models/User");
m.connect(e.mongoUri).then(async()=>{
  const ix=await U.collection.indexes();
  console.log(JSON.stringify(ix.map(i=>({name:i.name,key:i.key,unique:!!i.unique})),null,2));
  process.exit(0);
}).catch(err=>{console.error(err.message);process.exit(1);});
'`;

const c = new Client();
c.on('ready', () => {
  c.exec(remote, (err, stream) => {
    if (err) { console.error(err.message); c.end(); return; }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', () => c.end());
  });
}).connect({ host: '187.127.188.30', username: 'root', password: process.env.VPS_PASSWORD });
