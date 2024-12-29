/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/mcga_pool.json`.
 */
export type McgaPool = {
  address: "DNsprXHccVbxFTE2RNvchU3E3W1Hn3U4yosFSiVs8bQT";
  metadata: {
    name: "mcgaPool";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "depositWithHash";
      discriminator: [145, 159, 231, 106, 77, 224, 173, 59];
      accounts: [
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "pool.seed";
                account: "pool";
              }
            ];
          };
        },
        {
          name: "poolTokenAccount";
          writable: true;
        },
        {
          name: "userTokenAccount";
          writable: true;
        },
        {
          name: "user";
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "attemptHash";
          type: "string";
        }
      ];
    },
    {
      name: "initializePool";
      discriminator: [95, 180, 10, 172, 84, 174, 232, 40];
      accounts: [
        {
          name: "pool";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "seed";
              }
            ];
          };
        },
        {
          name: "poolTokenAccount";
          writable: true;
          signer: true;
        },
        {
          name: "mcgaMint";
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "seed";
          type: "string";
        },
        {
          name: "secretHash";
          type: "string";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "pool";
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188];
    }
  ];
  types: [
    {
      name: "pool";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "tokenAccount";
            type: "pubkey";
          },
          {
            name: "secretHash";
            type: "string";
          },
          {
            name: "seed";
            type: "string";
          }
        ];
      };
    }
  ];
};
