import { collectDailyPPCData } from './collectPPCData'
import { weeklyModelTraining } from './trainBidModel'

// Railway runs this file as a cron job
// Set RAILWAY_CRON_SCHEDULE in Railway environment variables

const now = new Date()
const hour = now.getHours()
const dayOfWeek = now.getDay() // 0 = Sunday

async function main() {
  console.log(`Cron running at ${now.toISOString()}`)

  // 6am daily — collect PPC data from all users
  if (hour === 6) {
    console.log('Running daily PPC data collection...')
    await collectDailyPPCData()
  }

  // Sunday midnight — retrain ML models
  if (dayOfWeek === 0 && hour === 0) {
    console.log('Running weekly ML model training...')
    await weeklyModelTraining()
  }

  console.log('Cron complete')
}

main().catch(console.error)
