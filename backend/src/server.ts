import { createApp } from './app';
import { loadConfig, type Config } from './config';
import { SmtpMailer } from './enquiries/smtpMailer';
import { FakeStoreSource } from './products/fakeStoreSource';

function readConfigOrExit(): Config {
  try {
    return loadConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const config = readConfigOrExit();

// The one place where real adapters are chosen.
const productSource = new FakeStoreSource({
  baseUrl: config.fakeStoreBaseUrl,
  cacheTtlSeconds: config.productCacheTtlSeconds,
});
const mailer = new SmtpMailer(config.smtp);

createApp({ config, productSource, mailer }).listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
