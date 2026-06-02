import { env } from '$env/dynamic/private';
import { getClientLlmCatalog, resolveLlmSelection } from '$lib/server/llm/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const catalog = await getClientLlmCatalog();
	const defaultSelection = await resolveLlmSelection({}, env);

	return {
		defaultMockMode: env.MOCK_MODE !== 'false',
		llm: {
			catalog,
			defaultSelection,
		},
	};
};
