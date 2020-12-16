module.exports = class HangupError extends Error {
    constructor(message) {
        super(message);
        this.name = "HangupError";
    }
}
