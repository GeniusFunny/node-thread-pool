const fs = require('fs')
async function task(workParam) {
    try {
      let start = Date.now()
      while (Date.now() < start + 200) {}
      fs.appendFileSync(`${__dirname}/numbers.txt`, `${workParam[0]}\n`)
    } catch (e) {
      console.log(e)
    }
  }
const { MessagePort, parentPort} = require('worker_threads')
let workPort = null // 获取到传递过来的workPort

async function finishTask() {
  await workPort.postMessage('finish')
}
async function unFinishTask() {
  await workPort.postMessage('failed')
}
parentPort.on('message', async value => {
  if (value.workerPort && value.workerPort instanceof MessagePort) {
    workPort = value.workerPort
  } else {
    try {
      await task(value)
      await finishTask()
    } catch (e) {
      await unFinishTask()
    }
  }
})
