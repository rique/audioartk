export const withNumericContext = (defaults) => (originalMethod) => {
    return function(i, context) {
        const safeContext = { ...context };
        Object.keys(defaults).forEach(key => {
            const val = safeContext[key];
            const isInvalid = val === null || val === "" || isNaN(Number(val));
            safeContext[key] = isInvalid ? defaults[key] : Number(val);
        });
        return originalMethod.apply(this, [i, safeContext]);
    };
};
