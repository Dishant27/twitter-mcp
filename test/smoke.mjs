// Smoke test: start the built server over stdio with placeholder credentials
// and check that it initializes and lists the expected tools.
// No X API calls are made.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const expected = [
  'post_tweet', 'search_tweets', 'get_profile', 'update_profile',
  'follow_user', 'unfollow_user', 'list_followers', 'list_following',
  'create_list', 'get_list_info', 'get_user_lists'
];

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/index.js'],
  env: {
    PATH: process.env.PATH ?? '',
    TWITTER_API_KEY: 'placeholder',
    TWITTER_API_SECRET: 'placeholder',
    TWITTER_ACCESS_TOKEN: 'placeholder',
    TWITTER_ACCESS_TOKEN_SECRET: 'placeholder'
  },
  stderr: 'inherit'
});

const client = new Client({ name: 'smoke-test', version: '0.0.0' });
const timer = setTimeout(() => {
  console.error('Smoke test timed out');
  process.exit(1);
}, 15000);

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map(t => t.name).sort();
  const missing = expected.filter(n => !names.includes(n));
  if (missing.length || names.length !== expected.length) {
    console.error('Unexpected tool list:', names, 'missing:', missing);
    process.exit(1);
  }
  console.log(`OK: server listed ${names.length} tools`);
} catch (error) {
  console.error('Smoke test failed:', error);
  process.exit(1);
} finally {
  clearTimeout(timer);
  await client.close();
}
