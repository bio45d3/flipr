import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';

// Placeholder IDL - will be replaced with actual program IDL after deployment
const PLACEHOLDER_IDL: Idl = {
  address: PROGRAM_ID.toBase58(),
  metadata: {
    name: 'flipr',
    version: '0.1.0',
    spec: '0.1.0',
  },
  instructions: [],
  accounts: [],
  types: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FliprProgram = Program<any>;

export function getProgram(
  connection: Connection,
  wallet: AnchorProvider['wallet']
): FliprProgram {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  
  return new Program(PLACEHOLDER_IDL, provider);
}

// PDA helpers
export function findPoolPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool')],
    PROGRAM_ID
  );
}

export function findVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault')],
    PROGRAM_ID
  );
}

export function findBetPDA(user: PublicKey, betId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), user.toBuffer(), Buffer.from([betId])],
    PROGRAM_ID
  );
}

export function findLpPositionPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('lp_position'), user.toBuffer()],
    PROGRAM_ID
  );
}
