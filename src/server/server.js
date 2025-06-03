const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();

// 配置 CORS
app.use(cors({
  origin: 'http://localhost:5173', // 允许前端开发服务器的请求
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 代理汽水音乐请求
app.get('/api/qishui', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('正在请求URL:', url);

    // 使用 axios 获取页面内容
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://qishui.douyin.com/'
      },
      maxRedirects: 5, // 允许重定向
      validateStatus: function (status) {
        return status >= 200 && status < 400; // 接受 2xx 和 3xx 状态码
      }
    });

    console.log('获取到响应数据');

    // 使用 cheerio 解析 HTML
    const $ = cheerio.load(response.data);
    
    // 查找包含 _ROUTER_DATA 的脚本标签
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

    console.log('返回数据');
    res.json({
      success: true,
      data: routerData
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
const server = app.listen(PORT, () => {
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
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
}); 