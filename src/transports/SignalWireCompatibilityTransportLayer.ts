import { getLogger } from '@openai/agents';
import type { WebSocket as NodeWebSocket } from 'ws';
import type { RealtimeSessionConfig } from '@openai/agents/realtime';
import {
  TwilioRealtimeTransportLayer,
  type TwilioRealtimeTransportLayerOptions
} from '@openai/agents-extensions';

/**
 * The options for the SignalWire Realtime Transport Layer.
 */
export type SignalWireCompatibilityTransportLayerOptions =
  Omit<TwilioRealtimeTransportLayerOptions, 'twilioWebSocket'> & {
    /**
     * The websocket that is receiving messages from SignalWire's Media Streams API. Typically the
     * connection gets passed into your request handler when running your WebSocket server.
     */
    signalWireWebSocket: WebSocket | NodeWebSocket;
    /**
     * The audio format to use for input and output audio.
     * - 'g711_ulaw': Standard telephony quality (8kHz) - matches SignalWire default
     * - 'pcm16': High quality uncompressed (24kHz) - for L16@24000h codec
     * @default 'g711_ulaw'
     */
    audioFormat?: 'pcm16' | 'g711_ulaw';
  };

/**
 * An adapter to connect a websocket that is receiving messages from SignalWire's Media Streams API to
 * the OpenAI Realtime API via WebSocket.
 *
 * SignalWire's cXML Media Streams API is compatible with Twilio's, so this extends TwilioRealtimeTransportLayer
 * and adds configurable audio format support (pcm16 or g711_ulaw).
 *
 * It automatically handles setting the right audio format for the input and output audio, passing
 * the data along and handling the timing for interruptions using SignalWire's `clear` events.
 *
 * It does require you to run your own WebSocket server that is receiving connection requests from
 * SignalWire.
 *
 * It will emit all SignalWire received messages as `signalwire_message` type messages on the `*` handler.
 * If you are using a `RealtimeSession` you can listen to the `transport_event`.
 *
 * @example
 * ```ts
 * const transport = new SignalWireCompatibilityTransportLayer({
 *   signalWireWebSocket: signalWireWebSocket,
 *   audioFormat: 'pcm16', // Optional: defaults to 'g711_ulaw'
 * });
 *
 * transport.on('*', (event) => {
 *   if (event.type === 'signalwire_message') {
 *     // Handle SignalWire message
 *   }
 * });
 * ```
 */
export class SignalWireCompatibilityTransportLayer extends TwilioRealtimeTransportLayer {
  #audioFormat: 'pcm16' | 'g711_ulaw';
  #logger = getLogger('openai-agents:extensions:signalwire');

  constructor(options: SignalWireCompatibilityTransportLayerOptions) {
    // Map signalWireWebSocket to twilioWebSocket for parent class
    super({
      ...options,
      twilioWebSocket: options.signalWireWebSocket,
    });

    // Default to g711_ulaw (SignalWire's default) if not specified
    this.#audioFormat = options.audioFormat || 'g711_ulaw';
    this.#logger.debug(`SignalWire transport initialized with audio format: ${this.#audioFormat}`);

    // Log configuration details for debugging
    if (this.#audioFormat === 'pcm16') {
      this.#logger.debug('🔊 Using PCM16 (L16@24000h) - High quality 24kHz audio');
    } else {
      this.#logger.debug('🔊 Using G.711 μ-law - Standard telephony 8kHz audio');
    }
  }

  override _setInputAndOutputAudioFormat(
    partialConfig?: Partial<RealtimeSessionConfig>,
  ) {
    let newConfig: Partial<RealtimeSessionConfig> = {};
    if (!partialConfig) {
      // Use the audio format specified in constructor
      // @ts-expect-error - this is a valid config
      newConfig.inputAudioFormat = this.#audioFormat;
      // @ts-expect-error - this is a valid config
      newConfig.outputAudioFormat = this.#audioFormat;
    } else {
      newConfig = {
        ...partialConfig,
        // @ts-expect-error - this is a valid config
        inputAudioFormat: partialConfig.inputAudioFormat ?? this.#audioFormat,
        // @ts-expect-error - this is a valid config
        outputAudioFormat: partialConfig.outputAudioFormat ?? this.#audioFormat,
      };
    }
    return newConfig;
  }
}
