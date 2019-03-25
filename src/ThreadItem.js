const { Worker, MessageChannel, isMainThread } = require('worker_threads')

function ThreadItem({ task = './task.js', id = '1' }) {
  if (typeof task !== 'string') {
    throw new Error('workParam must be a string')
  }
  this.thread = this.createThread(task)
  this.state = 1
  this.id = id
}
ThreadItem.prototype.finishTask = function() {
  if (this.state === 1) {
    this.state = 2
  }
}
ThreadItem.prototype.unFinishTask = function() {
  this.state = 3
}
ThreadItem.prototype.terminate = function() {
  try {
    this.thread.subChannel.port2.close()
    this.state = 4
  } catch (e) {
    throw new Error(`关闭线程${this.id}失败`)
  }
}
ThreadItem.prototype.createThread = function (task) {
  let worker, subChannel
  if (isMainThread) {
    worker = new Worker(task)
    subChannel = new MessageChannel()
  }
  if (worker && subChannel) {
    return {
      worker, subChannel
    }
  } else {
    throw new Error('create Thread failed')
  }
}

module.exports = ThreadItem
