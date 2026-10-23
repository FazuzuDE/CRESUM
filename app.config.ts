import base from './app.json';
const host = process.env.EXPO_PUBLIC_SHARING_HOST?.trim();
const enabled =
  process.env.EXPO_PUBLIC_SHARING_ENABLED === 'true' &&
  !!host &&
  /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(host);
export default {
  ...base.expo,
  ...(enabled
    ? {
        ios: { ...base.expo.ios, associatedDomains: [`applinks:${host}`] },
        android: {
          ...base.expo.android,
          intentFilters: [
            {
              action: 'VIEW',
              autoVerify: true,
              data: [{ scheme: 'https', host, pathPrefix: '/shared' }],
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        },
      }
    : {}),
};
