export const MH_BASE_URL_TEST = 'https://apitest.dtes.mh.gob.sv';
export const MH_BASE_URL_PROD = 'https://api.dtes.mh.gob.sv';

export type MHEnvironment = 'test' | 'prod';

export function getBaseUrl(env: MHEnvironment): string {
  return env === 'prod' ? MH_BASE_URL_PROD : MH_BASE_URL_TEST;
}
