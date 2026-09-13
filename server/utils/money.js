const isValidMoney = (value) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        return false;
    }

    const cents = Math.round(value * 100);
    return Math.abs(value * 100 - cents) < 0.001;
};

const toMoney = (value) => Math.round(value * 100) / 100;

module.exports = {
    isValidMoney,
    toMoney
};
