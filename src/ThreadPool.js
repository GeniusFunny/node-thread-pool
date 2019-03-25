const fs = require('fs')
const isCorrectType = require('./util').isCorrectType
const ThreadItem = require('./ThreadItem')

function ThreadPool({ maxParallelThread = 50, timeToClose = 60 * 1000, taskParams = [], dependency = '', workDir ='', taskName = Date.now(), script = '' }) {
  this.start = Date.now()
  try {
    isCorrectType('task', script, 'function')
    isCorrectType('maxParallelThread', maxParallelThread, 'number')
    isCorrectType('timeToClose', timeToClose, 'number')
    isCorrectType('dependency', dependency, 'string')
    isCorrectType('workDir', workDir, 'string')
  } catch (e) {
    throw new Error('参数不合法' + e)
  }
  this.timeToClose = timeToClose
  this.threadList = new Map() // 使用Map存储线程对象
  this.currentThreadNum = 0 // 当前活动线程数
  this.dependency = dependency // 任务脚本依赖
  this.workDir = workDir // 主控函数工作目录
  this.taskName = taskName // 任务脚本名称
  this.task = `${this.workDir}/${this.taskName}.js`// 任务脚本路径
  this.taskParamsTodo = taskParams // 待完成的任务参数数组，包含了n个小任务所需参数，所以是一个二维数组
  this.maxParallelThread = maxParallelThread // 最大线程并行数
  this.script = script // 任务脚本内容
  this.ready = false // 任务脚本是否构建完成
  this.count = 0 // 已完成任务数
  try {
    this.buildTaskScript() // 根据模版创建任务脚本
  } catch (e) {
    throw new Error('创建任务脚本失败' + e)
  }
}
ThreadPool.prototype.run = function() {
  if (this.ready) {
    let flag = this.hasWorkThreadRunning()
    const taskTodoNum = this.taskParamsTodo.length
    if (flag === 1 && taskTodoNum) {
      while (this.currentThreadNum < this.maxParallelThread && this.currentThreadNum < taskTodoNum) {
        this.addThread()
      }
    } else if (flag === 2 && !taskTodoNum) {

    } else if (flag === 2 && taskTodoNum) {
      const threadList = this.threadList.values()
      for (const t of threadList) {
        if (t.state !== 1 || t.state !== 4) {
          this.reuseThread(t.id)
        }
      }
    } else if (flag === -1 && taskTodoNum) {
      const threadList = this.threadList.values()
      for (const t of threadList) {
        if (t.state !== 1 || t.state !== 4) {
          this.reuseThread(t.id)
        }
      }
    } else if (flag < 0 && !taskTodoNum) {
      this.closeThreadPool()
    }
  }
}
ThreadPool.prototype.buildTaskScript = function() {
  const taskDir = this.task
  const templateDir = `${__dirname}/TaskTemplate.js`
  const dependency = `${this.dependency}\n`
  const taskBody = this.script.toString()
  const templateReadStream = fs.createReadStream(templateDir)
  const taskWriteStream = fs.createWriteStream(taskDir)
  taskWriteStream.write(dependency)
  templateReadStream.pipe(taskWriteStream).write(taskBody)
  taskWriteStream.on('finish', () => {
    this.ready = true
    this.run()
  })
}
ThreadPool.prototype.addThread = function() {
  if (this.currentThreadNum <= this.maxParallelThread) {
    let workParam = this.taskParamsTodo.shift()
    const newThread = new ThreadItem({task: this.task, id: this.currentThreadNum})
    this.threadList.set(newThread.id, newThread)
    this.currentThreadNum++
    this.listenThreadState(newThread, workParam)
  }
}
ThreadPool.prototype.listenThreadState = function(workThread, params) {
  const { worker, subChannel } = workThread.thread
  worker.postMessage({ workerPort: subChannel.port1}, [subChannel.port1])
  worker.postMessage(params)
  subChannel.port2.on('message', message => {
    if (message === 'finish') {
      workThread.finishTask()
      this.count++
    } else if (message === 'failed') {
      this.taskParamsTodo.unshift(params)
      workThread.unFinishTask()
    }
    this.run()
  })
}
ThreadPool.prototype.hasWorkThreadRunning = function() {
  if (!this.threadList) return -1
  if (this.threadList && !this.threadList.size) return 1 // 线程池刚启动，尚无工作线程
  const threadList = this.threadList.values()
  for (const p of threadList) {
    if (p.state === 1) return 2 // 有忙碌的线程
  }
  return -1
}
ThreadPool.prototype.reuseThread = function(id) {
  const workThread = this.threadList.get(id)
  if (this.taskParamsTodo.length && workThread && workThread.state !== 1) {
    const { worker } = workThread.thread
    const taskParam = this.taskParamsTodo.shift()
    workThread.state = 1 // 设置为忙碌
    worker.postMessage(taskParam)
  }
}
ThreadPool.prototype.removeAllThread = function() {
  const threadItems = this.threadList.values()
  for (const threadItem of threadItems) {
    threadItem.terminate()
  }
}
ThreadPool.prototype.closeThreadPool = function() {
  this.removeAllThread()
  this.ready = false
  this.threadList = null
  this.deleteTask()
  this.log()
  process.kill(process.pid)
}
ThreadPool.prototype.deleteTask = function() {
  fs.unlink(this.task, err => {
    if (err) console.log('删除任务脚本失败')
  })
}
ThreadPool.prototype.log = function() {
  let now = Date.now()
  console.log('任务已完成，具体信息如下：')
  console.log(`完成${this.count}个子任务，总计耗时${now - this.start}ms`)
  console.log(`每个子任务平均耗时${(now - this.start) / this.count}ms`)
  console.log('The task has been completed, the specific information is as follows:')
  console.log(`Completed ${this.count} subtasks, It takes a total of ${now - this.start}ms`)
  console.log(`Each subtask takes ${(now - this.start) / this.count}ms`)
}
module.exports = ThreadPool
