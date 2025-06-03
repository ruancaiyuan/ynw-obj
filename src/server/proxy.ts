import express from 'express';
import axios from 'axios';
import cors from 'cors';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

// 代理汽水音乐请求
app.get('/api/qishui', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 使用 axios 获取页面内容
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://qishui.douyin.com/'
      }
    });

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
          } catch (e) {
            console.error('JSON parse error:', e);
          }
        }
      }
    });

    if (!routerData) {
      return res.status(404).json({
        success: false,
        error: '未找到页面数据'
      });
    }

    res.json({
      success: true,
      data: routerData
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch data'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
