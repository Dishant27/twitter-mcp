const assert = require('node:assert/strict');
const test = require('node:test');

const {
  XQUIK_SEARCH_TOOL,
  XquikClient,
  handleXquikSearch,
} = require('../dist/xquik-api.js');

test('publishes the Xquik search tool contract', () => {
  assert.equal(XQUIK_SEARCH_TOOL.name, 'xquik_search_tweets');
  assert.deepEqual(XQUIK_SEARCH_TOOL.inputSchema.required, ['query']);
  assert.deepEqual(
    XQUIK_SEARCH_TOOL.inputSchema.properties.queryType.enum,
    ['Latest', 'Top']
  );
});

test('maps MCP search input to the Xquik request contract', async () => {
  let request;
  const fetcher = async (url, init) => {
    request = { init, url: String(url) };
    return {
      json: async () => ({ data: [{ id: '1' }] }),
      ok: true,
    };
  };
  const client = new XquikClient(
    'xq_test',
    'https://example.test',
    fetcher
  );

  const result = await client.searchTweets({
    count: 25,
    cursor: 'next page',
    query: 'mcp tools',
    queryType: 'Top',
    sinceTime: '1700000000',
    untilTime: '1800000000',
  });

  assert.deepEqual(result, { data: [{ id: '1' }] });
  assert.equal(
    request.url,
    'https://example.test/api/v1/x/tweets/search?' +
      'q=mcp+tools&queryType=Top&limit=25&cursor=next+page&' +
      'sinceTime=1700000000&untilTime=1800000000'
  );
  assert.deepEqual(request.init.headers, {
    Accept: 'application/json',
    'x-api-key': 'xq_test',
  });
});

test('surfaces a failed Xquik response as a typed service error', async () => {
  const client = new XquikClient(
    'xq_test',
    'https://example.test',
    async () => ({ ok: false, status: 429 })
  );

  await assert.rejects(
    client.searchTweets({
      count: 10,
      query: 'mcp',
      queryType: 'Latest',
    }),
    (error) => error.code === 429 && /status 429/.test(error.message)
  );
});

test('applies MCP defaults before calling the Xquik client', async () => {
  let captured;
  const result = await handleXquikSearch(
    {
      searchTweets: async (params) => {
        captured = params;
        return { data: [] };
      },
    },
    { query: 'mcp' }
  );

  assert.deepEqual(captured, {
    count: 10,
    query: 'mcp',
    queryType: 'Latest',
  });
  assert.deepEqual(result, {
    content: [
      {
        type: 'text',
        text: '{\n  "data": []\n}',
      },
    ],
  });
});
