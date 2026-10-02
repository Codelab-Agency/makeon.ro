import { withPayload } from '@payloadcms/next/withPayload';

export default withPayload({
  ...(process.env.NEXT_OUTPUT_STANDALONE === 'true' ? { output: 'standalone' } : {}),
});
