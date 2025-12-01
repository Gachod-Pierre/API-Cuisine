const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack trace:', err.stack);

    // SQLite errors
    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({
            success: false,
            message: 'Database constraint violation',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({
            success: false,
            message: 'Foreign key constraint violation',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
            success: false,
            message: 'Resource already exists',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

module.exports = errorHandler;