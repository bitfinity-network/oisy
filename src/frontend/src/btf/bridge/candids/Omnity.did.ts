import type { ActorMethod } from '@dfinity/agent';

export interface TokenResp {
	decimals: number;
	token_id: string;
	icon: [] | [string];
	evm_contract: [] | [string];
	symbol: string;
}

export type MintTokenStatus =
	| { Finalized: { tx_hash: string } }
	| { Pending: null }
	| { Processing: null }
	| { Failed: null };

export interface _SERVICE {
	get_fee: ActorMethod<[string], [] | [bigint]>;
	get_token_list: ActorMethod<[], Array<TokenResp>>;
	mint_token_status: ActorMethod<[string], MintTokenStatus>;
}

// Generated IDL factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const idlFactory = ({ IDL }: { IDL: any }) => {
	const TokenResp = IDL.Record({
		decimals: IDL.Nat8,
		token_id: IDL.Text,
		icon: IDL.Opt(IDL.Text),
		evm_contract: IDL.Vec(IDL.Text),
		symbol: IDL.Text
	});

	const MintTokenStatus = IDL.Variant({
		Pending: IDL.Null,
		Processing: IDL.Null,
		Finalized: IDL.Record({ tx_hash: IDL.Text }),
		Failed: IDL.Null
	});

	return IDL.Service({
		get_fee: IDL.Func([IDL.Text], [IDL.Opt(IDL.Nat64)], ['query']),
		get_token_list: IDL.Func([], [IDL.Vec(TokenResp)], ['query']),
		mint_token_status: IDL.Func([IDL.Text], [MintTokenStatus], ['query'])
	});
};
