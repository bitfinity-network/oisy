import {
	IcAppMetadataSchema,
	IcCanistersSchema,
	IcCkInterfaceSchema,
	IcCkLinkedAssetsSchema,
	IcCkMetadataSchema,
	IcCkTokenSchema,
	IcFeeSchema,
	IcInterfaceSchema,
	IcTokenSchema,
	IcTokenWithoutIdSchema
} from '$icp/validation/ic-token.validation';
import type { Option } from '$lib/types/utils';
import { z } from 'zod';

export type IcFee = z.infer<typeof IcFeeSchema>;

export type IcAppMetadata = z.infer<typeof IcAppMetadataSchema>;

export type IcCanisters = z.infer<typeof IcCanistersSchema>;

export type IcCkLinkedAssets = z.infer<typeof IcCkLinkedAssetsSchema>;

export type IcCkMetadata = z.infer<typeof IcCkMetadataSchema>;

export type IcInterface = z.infer<typeof IcInterfaceSchema>;

export type IcToken = z.infer<typeof IcTokenSchema>;

export type IcTokenWithoutId = z.infer<typeof IcTokenWithoutIdSchema>;

export type IcCkToken = z.infer<typeof IcCkTokenSchema>;

export type IcCkInterface = z.infer<typeof IcCkInterfaceSchema>;

export type OptionIcToken = Option<IcToken>;
export type OptionIcCkToken = Option<IcCkToken>;
