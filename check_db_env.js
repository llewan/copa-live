
const keys = Object.keys(process.env).filter(k => k.includes('DB_') || k.includes('POSTGRES') || k.includes('DATABASE'));
console.log('Available DB env vars:', keys);
if (keys.length > 0) {
  console.log('Values (masked):', keys.map(k => `${k}=${process.env[k] ? '***' : 'empty'}`));
} else {
  console.log('No DB env vars found.');
}
