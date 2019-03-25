// 进程池使用示例
const fs = require('fs')
const ThreadPool = require('../src/ThreadPool')
const taskParams = []
for (let i = 0; i < 20; i++) {
  taskParams[i] = [i]
}
// 创建进程池实例
const threadPool = new ThreadPool({
  maxParallelThread: 2,
  timeToClose: 60 * 1000,
  dependency: `const fs = require('fs')`,
  workDir: __dirname,
  taskName: 'writeNumber',
  script: async function task(workParam) {
    try {
      fs.appendFileSync(`${__dirname}/numbers.txt`, `${workParam[0]}\n`)
    } catch (e) {
      console.log(e)
    }
  },
  taskParams
})
threadPool.run()

