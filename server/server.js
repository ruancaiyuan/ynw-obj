const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const { spawn } = require('child_process');
const { Readable } = require('stream');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// 存储已处理的访问记录
const processedRequests = new Map();
const CACHE_FILE = path.join(__dirname, 'cache', 'requests.json');

// 确保缓存目录存在
async function ensureCacheDir() {
  const cacheDir = path.join(__dirname, 'cache');
  try {
    await fs.access(cacheDir);
  } catch {
    await fs.mkdir(cacheDir, { recursive: true });
  }
}

// 加载缓存的请求记录
async function loadCachedRequests() {
  try {
    await ensureCacheDir();
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    const cached = JSON.parse(data);
    for (const [key, value] of Object.entries(cached)) {
      processedRequests.set(key, value);
    }
    console.log(`已加载 ${processedRequests.size} 条缓存记录`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('加载缓存记录失败:', error);
    }
  }
}

// 保存缓存的请求记录
async function saveCachedRequests() {
  try {
    await ensureCacheDir();
    const data = Object.fromEntries(processedRequests);
    await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log(`已保存 ${processedRequests.size} 条缓存记录`);
  } catch (error) {
    console.error('保存缓存记录失败:', error);
  }
}

// 清理过期记录的函数
async function cleanupExpiredRecords() {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, data] of processedRequests.entries()) {
    if (now - data.timestamp > 24 * 60 * 60 * 1000) { // 24小时后过期
      processedRequests.delete(key);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`已清理 ${deletedCount} 条过期记录`);
    await saveCachedRequests();
  }
}

// 每小时清理一次过期记录
setInterval(() => cleanupExpiredRecords(), 60 * 60 * 1000);

// 定期保存缓存记录（每5分钟）
setInterval(() => saveCachedRequests(), 5 * 60 * 1000);

// 在服务器启动时加载缓存
loadCachedRequests().catch(console.error);

// 配置 CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.1.17:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  credentials: true
}));

app.use(express.json());

// 将流转换为 Buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// 转换音频格式
async function convertToWav(inputBuffer) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-acodec', 'pcm_s16le',
      '-ar', '44100',
      '-ac', '2',
      '-f', 'wav',
      'pipe:1'
    ]);

    const chunks = [];
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stdout.on('end', () => resolve(Buffer.concat(chunks)));
    ffmpeg.stderr.on('data', (data) => console.log(`ffmpeg stderr: ${data}`));
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg process exited with code ${code}`));
      }
    });

    const inputStream = new Readable();
    inputStream.push(inputBuffer);
    inputStream.push(null);
    inputStream.pipe(ffmpeg.stdin);
  });
}

// 代理音频文件
app.get('/api/audio', async (req, res) => {
  try {
    const url = req.query.url;
    const songName = req.query.songName;
    const artistName = req.query.artistName;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('正在请求音频:', url);

    // 获取音频流
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://qishui.douyin.com/',
        'Range': req.headers.range || 'bytes=0-',
        'Origin': 'https://qishui.douyin.com'
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      },
      timeout: 30000
    });

    console.log('音频响应状态:', response.status);
    console.log('音频响应头:', response.headers);

    // 如果是下载请求且需要 WAV 格式
    if (req.query.download && req.query.format === 'wav') {
      console.log('正在转换为 WAV 格式...');
      const audioBuffer = await streamToBuffer(response.data);
      const wavBuffer = await convertToWav(audioBuffer);

      const fileName = `${songName}-${artistName}.wav`.replace(/[<>:"/\\|?*]/g, '_');

      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': wavBuffer.length,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type'
      });

      res.send(wavBuffer);
      return;
    }

    // 设置响应头
    const headers = {
      'Content-Type': response.headers['content-type'] || 'audio/mpeg',
      'Content-Length': response.headers['content-length'],
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Content-Disposition': req.query.download ?
        `attachment; filename*=UTF-8''${encodeURIComponent(`${songName}-${artistName}.mp3`.replace(/[<>:"/\\|?*]/g, '_'))}` :
        'inline',
      'Cache-Control': 'public, max-age=31536000'
    };

    if (response.headers['content-range']) {
      headers['Content-Range'] = response.headers['content-range'];
    }

    res.set(headers);

    // 处理流错误
    response.data.on('error', (error) => {
      console.error('音频流错误:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: '音频流传输错误'
        });
      }
    });

    // 添加数据监听
    let receivedBytes = 0;
    response.data.on('data', (chunk) => {
      receivedBytes += chunk.length;
      console.log(`已接收 ${receivedBytes} 字节`);
    });

    // 将音频流传输到客户端
    response.data.pipe(res);

    // 处理客户端断开连接
    req.on('close', () => {
      console.log('客户端断开连接');
      response.data.destroy();
    });

  } catch (error) {
    console.error('音频代理错误:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers
      } : null
    });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch audio',
        details: {
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText
          } : null
        }
      });
    }
  }
});

// 代理汽水音乐请求
app.get('/api/qishui', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 从 URL 中提取路径
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const searchParams = urlObj.searchParams.toString();
    const cacheKey = `${path}?${searchParams}`;

    // 检查是否已经处理过这个请求
    if (processedRequests.has(cacheKey)) {
      console.log(`使用缓存的请求数据: ${cacheKey}`);
      return res.json({
        success: true,
        data: processedRequests.get(cacheKey).data,
        cached: true
      });
    }

    console.log('正在请求URL:', url);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://qishui.douyin.com/'
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });

    console.log('获取到响应数据');

    const $ = cheerio.load(response.data);

    let routerData = null;
    $('script').each((i, elem) => {
      const content = $(elem).html();
      if (content && content.includes('_ROUTER_DATA')) {
        const match = content.match(/_ROUTER_DATA\s*=\s*(\{.*});/);
        if (match) {
          try {
            routerData = JSON.parse(match[1]);
            console.log('成功解析到数据');
          } catch (e) {
            console.error('JSON解析错误:', e);
          }
        }
      }
    });

    if (!routerData) {
      console.log('未找到页面数据');
      return res.status(404).json({
        success: false,
        error: '未找到页面数据'
      });
    }

    // 存储处理过的请求数据
    processedRequests.set(cacheKey, {
      data: routerData,
      timestamp: Date.now()
    });

    // 异步保存缓存
    saveCachedRequests().catch(console.error);

    console.log('返回数据');
    res.json({
      success: true,
      data: routerData,
      cached: false
    });
  } catch (error) {
    console.error('代理错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch data'
    });
  }
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`健康检查地址: http://localhost:${PORT}/health`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器');
  await saveCachedRequests();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
