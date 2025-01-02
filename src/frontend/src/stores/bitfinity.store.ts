import type { BitfinityToken } from '$env/omnity-tokens.erc20.env';
import { BITFINITY_TOKENS } from '$env/omnity-tokens.erc20.env';
import { writable } from 'svelte/store';

// Store for enabled Bitfinity tokens
export const enabledBitfinityTokens = writable<BitfinityToken[]>(BITFINITY_TOKENS);
