const validate = (schema, source = null) => {
    return (req, res, next) => {
        const input = source
            ? req[source]
            : {
                body: req.body,
                params: req.params,
                query: req.query
            };
        const result = schema.safeParse(input);

        if (!result.success) {
            const error = new Error("Validation failed");

            error.statusCode = 400;

            error.errors = result.error.issues.map((issue) => ({
                field: (source ? issue.path : issue.path.slice(1)).join(".") || source || "request",
                message: issue.message
            }));

            return next(error);
        }

        if (source) {
            req[source] = result.data;
        } else {
            req.body = result.data.body;
            Object.assign(req.params, result.data.params);
            Object.assign(req.query, result.data.query);
        }

        return next();
    };
};

export { validate };