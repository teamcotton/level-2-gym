import { Container } from '../container.js'

async function main() {
  const container = Container.getInstance()
  await container.start()

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await container.stop()
    process.exit(0)
  })
}

main().catch(console.error)
