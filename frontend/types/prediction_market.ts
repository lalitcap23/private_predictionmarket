/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/prediction_market.json`.
 */
export type PredictionMarket = {
  "address": "5jRd4dAToWZAMPrhJS2HaCUDtaY5AYCSbtY3KRW1soDL",
  "metadata": {
    "name": "predictionMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Simple Binary Prediction Market - Educational purposes only, UNAUDITED"
  },
  "instructions": [
    {
      "name": "cancelMarket",
      "docs": [
        "Cancel a market (admin only)"
      ],
      "discriminator": [
        205,
        121,
        84,
        210,
        222,
        71,
        150,
        11
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "docs": [
        "Claim winnings from a resolved or cancelled market"
      ],
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "docs": [
            "User's token account"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMarket",
      "docs": [
        "Create a new prediction market",
        "",
        "All markets use Pyth oracle for SOL/USD price resolution",
        "- price_threshold: Price threshold in Pyth's native format (accounting for exponent)",
        "Example: For $160 threshold with exponent -8, use 160 * 10^8 = 16000000000"
      ],
      "discriminator": [
        103,
        226,
        97,
        235,
        200,
        188,
        251,
        254
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true
        },
        {
          "name": "marketVault",
          "docs": [
            "Market vault for holding tokens"
          ],
          "writable": true
        },
        {
          "name": "tokenMint",
          "docs": [
            "Token mint"
          ]
        },
        {
          "name": "creatorTokenAccount",
          "docs": [
            "Creator's token account (for fee payment)"
          ]
        },
        {
          "name": "feeRecipientTokenAccount",
          "docs": [
            "Fee recipient's token account"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "question",
          "type": "string"
        },
        {
          "name": "resolutionTime",
          "type": "i64"
        },
        {
          "name": "feeAmount",
          "type": "u64"
        },
        {
          "name": "priceThreshold",
          "type": "i64"
        }
      ]
    },
    {
      "name": "forfeitUnrevealed",
      "docs": [
        "Forfeit unrevealed stakes to protocol after reveal deadline (admin only)",
        "Transfers unrevealed committed stakes to protocol fee recipient"
      ],
      "discriminator": [
        106,
        138,
        130,
        170,
        105,
        11,
        59,
        183
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              },
              {
                "kind": "account",
                "path": "userToForfeit"
              }
            ]
          }
        },
        {
          "name": "userToForfeit",
          "docs": [
            "User whose unrevealed stake is being forfeited"
          ]
        },
        {
          "name": "feeRecipientTokenAccount",
          "docs": [
            "Protocol fee recipient token account (receives forfeited stakes)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the prediction market program"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "tokenMint",
          "docs": [
            "The SPL token mint for betting"
          ]
        },
        {
          "name": "feeRecipient"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxFeeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "pause",
      "docs": [
        "Pause the contract (admin only)"
      ],
      "discriminator": [
        211,
        22,
        221,
        251,
        74,
        121,
        193,
        47
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "placeBet",
      "docs": [
        "Place a bet on a market"
      ],
      "discriminator": [
        222,
        62,
        67,
        220,
        63,
        166,
        126,
        33
      ],
      "accounts": [
        {
          "name": "bettor",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              },
              {
                "kind": "account",
                "path": "bettor"
              }
            ]
          }
        },
        {
          "name": "bettorTokenAccount",
          "docs": [
            "Bettor's token account"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": {
            "defined": {
              "name": "outcome"
            }
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveMarket",
      "docs": [
        "Resolve a market (admin only)"
      ],
      "discriminator": [
        155,
        23,
        80,
        173,
        46,
        74,
        23,
        239
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "priceUpdate",
          "docs": [
            "Pyth price update account for SOL/USD feed"
          ]
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        },
        {
          "name": "winningOutcome",
          "type": {
            "defined": {
              "name": "outcome"
            }
          }
        }
      ]
    },
    {
      "name": "revealAndClaim",
      "docs": [
        "Reveal the committed outcome and claim fixed-odds winnings (5x payout)"
      ],
      "discriminator": [
        252,
        157,
        47,
        161,
        84,
        59,
        153,
        60
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "docs": [
            "User's token account to receive payout"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": {
            "defined": {
              "name": "outcome"
            }
          }
        },
        {
          "name": "salt",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "stakeAndCommit",
      "docs": [
        "Stake tokens and commit to a blind prediction (commit-reveal scheme)"
      ],
      "discriminator": [
        238,
        71,
        59,
        244,
        241,
        200,
        137,
        79
      ],
      "accounts": [
        {
          "name": "bettor",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "marketVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              },
              {
                "kind": "account",
                "path": "bettor"
              }
            ]
          }
        },
        {
          "name": "bettorTokenAccount",
          "docs": [
            "Bettor's token account (neutral ticket asset)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "unpause",
      "docs": [
        "Unpause the contract (admin only)"
      ],
      "discriminator": [
        169,
        144,
        4,
        38,
        10,
        141,
        188,
        255
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "docs": [
        "Update the global configuration (admin only)"
      ],
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "feeRecipient",
          "type": "pubkey"
        },
        {
          "name": "maxFeeBps",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "market",
      "discriminator": [
        219,
        190,
        213,
        55,
        0,
        227,
        198,
        154
      ]
    },
    {
      "name": "priceUpdateV2",
      "discriminator": [
        34,
        241,
        35,
        99,
        157,
        126,
        244,
        205
      ]
    },
    {
      "name": "userPosition",
      "discriminator": [
        251,
        248,
        209,
        245,
        83,
        234,
        17,
        27
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "paused",
      "msg": "Contract is paused"
    },
    {
      "code": 6001,
      "name": "notPaused",
      "msg": "Contract is not paused"
    },
    {
      "code": 6002,
      "name": "invalidAdmin",
      "msg": "Invalid admin"
    },
    {
      "code": 6003,
      "name": "unauthorizedCreator",
      "msg": "Creator not authorized to create markets"
    },
    {
      "code": 6004,
      "name": "invalidFee",
      "msg": "Invalid fee percentage"
    },
    {
      "code": 6005,
      "name": "invalidResolutionTime",
      "msg": "Invalid resolution time"
    },
    {
      "code": 6006,
      "name": "emptyQuestion",
      "msg": "Empty question"
    },
    {
      "code": 6007,
      "name": "questionTooLong",
      "msg": "Question too long"
    },
    {
      "code": 6008,
      "name": "marketNotFound",
      "msg": "Market not found"
    },
    {
      "code": 6009,
      "name": "marketNotActive",
      "msg": "Market not active"
    },
    {
      "code": 6010,
      "name": "marketAlreadyFinalized",
      "msg": "Market already finalized"
    },
    {
      "code": 6011,
      "name": "marketNotFinalized",
      "msg": "Market not finalized"
    },
    {
      "code": 6012,
      "name": "marketExpired",
      "msg": "Market expired"
    },
    {
      "code": 6013,
      "name": "marketNotExpired",
      "msg": "Market not expired"
    },
    {
      "code": 6014,
      "name": "invalidOutcome",
      "msg": "Invalid outcome"
    },
    {
      "code": 6015,
      "name": "noOpposition",
      "msg": "No opposition in market"
    },
    {
      "code": 6016,
      "name": "zeroAmount",
      "msg": "Zero amount"
    },
    {
      "code": 6017,
      "name": "noPosition",
      "msg": "No position"
    },
    {
      "code": 6018,
      "name": "alreadyClaimed",
      "msg": "Already claimed"
    },
    {
      "code": 6019,
      "name": "overflow",
      "msg": "Overflow error"
    },
    {
      "code": 6020,
      "name": "alreadyCommitted",
      "msg": "User has already committed in this market"
    },
    {
      "code": 6021,
      "name": "notCommitted",
      "msg": "User has not committed in this market"
    },
    {
      "code": 6022,
      "name": "alreadyRevealed",
      "msg": "User has already revealed in this market"
    },
    {
      "code": 6023,
      "name": "invalidCommitment",
      "msg": "Invalid commitment reveal data"
    },
    {
      "code": 6024,
      "name": "revealDeadlineExpired",
      "msg": "Reveal deadline has passed"
    },
    {
      "code": 6025,
      "name": "revealDeadlineNotPassed",
      "msg": "Reveal deadline has not passed yet"
    },
    {
      "code": 6026,
      "name": "noUnrevealedStakes",
      "msg": "No unrevealed stakes to forfeit"
    },
    {
      "code": 6027,
      "name": "pythPriceUpdateRequired",
      "msg": "Pyth price update account required for oracle-based markets"
    },
    {
      "code": 6028,
      "name": "pythPriceTooOld",
      "msg": "Pyth price update is too old"
    },
    {
      "code": 6029,
      "name": "pythFeedIdMismatch",
      "msg": "Pyth price feed ID mismatch"
    }
  ],
  "types": [
    {
      "name": "config",
      "docs": [
        "Global configuration account for the prediction market"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "Admin authority"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeRecipient",
            "docs": [
              "Fee recipient"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "SPL token mint for betting"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenDecimals",
            "docs": [
              "Token decimals"
            ],
            "type": "u8"
          },
          {
            "name": "maxFeeBps",
            "docs": [
              "Max fee percentage in basis points (100 = 1%)"
            ],
            "type": "u16"
          },
          {
            "name": "marketCounter",
            "docs": [
              "Total markets created"
            ],
            "type": "u64"
          },
          {
            "name": "paused",
            "docs": [
              "Paused flag"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "market",
      "docs": [
        "Market account storing all market data"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Unique market ID"
            ],
            "type": "u64"
          },
          {
            "name": "question",
            "docs": [
              "Market question (max 200 chars)"
            ],
            "type": "string"
          },
          {
            "name": "resolutionTime",
            "docs": [
              "Resolution time (unix timestamp)"
            ],
            "type": "i64"
          },
          {
            "name": "state",
            "docs": [
              "Current market state"
            ],
            "type": {
              "defined": {
                "name": "marketState"
              }
            }
          },
          {
            "name": "winningOutcome",
            "docs": [
              "Winning outcome (if resolved)"
            ],
            "type": {
              "defined": {
                "name": "outcome"
              }
            }
          },
          {
            "name": "yesPool",
            "docs": [
              "Total YES pool amount"
            ],
            "type": "u64"
          },
          {
            "name": "noPool",
            "docs": [
              "Total NO pool amount"
            ],
            "type": "u64"
          },
          {
            "name": "creationFee",
            "docs": [
              "Creation fee paid"
            ],
            "type": "u64"
          },
          {
            "name": "creator",
            "docs": [
              "Market creator"
            ],
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "docs": [
              "Created at timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "configFeeRecipient",
            "docs": [
              "Config snapshot - fee recipient"
            ],
            "type": "pubkey"
          },
          {
            "name": "configMaxFeeBps",
            "docs": [
              "Config snapshot - max fee bps"
            ],
            "type": "u16"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "docs": [
              "Vault bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "pythPriceFeedId",
            "docs": [
              "Pyth price feed ID (32 bytes) - None if manual resolution"
            ],
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "priceThreshold",
            "docs": [
              "Price threshold for YES outcome (in Pyth's native format with exponent)",
              "If price >= threshold, YES wins; else NO wins",
              "None if manual resolution"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "revealDeadline",
            "docs": [
              "Reveal deadline (unix timestamp) - deadline for users to reveal after market resolution",
              "Set to resolution_time + 2 weeks when market is resolved",
              "0 if market not yet resolved"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "marketState",
      "docs": [
        "Market state enum"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "resolved"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "outcome",
      "docs": [
        "Outcome enum"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "yes"
          },
          {
            "name": "no"
          }
        ]
      }
    },
    {
      "name": "priceFeedMessage",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feedId",
            "docs": [
              "`FeedId` but avoid the type alias because of compatibility issues with Anchor's `idl-build` feature."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "price",
            "type": "i64"
          },
          {
            "name": "conf",
            "type": "u64"
          },
          {
            "name": "exponent",
            "type": "i32"
          },
          {
            "name": "publishTime",
            "docs": [
              "The timestamp of this price update in seconds"
            ],
            "type": "i64"
          },
          {
            "name": "prevPublishTime",
            "docs": [
              "The timestamp of the previous price update. This field is intended to allow users to",
              "identify the single unique price update for any moment in time:",
              "for any time t, the unique update is the one such that prev_publish_time < t <= publish_time.",
              "",
              "Note that there may not be such an update while we are migrating to the new message-sending logic,",
              "as some price updates on pythnet may not be sent to other chains (because the message-sending",
              "logic may not have triggered). We can solve this problem by making the message-sending mandatory",
              "(which we can do once publishers have migrated over).",
              "",
              "Additionally, this field may be equal to publish_time if the message is sent on a slot where",
              "where the aggregation was unsuccesful. This problem will go away once all publishers have",
              "migrated over to a recent version of pyth-agent."
            ],
            "type": "i64"
          },
          {
            "name": "emaPrice",
            "type": "i64"
          },
          {
            "name": "emaConf",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "priceUpdateV2",
      "docs": [
        "A price update account. This account is used by the Pyth Receiver program to store a verified price update from a Pyth price feed.",
        "It contains:",
        "- `write_authority`: The write authority for this account. This authority can close this account to reclaim rent or update the account to contain a different price update.",
        "- `verification_level`: The [`VerificationLevel`] of this price update. This represents how many Wormhole guardian signatures have been verified for this price update.",
        "- `price_message`: The actual price update.",
        "- `posted_slot`: The slot at which this price update was posted."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "writeAuthority",
            "type": "pubkey"
          },
          {
            "name": "verificationLevel",
            "type": {
              "defined": {
                "name": "verificationLevel"
              }
            }
          },
          {
            "name": "priceMessage",
            "type": {
              "defined": {
                "name": "priceFeedMessage"
              }
            }
          },
          {
            "name": "postedSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userPosition",
      "docs": [
        "User position in a market"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "docs": [
              "Market ID"
            ],
            "type": "u64"
          },
          {
            "name": "user",
            "docs": [
              "User pubkey"
            ],
            "type": "pubkey"
          },
          {
            "name": "yesBet",
            "docs": [
              "Amount bet on YES (legacy, unused in commit-reveal flow)"
            ],
            "type": "u64"
          },
          {
            "name": "noBet",
            "docs": [
              "Amount bet on NO (legacy, unused in commit-reveal flow)"
            ],
            "type": "u64"
          },
          {
            "name": "claimed",
            "docs": [
              "Has user claimed their payout"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "commitment",
            "docs": [
              "Commit-reveal: keccak256(market_id, user, outcome, amount, salt)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "committedAmount",
            "docs": [
              "Total amount committed in tickets for this market"
            ],
            "type": "u64"
          },
          {
            "name": "revealed",
            "docs": [
              "Whether the user has already revealed their choice"
            ],
            "type": "bool"
          },
          {
            "name": "revealedOutcome",
            "docs": [
              "Revealed outcome for this commitment"
            ],
            "type": {
              "defined": {
                "name": "outcome"
              }
            }
          }
        ]
      }
    },
    {
      "name": "verificationLevel",
      "docs": [
        "Pyth price updates are bridged to all blockchains via Wormhole.",
        "Using the price updates on another chain requires verifying the signatures of the Wormhole guardians.",
        "The usual process is to check the signatures for two thirds of the total number of guardians, but this can be cumbersome on Solana because of the transaction size limits,",
        "so we also allow for partial verification.",
        "",
        "This enum represents how much a price update has been verified:",
        "- If `Full`, we have verified the signatures for two thirds of the current guardians.",
        "- If `Partial`, only `num_signatures` guardian signatures have been checked.",
        "",
        "# Warning",
        "Using partially verified price updates is dangerous, as it lowers the threshold of guardians that need to collude to produce a malicious price update."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "partial",
            "fields": [
              {
                "name": "numSignatures",
                "type": "u8"
              }
            ]
          },
          {
            "name": "full"
          }
        ]
      }
    }
  ]
};
