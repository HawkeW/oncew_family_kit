export default defineEventHandler((event) => {
  // 仅在开发环境或明确需要跨域时启用
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const origin = getRequestHeader(event, 'origin');

    // 设置 CORS 头
    setResponseHeaders(event, {
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': '*'
    });

    // 如果有 origin，则回显 origin，以支持 allow-credentials
    if (origin) {
      setResponseHeader(event, 'Access-Control-Allow-Origin', origin);
    }

    // 处理 OPTIONS 预检请求
    if (getMethod(event) === 'OPTIONS') {
      event.node.res.statusCode = 204;
      event.node.res.statusMessage = 'No Content';
      return 'OK';
    }
  }
});
