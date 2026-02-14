/// Maximum fee in basis points (10% = 1000)
pub const MAX_FEE_LIMIT: u16 = 1000;

/// Maximum question length
pub const MAX_QUESTION_LENGTH: usize = 200;

/// SOL/USD Pyth price feed ID (hardcoded for Solana price prediction markets)
/// Feed ID: 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d
pub const SOL_USD_FEED_ID: [u8; 32] = [
    0xef, 0x0d, 0x8b, 0x6f, 0xda, 0x2c, 0xeb, 0xa4,
    0x1d, 0xa1, 0x5d, 0x40, 0x95, 0xd1, 0xda, 0x39,
    0x2a, 0x0d, 0x2f, 0x8e, 0xd0, 0xc6, 0xc7, 0xbc,
    0x0f, 0x4c, 0xfa, 0xc8, 0xc2, 0x80, 0xb5, 0x6d,
];

/// Allowed creators for markets (whitelist)
pub const ALLOWED_CREATORS: [&str; 2] = [
    "5YXbYQCnBSTX3fmYbuGNSbY3J24v5KRZ11aWh856WWc3",
    "455q3UD1KkfMP7zWrd2XcYoZW8LaVoiU969cmusengZ9",
];
