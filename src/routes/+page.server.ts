import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		defaultMockMode: env.MOCK_MODE !== 'false',
	};
};
