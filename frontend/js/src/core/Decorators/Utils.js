export const decorate = (ClassRef, methodName, decorator) => {
    // We decorate the prototype so every instance of this class is born "shielded"
    const original = ClassRef.prototype[methodName];
    
    if (typeof original !== 'function') {
        console.warn(`Method ${methodName} not found on ${ClassRef.name}`);
        return;
    }

    // Apply the decorator to the prototype method
    ClassRef.prototype[methodName] = decorator(original);
};