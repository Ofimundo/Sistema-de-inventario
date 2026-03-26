class Logger {
    info(message, data = null) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
        if (data) console.log(data);
    }

    error(message, error = null) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
        if (error) {
            if (error.stack) console.error(error.stack);
            else console.error(error);
        }
    }

    warn(message) {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
            if (data) console.log(data);
        }
    }

    database(query, params = null) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DB] ${new Date().toISOString()}: ${query}`);
            if (params) console.log('Params:', params);
        }
    }
}

module.exports = new Logger();