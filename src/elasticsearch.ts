import { Client } from '@elastic/elasticsearch';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types';
import { winstonLogger } from '@SiarhKul/jobber-shared';
import { Logger } from 'winston';
import { config } from './configuration';

const log: Logger = winstonLogger(
	`${config.ELASTIC_SEARCH_URL}`,
	'authServiceElasticSearchServer',
	'debug'
);

const elasticSearchClient = new Client({
	node: `${config.ELASTIC_SEARCH_URL}`
});

export async function checkConnection(): Promise<void> {
	let isConnected = false;

	while (!isConnected) {
		try {
			const health: ClusterHealthHealthResponseBody= await elasticSearchClient.cluster.health({});
			
      log.info(`Auth Elasticsearch health status-${health.status}`);
			
      isConnected = true;
		} catch (error) {
			log.error('Auth Elasticsearch connection failed. Retrying in 5 seconds.', error);
			
      await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}
}