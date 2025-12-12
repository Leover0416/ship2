export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 将请求透传到后端 WMS 服务
    url.hostname = '59.46.138.121';
    url.port = '85';
    url.protocol = 'http:'; // 源站是 http

    // 如果只想代理 /map/ 前缀，可启用判断：
    // if (!url.pathname.startsWith('/map/')) {
    //   return new Response('Not Found', { status: 404 });
    // }

    const upstreamUrl = url.toString();

    const upstreamResp = await fetch(upstreamUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const buf = await upstreamResp.arrayBuffer();
    const headers = new Headers(upstreamResp.headers);
    // 放宽 CORS，方便前端调用
    headers.set('access-control-allow-origin', '*');

    return new Response(buf, {
      status: upstreamResp.status,
      headers,
    });
  },
};

