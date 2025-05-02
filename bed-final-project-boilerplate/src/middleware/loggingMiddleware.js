export const loggingMiddleware = (req, res, next) => {
    const start = Date.now();
    const cleanup = () => {
        const end = Date.now();
        const duration = end - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    };

    res.once('finish', cleanup);
    res.once('close', cleanup);

    next();
};
