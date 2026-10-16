import config from '../resumed-resilience/pressure.config.mjs';

export default {
  ...config,
  cacheDir: new URL(`./cache-${process.env.AUDIT_VARIANT}`, import.meta.url).pathname,
};
