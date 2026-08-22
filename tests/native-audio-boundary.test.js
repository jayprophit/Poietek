import assert from 'node:assert/strict';
import test from 'node:test';

const {
  NativeAudioAdapterRegistry,
  NativeAudioBoundaryError,
  validateNativeAudioOpenRequest,
} = await import('./.compiled-core/engines/nativeAudioBoundary.js');

const validRequest = {
  inputPortIds: ['input-1'],
  outputPortIds: ['output-1'],
  sampleRate: 48_000,
  bufferSizeFrames: 256,
  inputChannels: 2,
  outputChannels: 2,
};

const availableAdapter = {
  id: 'test-asio',
  platform: 'windows',
  backend: 'asio',
  async probe() {
    return {
      adapterId: 'test-asio',
      platform: 'windows',
      backend: 'asio',
      state: 'available',
      observedAt: '2026-08-21T12:00:00.000Z',
      implementation: 'test-native-adapter/1',
      ports: [
        {
          id: 'input-1',
          name: 'Input 1-2',
          direction: 'input',
          channelCount: 2,
          isDefault: true,
          supportedSampleRates: [48_000],
          supportedBufferSizes: [128, 256],
        },
        {
          id: 'output-1',
          name: 'Output 1-2',
          direction: 'output',
          channelCount: 2,
          isDefault: true,
          supportedSampleRates: [48_000],
          supportedBufferSizes: [128, 256],
        },
      ],
    };
  },
  async open(request) {
    return {
      id: 'stream-1',
      adapterId: 'test-asio',
      backend: 'asio',
      request,
      getTelemetry: () => ({ callbackCount: 1, xruns: 0, droppedFrames: 0 }),
      close: async () => undefined,
    };
  },
};

test('native audio request validation rejects unusable configurations', () => {
  assert.deepEqual(validateNativeAudioOpenRequest(validRequest), []);
  const errors = validateNativeAudioOpenRequest({
    ...validRequest,
    outputPortIds: [],
    outputChannels: 0,
    sampleRate: 0,
  });
  assert.ok(errors.length >= 3);
});

test('native audio registry opens only a probed, supported configuration', async () => {
  const registry = new NativeAudioAdapterRegistry();
  registry.register(availableAdapter);
  const stream = await registry.open('test-asio', validRequest);
  assert.equal(stream.backend, 'asio');
  assert.equal(stream.getTelemetry().xruns, 0);
});

test('native audio registry refuses unavailable and unsupported claims', async () => {
  const registry = new NativeAudioAdapterRegistry();
  registry.register({
    ...availableAdapter,
    id: 'missing-driver',
    async probe() {
      return {
        ...(await availableAdapter.probe()),
        adapterId: 'missing-driver',
        state: 'configuration_required',
        message: 'Install and select a real driver',
      };
    },
  });

  await assert.rejects(
    registry.open('missing-driver', validRequest),
    (error) => error instanceof NativeAudioBoundaryError && error.code === 'adapter_unavailable',
  );

  const supported = new NativeAudioAdapterRegistry();
  supported.register(availableAdapter);
  await assert.rejects(
    supported.open('test-asio', { ...validRequest, sampleRate: 44_100 }),
    (error) => error instanceof NativeAudioBoundaryError && error.code === 'unsupported_configuration',
  );
});
