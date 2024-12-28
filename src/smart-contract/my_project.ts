/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/my_project.json`.
 */
export type MyProject = {
  address: "B979w4ShSrvQYrW62iWgijkEyxFaXDVDZS2SwpT4iVNN";
  metadata: {
    name: "myProject";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "deposit";
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182];
      accounts: [
        {
          name: "poolAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 111, 108];
              }
            ];
          };
        },
        {
          name: "userTokenAccount";
          writable: true;
        },
        {
          name: "poolTokenAccount";
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
      args: [];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "poolAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 111, 111, 108];
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "poolAccount";
      discriminator: [116, 210, 187, 119, 196, 196, 52, 137];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "overflow";
      msg: "Addition overflow";
    },
    {
      code: 6001;
      name: "invalidAmount";
      msg: "Invalid deposit amount";
    },
    {
      code: 6002;
      name: "insufficientFunds";
      msg: "Insufficient funds for transaction";
    },
    {
      code: 6003;
      name: "invalidOwner";
      msg: "Invalid token account owner";
    },
    {
      code: 6004;
      name: "invalidMint";
      msg: "Invalid mint";
    },
    {
      code: 6005;
      name: "invalidAuthority";
      msg: "Invalid authority";
    }
  ];
  types: [
    {
      name: "poolAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "size";
            type: "u64";
          },
          {
            name: "authority";
            type: "pubkey";
          }
        ];
      };
    }
  ];
};
