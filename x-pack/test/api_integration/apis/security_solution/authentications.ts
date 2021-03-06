/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';
import { HostsQueries } from '../../../../plugins/security_solution/common/search_strategy';

import { FtrProviderContext } from '../../ftr_provider_context';

const FROM = '2000-01-01T00:00:00.000Z';
const TO = '3000-01-01T00:00:00.000Z';

// typical values that have to change after an update from "scripts/es_archiver"
const HOST_NAME = 'zeek-newyork-sha-aa8df15';
const TOTAL_COUNT = 3;
const EDGE_LENGTH = 1;

export default function ({ getService }: FtrProviderContext) {
  const esArchiver = getService('esArchiver');
  const supertest = getService('supertest');

  describe('authentications', () => {
    before(() => esArchiver.load('auditbeat/hosts'));
    after(() => esArchiver.unload('auditbeat/hosts'));

    it('Make sure that we get Authentication data', async () => {
      const { body: authentications } = await supertest
        .post('/internal/search/securitySolutionSearchStrategy/')
        .set('kbn-xsrf', 'true')
        .send({
          factoryQueryType: HostsQueries.authentications,
          timerange: {
            interval: '12h',
            to: TO,
            from: FROM,
          },
          pagination: {
            activePage: 0,
            cursorStart: 0,
            fakePossibleCount: 3,
            querySize: 1,
          },
          defaultIndex: ['auditbeat-*', 'filebeat-*', 'packetbeat-*', 'winlogbeat-*'],
          docValueFields: [],
          inspect: false,
        })
        .expect(200);

      expect(authentications.edges.length).to.be(EDGE_LENGTH);
      expect(authentications.totalCount).to.be(TOTAL_COUNT);
      expect(authentications.pageInfo.fakeTotalCount).to.equal(3);
    });

    it('Make sure that pagination is working in Authentications query', async () => {
      const { body: authentications } = await supertest
        .post('/internal/search/securitySolutionSearchStrategy/')
        .set('kbn-xsrf', 'true')
        .send({
          factoryQueryType: HostsQueries.authentications,
          timerange: {
            interval: '12h',
            to: TO,
            from: FROM,
          },
          pagination: {
            activePage: 2,
            cursorStart: 1,
            fakePossibleCount: 5,
            querySize: 2,
          },
          defaultIndex: ['auditbeat-*', 'filebeat-*', 'packetbeat-*', 'winlogbeat-*'],
          docValueFields: [],
          inspect: false,
        })
        .expect(200);

      expect(authentications.edges.length).to.be(EDGE_LENGTH);
      expect(authentications.totalCount).to.be(TOTAL_COUNT);
      expect(authentications.edges[0]!.node.lastSuccess!.host!.name).to.eql([HOST_NAME]);
    });
  });
}
