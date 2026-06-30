import { seedDemoProfiles } from './demo-profiles'

seedDemoProfiles()
  .then(r => { console.log('Seed klaar:', r); process.exit(0) })
  .catch(e => { console.error('Seed mislukt:', e); process.exit(1) })
