import {
  Address,
  ContractFunctionParameters,
  createPublicClient,
  encodePacked,
  http,
  keccak256,
  namehash,
} from 'viem';
import { base, mainnet } from 'viem/chains';
import L2ResolverAbi from '../abis/L2ResolverAbi';

export type Basename = `${string}.base.eth`;

export const BASENAME_L2_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';

export enum BasenameTextRecordKeys {
  Description = 'description',
  Keywords = 'keywords',
  Url = 'url',
  Email = 'email',
  Phone = 'phone',
  Github = 'com.github',
  Twitter = 'com.twitter',
  Farcaster = 'xyz.farcaster',
  Lens = 'xyz.lens',
  Telegram = 'org.telegram',
  Discord = 'com.discord',
  Avatar = 'avatar',
}

// Create a Viem client for Base
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

/**
 * Convert a chainId to a coinType hex for reverse chain resolution
 */
export const convertChainIdToCoinType = (chainId: number): string => {
  // L1 resolvers to addr
  if (chainId === mainnet.id) {
    return 'addr';
  }

  const cointype = (0x80000000 | chainId) >>> 0;
  return cointype.toString(16).toLocaleUpperCase();
};

/**
 * Convert an address to a reverse node for ENS resolution
 */
export const convertReverseNodeToBytes = (address: Address, chainId: number) => {
  const addressFormatted = address.toLowerCase() as Address;
  const addressNode = keccak256(addressFormatted.substring(2) as Address);
  const chainCoinType = convertChainIdToCoinType(chainId);
  const baseReverseNode = namehash(`${chainCoinType.toLocaleUpperCase()}.reverse`);
  const addressReverseNode = keccak256(
    encodePacked(['bytes32', 'bytes32'], [baseReverseNode, addressNode]),
  );
  return addressReverseNode;
};

/**
 * Get a Basename for an address
 */
export async function getBasename(address: Address): Promise<Basename | undefined> {
  try {
    const addressReverseNode = convertReverseNodeToBytes(address, base.id);
    const basename = await baseClient.readContract({
      abi: L2ResolverAbi,
      address: BASENAME_L2_RESOLVER_ADDRESS,
      functionName: 'name',
      args: [addressReverseNode],
    });
    if (basename) {
      return basename as Basename;
    }
    return undefined;
  } catch (error) {
    console.error('Error resolving Basename:', error);
    return undefined;
  }
}

/**
 * Get the avatar for a Basename
 */
export async function getBasenameAvatar(basename: Basename): Promise<string | null> {
  try {
    const avatarRecord = await getBasenameTextRecord(basename, BasenameTextRecordKeys.Avatar);
    return avatarRecord || null;
  } catch (error) {
    console.error('Error getting Basename avatar:', error);
    return null;
  }
}

/**
 * Build parameters for a text record contract call
 */
function buildBasenameTextRecordContract(
  basename: Basename,
  key: BasenameTextRecordKeys,
): ContractFunctionParameters {
  return {
    abi: L2ResolverAbi,
    address: BASENAME_L2_RESOLVER_ADDRESS,
    args: [namehash(basename), key],
    functionName: 'text',
  };
}

/**
 * Get a text record for a Basename
 */
export async function getBasenameTextRecord(basename: Basename, key: BasenameTextRecordKeys): Promise<string | null> {
  try {
    const contractParameters = buildBasenameTextRecordContract(basename, key);
    const textRecord = await baseClient.readContract(contractParameters);
    return textRecord as string || null;
  } catch (error) {
    console.error(`Error getting Basename text record for key ${key}:`, error);
    return null;
  }
} 