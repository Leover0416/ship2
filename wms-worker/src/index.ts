export default {
  async fetch(request: Request): Promise<Response> {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': '*',
          'access-control-max-age': '86400',
        },
      });
    }

    try {
      const url = new URL(request.url);
      
      // 构建后端 WMS 服务的 URL
      // 保留原始路径和查询参数
      const backendUrl = `http://59.46.138.121:85${url.pathname}${url.search}`;
      
      // 创建新的请求头，模拟浏览器请求
      const headers = new Headers();
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      headers.set('Accept', 'image/png,image/*;q=0.8,*/*;q=0.5');
      headers.set('Accept-Language', 'en-US,en;q=0.9');
      headers.set('Referer', 'http://59.46.138.121:85/');
      
      // 如果有原始请求的 Accept 头，使用它
      if (request.headers.get('accept')) {
        headers.set('Accept', request.headers.get('accept')!);
      }

      const upstreamResp = await fetch(backendUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
        // 禁用重定向，直接返回响应
        redirect: 'manual',
      });

      // 获取响应体
      const buf = await upstreamResp.arrayBuffer();
      const responseHeaders = new Headers(upstreamResp.headers);
      
      // 设置 CORS 头
      responseHeaders.set('access-control-allow-origin', '*');
      responseHeaders.set('access-control-allow-methods', 'GET, POST, OPTIONS');
      responseHeaders.set('access-control-allow-headers', '*');
      
      // 确保内容类型正确
      if (!responseHeaders.has('content-type')) {
        if (url.search.includes('format=image%2Fpng') || url.search.includes('format=image/png')) {
          responseHeaders.set('content-type', 'image/png');
        } else {
          responseHeaders.set('content-type', upstreamResp.headers.get('content-type') || 'application/octet-stream');
        }
      }

      return new Response(buf, {
        status: upstreamResp.status,
        statusText: upstreamResp.statusText,
        headers: responseHeaders,
      });
    } catch (error: any) {
      console.error('[WMS Proxy] Error:', error);
      return new Response(`Proxy Error: ${error?.message || String(error)}`, {
        status: 502,
        headers: {
          'content-type': 'text/plain',
          'access-control-allow-origin': '*',
        },
      });
    }
  },
};

