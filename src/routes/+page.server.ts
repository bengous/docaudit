import { env } from '$env/dynamic/private';
import { getClientLlmCatalog, resolveLlmSelection } from '$lib/server/llm/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		defaultMockMode: env.MOCK_MODE !== 'false',
		llm: {
			catalog: getClientLlmCatalog(),
			defaultSelection: resolveLlmSelection({}, env),
		},
	};
};
