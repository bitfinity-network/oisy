import { Actor, type Agent } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';

export const createActor = <T>({
	canisterId,
	interfaceFactory,
	agent
}: {
	canisterId: string;
	interfaceFactory: IDL.InterfaceFactory;
	agent: Agent;
}) =>
	Actor.createActor<T>(interfaceFactory, {
		canisterId,
		agent
	});
