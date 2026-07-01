import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
mongosh indiaholidaydestination_crm --quiet --eval '
db.companies.updateMany({ name: "UNO Trips" }, { $set: { name: "Travel CRM" } });
db.platformsettings.updateMany({ key: "platform_name", value: "UNO Trips" }, { $set: { value: "Travel CRM" } });
print("DB rebrand OK");
'
`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
