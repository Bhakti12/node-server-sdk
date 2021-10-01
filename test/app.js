const sinon = require('sinon');
const supertest = require('supertest');
const { createApp, startApp } = require('..');

const appId = 'xxx';
const appSecret = 'yyy';
const manifest = {
  id: appId,
  endpoint: { secret: appSecret },
  operations: {
    xxx: {
      method: 'POST',
      path: ['xxx'],
    },
  },
};

beforeEach(() => {
  sinon.restore();
});

describe('app', () => {
  describe('createApp', () => {
    it('Applies auth/dispatch middleware', async () => {
      const handlerSpy = sinon.spy(() => ({ resource: 'xxx' }));
      const operations = {
        xxx: {
          method: 'POST',
          path: ['xxx'],
          handlerFn: handlerSpy,
        },
      };
      const ctx = { manifest: { ...manifest, operations } };
      const app = createApp({ ctx });
      const req = supertest(app.callback());
      const message = { type: 'operation', operation: { id: 'xxx' } };

      // Without token
      await req.post('/aidbox').send(message).expect(401);
      sinon.assert.notCalled(handlerSpy);

      // With invalid token
      await req
        .post('/aidbox')
        .set('Authorization', `Bearer xxx`)
        .send(message)
        .expect(401);
      sinon.assert.notCalled(handlerSpy);

      // With valid token
      const token = Buffer.from(`${appId}:${appSecret}`).toString('base64');
      await req
        .post('/aidbox')
        .set('Authorization', `Bearer ${token}`)
        .send(message)
        .expect(200, 'xxx');
      sinon.assert.calledOnce(handlerSpy);
    });
  });
});
