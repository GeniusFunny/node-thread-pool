
const { MessagePort, parentPort} = require('worker_threads')
let workPort = null // 获取到传递过来的workPort
async function finishTask() {
  parentPort.on('message', async value => {
    if (value.workerPort && value.workerPort instanceof MessagePort) {
      workPort = value.workerPort
    }
    await workPort.postMessage('finish')
  })
}
async function unFinishTask() {
  parentPort.on('message', async value => {
    if (value.workerPort && value.workerPort instanceof MessagePort) {
      workPort = value.workerPort
    }
    await workPort.postMessage('failed')
  })
}
parentPort.on('message', async workParam => {
  if (workParam && !workParam.workerPort) {
    try {
      await task(workParam)
      await finishTask()
    } catch (e) {
      await unFinishTask()
    }
  }
})
