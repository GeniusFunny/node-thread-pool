# Node Thread Pool

**使用worker_threads(试验性，非标准)替换child_process～**

## ✨ Features

- 更快

  1000个任务，每个任务需空循环200ms，然后写入文本

  **单线程**(未测试，理论上)：**至少需要200s**。

  **进程池**(已测试，容量为50的进程池)：**8.022s**

  **线程池**(已测试，容量为50的线程池)：**7.198s**

  **效率提升：随着任务和单任务耗时越多，理论上最高提速50倍**

## 📦 安装

```bash
npm install node-workerthread-pool
```

## 🔨使用

```js
// 线进程池使用示例
const fs = require('fs')
const ThreadPool = require('../src/ThreadPool')
const taskParams = []
for (let i = 0; i < 1000; i++) {
  taskParams[i] = [i]
}
// 创建线程池实例
const threadPool = new ThreadPool({
  maxParallelThread: 50,
  timeToClose: 60 * 1000,
  dependency: `const fs = require('fs')`,
  workDir: __dirname,
  taskName: 'writeNumber',
  script: async function task(workParam) {
    try {
      let start = Date.now()
      while (Date.now() < start + 200) {}
      fs.appendFileSync(`${__dirname}/numbers.txt`, `${workParam[0]}\n`)
    } catch (e) {
      console.log(e)
    }
  },
  taskParams
})
threadPool.run()
```

## 🤝贡献 [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

I welcome all contributions. You can submit any ideas as [pull requests](https://github.com/geniusfunny/node-process-pool/pulls) or as [GitHub issues](https://github.com/geniusfunny/node-process/issues). If you'd like to improve code, please create a Pull Request.

