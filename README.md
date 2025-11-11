# AI Feature Explainer

A Next.js application that uses OpenAI's GPT-4o-mini to explain code snippets in understandable language. The application supports both regular explanations and "Explain Like I'm 5" (ELI5) mode for simplified explanations.

## Features

- **Code Analysis**: Automatically detects programming languages and explains code functionality
- **ELI5 Mode**: Simplified explanations using everyday language and analogies
- **Real-time Streaming**: Live streaming of AI responses for better user experience
- **Security Features**: Input validation, rate limiting, and content sanitization
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Dutch Interface**: User interface in Dutch with multilingual code support

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/ai-feature-explainer.git
cd ai-feature-explainer
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create environment file:

```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:

```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Paste your code** into the textarea (max 10,000 characters)
2. **Choose explanation mode**:
   - Regular: Technical explanation for developers
   - ELI5: Simplified explanation with everyday analogies
3. **Click "✨ Explain"** to generate the explanation
4. **View the streaming response** in real-time

## Architecture

### Project Structure

```
├── app/
│   ├── api/explain/            # API endpoint for OpenAI integration
│   ├── constants/              # Application constants and limits
│   ├── models/                 # TypeScript interfaces
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout component
│   └── page.tsx                # Main application page
├── hooks/
│   └── useStreamingExplain.ts  # Custom hook for streaming API calls
└── public/                     # Static assets
```

### Key Components

- **[app/page.tsx](app/page.tsx)**: Main UI component with code input and explanation display
- **[hooks/useStreamingExplain.ts](hooks/useStreamingExplain.ts)**: Handles streaming API communication
- **[app/api/explain/route.ts](app/api/explain/route.ts)**: API endpoint for OpenAI integration
- **[app/constants/app.constants.ts](app/constants/app.constants.ts)**: Security limits and configuration

## Security Features

- **Input Validation**: Code length limits (10KB) and content validation
- **Rate Limiting**: 10 requests per minute per IP
- **Request Size Limits**: 50KB maximum request size
- **Response Limits**: 1MB maximum response size with 30s timeout
- **Content Sanitization**: Removal of potentially dangerous HTML/JavaScript
- **Security Headers**: CSP, XSS protection, and frame options
- **API Key Protection**: Secure environment variable handling

## API Endpoints

### POST /api/explain

Explains code using OpenAI's GPT-4o-mini model.

**Request Body:**

```typescript
{
  code: string; // Code to explain (max 10,000 chars)
  explainToChild: boolean; // Enable ELI5 mode
}
```

**Response:** Server-sent events stream with explanation chunks

## Configuration

Key configuration constants in [app/constants/app.constants.ts](app/constants/app.constants.ts):

```typescript
export const MAX_CODE_LENGTH = 10000; // 10KB code limit
export const MAX_REQUEST_SIZE = 50000; // 50KB request limit
export const MAX_RESPONSE_SIZE = 1_000_000; // 1MB response limit
export const STREAM_TIMEOUT = 30000; // 30s timeout
export const RATE_LIMIT_WINDOW = 60000; // 1 minute window
export const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per window
```

## Technologies Used

- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **react-markdown** - Markdown rendering
- **OpenAI API** - GPT-4o-mini model for code explanation

## Environment Variables

Create a `.env.local` file with:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your `OPENAI_API_KEY` environment variable in Vercel dashboard
4. Deploy automatically

### Other Platforms

Ensure your deployment platform supports:

- Node.js 18+
- Environment variables
- Server-side API routes

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/ai-feature-explainer/issues) page
2. Create a new issue with detailed information
3. Include code samples and error messages

## Acknowledgments

- [OpenAI](https://openai.com) for the GPT-4o-mini API
- [Next.js](https://nextjs.org) team for the excellent framework
- [Vercel](https://vercel.com) for hosting and deployment platform
