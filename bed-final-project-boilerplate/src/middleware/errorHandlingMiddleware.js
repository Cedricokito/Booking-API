import * as Sentry from '@sentry/node';

export const errorHandlingMiddleware = (error, req, res, next) => {
    console.error(`Error: ${error.message}`);
    Sentry.captureException(error); 
    res.status(error.status || 500).json({
        error: "An error occurred on the server, please double-check your request!"
    });
};
