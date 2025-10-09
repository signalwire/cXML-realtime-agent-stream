/**
 * Real-time Audio Streaming Route
 *
 * This WebSocket endpoint uses SignalWireRealtimeTransportLayer to bridge
 * SignalWire WebSocket connections with OpenAI's Realtime API.
 */

import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import {
  RealtimeAgent,
  RealtimeSession,
  type OpenAIRealtimeModels,
  type RealtimeClientMessage,
  type TransportEvent
} from '@openai/agents/realtime';
import { SignalWireRealtimeTransportLayer } from '../transports/SignalWireRealtimeTransportLayer.js';
import { logger } from '../utils/logger.js';
import { CONNECTION_MESSAGES, ERROR_MESSAGES, EVENT_TYPES } from '../constants.js';
import type { StreamingOptions } from '../types/index.js';
import { AGENT_CONFIG } from '../config.js';


export async function streamingRoute(
  fastify: FastifyInstance,
  options: StreamingOptions
) {
  const { agentConfig, openaiApiKey, model } = options;
  const realtimeAgent = new RealtimeAgent(agentConfig);

  fastify.get('/media-stream', { websocket: true }, async (connection: WebSocket) => {
    logger.info(CONNECTION_MESSAGES.CLIENT_CONNECTED);

    // Handle client disconnection
    connection.on('close', () => {
      logger.info(CONNECTION_MESSAGES.CLIENT_DISCONNECTED);
    });

    // Handle connection errors
    connection.on('error', (error) => {
      logger.error(`${ERROR_MESSAGES.CONNECTION_ERROR}:`, error.message);
    });

    try {
      // Create SignalWire transport layer with configured audio format
      const signalWireTransportLayer = new SignalWireRealtimeTransportLayer({
        signalWireWebSocket: connection,
        audioFormat: AGENT_CONFIG.audioFormat
      });

      // Create session with SignalWire transport
      // Audio format is now handled by the transport layer
      const session = new RealtimeSession(realtimeAgent, {
        transport: signalWireTransportLayer,
        model: model as OpenAIRealtimeModels
      });

      // Listen to raw transport events for debugging and basic events
      session.transport.on('*', (event: TransportEvent) => {
        switch (event.type) {
          case EVENT_TYPES.RESPONSE_DONE:
            logger.event('🤖', 'AI response completed', event);
            break;

          case EVENT_TYPES.TRANSCRIPTION_COMPLETED:
            logger.event('🎤', 'User transcription completed', event);
            break;

          default:
            // Log other raw transport events in debug mode
            logger.debug('Raw transport event:', event);
        }
      });

      // Listen to session events for tool call lifecycle
      session.on('agent_tool_start', (context, agent, tool, details) => {
        logger.event('🔧', 'Tool call started', details);
      });

      session.on('agent_tool_end', (context, agent, tool, result, details) => {
        logger.event('✅', 'Tool call completed', details);
      });

      // Handle errors gracefully
      session.on('error', (error: { type: 'error'; error: unknown }) => {
        logger.error(ERROR_MESSAGES.SESSION_ERROR, error);
      });

      // Connect to OpenAI Realtime API via the transport layer
      await session.connect({
        apiKey: openaiApiKey
      });

      // Trigger immediate AI response
      try {
        // Direct response trigger - let agent instructions handle the greeting content
        const responseEvent: RealtimeClientMessage = { type: 'response.create' } as RealtimeClientMessage;
        signalWireTransportLayer.sendEvent(responseEvent);
      } catch (error) {
        // AI-first response trigger failed, but session continues
      }

    } catch (error) {
      logger.error(ERROR_MESSAGES.TRANSPORT_INIT_FAILED, error);
    }
  });
}