module.exports = class RedirectError extends Error {
    constructor(message) {
        super(message);
        this.name = "RedirectError";
    }
}
