# SignalWire + OpenAI Voice Assistant

**Build an AI phone assistant that actually understands and responds naturally to your callers.**

This project connects SignalWire's telephony platform with OpenAI's GPT-4 Realtime API to create voice assistants that can answer phone calls, have natural conversations, and help callers with real information—all in real-time.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [1. Setup SignalWire](#1-setup-signalwire)
  - [2. Clone & Configure](#2-clone--configure)
  - [3. Test with ngrok](#3-test-with-ngrok)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Production Deployment](#production-deployment)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Introduction

This application creates a **bidirectional audio streaming bridge** between phone calls and OpenAI's Realtime API. The result is an AI assistant that can:

- Have natural, flowing conversations with **zero buffering delays**
- Answer questions and provide information in real-time
- Check the weather for any US city
- Tell the current time
- Handle interruptions naturally (no more talking over each other!)

All with crystal-clear HD voice quality and true real-time bidirectional communication.

<details>
<summary><b>🔍 Technical Overview</b></summary>

### How the System Works

1. **Incoming Call** → SignalWire receives the call and streams audio via WebSocket to our server
2. **Audio Processing** → Our TypeScript server forwards the audio stream to OpenAI's Realtime API using the official SDK
3. **Function Call Processing** → When AI needs information (weather, time, etc.), function calls are processed locally on our server
4. **AI Response** → OpenAI processes speech and function results in real-time, generating audio responses
5. **Audio Feedback** → AI responses stream back through our WebSocket server to SignalWire
6. **Caller Hears AI** → SignalWire feeds the AI audio directly back into the call

### Built With

- **[@openai/agents](https://www.npmjs.com/package/@openai/agents)** - OpenAI's official SDK for GPT-4 Realtime API
- **[@openai/agents-realtime](https://www.npmjs.com/package/@openai/agents-realtime)** - Real-time audio streaming with OpenAI
- **[Fastify](https://fastify.dev/)** - High-performance web framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

</details>

## Prerequisites

You'll need:

1. **Node.js 20+** - [Download here](https://nodejs.org/)
2. **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys) (requires paid account)
3. **SignalWire Account** - [Sign up free](https://signalwire.com) (for phone integration)
4. **ngrok** (for local development) - [Install ngrok](https://ngrok.com/download) to expose your local server
5. **Docker** (optional) - [Install Docker](https://docs.docker.com/get-docker/) for containerized deployment

## Quick Start

Follow these three high-level steps to get your AI voice assistant running:

### 1. Setup SignalWire

<details open>
<summary><b>📞 Configure SignalWire for Voice Streaming</b></summary>

#### Create Your SignalWire Project

Follow the [SignalWire Getting Started Guide](https://developer.signalwire.com/guides/getting-started) to:
- Create your SignalWire project
- Set up your workspace

[Sign up for free at SignalWire](https://signalwire.com)

#### Create a cXML Webhook Resource

Before you can assign webhook URLs, you need to create a cXML webhook resource:

1. In your SignalWire dashboard, go to **My Resources**
2. Click **Create Resource**
3. Select **Script** as the resource type, then select `cXML`
4. Set the resource to `Handle Using` as `External Url`
5. Set the `Primary Script URL` to your server's **webhook endpoint** (you'll configure this in step 3):
   ```
   https://your-ngrok-url.ngrok.io/incoming-call
   ```
   > **🚨 Critical:** You MUST include `/incoming-call` at the end of your URL
6. Give it a descriptive name (e.g., "AI Voice Assistant")
7. Create the resource

> **📖 Learn More:** [SignalWire Call Fabric Resources Guide](https://developer.signalwire.com/platform/call-fabric/resources)

#### Create a SIP Address

To test your AI assistant, create a SIP address that connects to your cXML resource:

1. From the resource page of the resource you just created, click the `Addresses & Phone Numbers` tab
2. Click **Add** to create a new address
3. Select **SIP Address** as the address type
4. Fill out the address information
5. Save the configuration

> **📖 Learn More:** [SignalWire Call Fabric Addresses Guide](https://developer.signalwire.com/platform/call-fabric/addresses)

> **💡 Tip:** You can also purchase a regular [phone number](https://developer.signalwire.com/platform/dashboard/get-started/phone-numbers) and link it to your cXML resource if you prefer traditional phone number calling.

</details>

### 2. Clone & Configure

<details open>
<summary><b>⚙️ Install and Set Up Your Code</b></summary>

#### Clone and Install

```bash
git clone <repository-url>
cd cXML-realtime-agent-stream
npm install
```

#### Add Your API Key

Choose **ONE** method based on how you'll run the app:

**🔵 Option A: Local Development** (using .env file)
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-actual-api-key-here
```

**🐳 Option B: Docker Deployment** (using secrets folder)
```bash
mkdir -p secrets
echo "sk-your-actual-api-key-here" > secrets/openai_api_key.txt
```

> **Note:** Never use both methods at the same time. Docker automatically uses the secrets folder, while local development uses .env.

> **🔑 Get Your API Key:** [OpenAI Platform](https://platform.openai.com/api-keys) (requires paid account)

</details>

### 3. Test with ngrok

<details open>
<summary><b>🌐 Expose Your Local Server & Test</b></summary>

#### Start Your Server

**For Local Development:**
```bash
npm run build
npm start
```

**For Docker:**
```bash
docker-compose up --build signalwire-assistant
```

✅ **Your AI assistant is now running at `http://localhost:5050/incoming-call`**

#### Expose with ngrok

In a **new terminal**, run:
```bash
npx ngrok http 5050
```

You'll get a public URL like: `https://abc123.ngrok.io`

#### Update SignalWire Webhook

1. Go back to your SignalWire cXML resource (from Step 1)
2. Update the `Primary Script URL` to:
   ```
   https://abc123.ngrok.io/incoming-call
   ```
3. Save the configuration

> **⚠️ Important:** ngrok URLs change each time you restart it. Update your SignalWire webhook URL whenever you restart ngrok.

#### Test Your Assistant

**Call the SIP address you created in Step 1:**

- Using a SIP Phone or Softphone, dial: `sip:your-sip-address@yourproject.dapp.signalwire.com`
- Replace with the actual SIP address you created

**The call flow will be:**
```
Your SIP call → SignalWire → ngrok → Your local server → OpenAI → Response → Caller
```

> **📱 Alternative:** If you purchased a regular phone number and linked it to your cXML resource, you can call that number directly.

</details>

---

## How It Works

```
Phone Call → SignalWire → Your Server → OpenAI → Real-time Response → Caller
```

1. Someone calls your SignalWire number
2. SignalWire streams the audio to your server via WebSocket
3. Your server forwards it to OpenAI's Realtime API
4. OpenAI processes speech and generates responses instantly
5. Responses stream back to the caller in real-time

The magic is in the real-time streaming—there's no "recording, processing, playing back." It's a continuous, natural conversation.

## Configuration

<details>
<summary><b>Environment Variables</b></summary>

Configure your assistant using the following variables. Each variable is handled differently depending on your deployment method:

| Variable | Local Development | Docker Deployment | Type | Required |
|----------|-------------------|-------------------|------|----------|
| `OPENAI_API_KEY` | `.env` file | Docker secrets file (`secrets/openai_api_key.txt`) | Secret | Yes |
| `PORT` | `.env` file | docker-compose environment section | Environment Variable | No |
| `AUDIO_FORMAT` | `.env` file | docker-compose environment section | Environment Variable | No |

### Setting Up Variables

**For Local Development:**
Create a `.env` file in your project root:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=5050  # optional, defaults to 5050
AUDIO_FORMAT=pcm16  # optional
```

**For Docker Deployment:**
- `OPENAI_API_KEY`: Create `secrets/openai_api_key.txt` with your API key
- `PORT`: Already configured in `docker-compose.yml` (can be modified there)
- `AUDIO_FORMAT`: Already configured in `docker-compose.yml` (can be modified there)

### Audio Format Options

- `pcm16` - **High Definition Audio (24kHz)** - Crystal clear voice quality, best for demos
- `g711_ulaw` - **Standard Telephony (8kHz)** - Traditional phone quality (default)

> **🔐 Security Note:** Docker uses secrets for sensitive data like API keys, while regular environment variables are used for configuration options.

</details>

<details>
<summary><b>Customize Your Assistant</b></summary>

Edit `src/config.ts` to change your AI's personality:

```typescript
export const AGENT_CONFIG = {
  voice: 'alloy',  // Choose: alloy, echo, fable, onyx, nova, shimmer
  instructions: `Your custom personality here...`
}
```

</details>

<details>
<summary><b>Add New Capabilities</b></summary>

Create new tools in `src/tools/` - see `weather.tool.ts` for an example.

</details>

## Production Deployment

For production deployment, we recommend using Docker. See the [Docker Setup Guide](README.Docker.md) for:
- External secrets management
- Health checks and monitoring
- Docker Swarm configuration
- Troubleshooting tips

## Development

```bash
# Development with hot reload
npm run dev

# Type checking
npm run typecheck

# View debug logs
DEBUG=openai-agents:* npm run dev
```

## Troubleshooting

<details>
<summary><b>Common Issues & Solutions</b></summary>

**"Missing OPENAI_API_KEY"**
- Make sure your `.env` file exists and contains your actual API key

**"SignalWire client connection error"**
- Ensure your webhook URL is publicly accessible (use ngrok for local testing)
- Check that port 5050 is not blocked

**Audio quality issues**
- HD voice requires `L16@24000h` codec in SignalWire webhook
- Standard quality: Remove the codec parameter

**Can't receive calls**
- Verify SignalWire webhook is set to your public URL **with `/incoming-call`** endpoint
- Check ngrok is still running and URL hasn't changed
- Common mistake: Using base URL without `/incoming-call` (calls won't work!)
- Look at console logs for connection messages

</details>

## Project Structure

```
src/
├── config.ts          # AI assistant configuration
├── index.ts           # Server setup
├── routes/            # HTTP endpoints
│   ├── webhook.ts     # Handles incoming calls
│   ├── streaming.ts   # WebSocket audio streaming
│   └── health.ts      # Health check endpoint
├── tools/             # AI capabilities (weather, time, etc.)
└── transports/        # SignalWire ↔ OpenAI bridge
```

---

Built with TypeScript, Fastify, and WebSockets. MIT Licensed.
