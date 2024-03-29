
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
