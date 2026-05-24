/**
 * ai.service.js
 *
 * Abstracts calls to OpenAI, Gemini, and DeepSeek.
 *
 * generateText(prompt, provider) → Promise<string>
 * generateImage(prompt)          → Promise<string>  (DALL·E 3 URL)
 */

const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('../config/logger');

/* ------------------------------------------------------------------ */
/* generateText                                                        */
/* ------------------------------------------------------------------ */

async function generateText(prompt, provider) {
  const resolvedProvider = provider || config.ai.defaultProvider || 'openai';

  try {
    switch (resolvedProvider) {
      case 'openai': {
        if (!config.ai.openaiApiKey) {
          throw new Error('OPENAI_API_KEY is not configured. Cannot use OpenAI provider.');
        }
        const client = new OpenAI({ apiKey: config.ai.openaiApiKey });
        const completion = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }]
        });
        return completion.choices[0].message.content;
      }

      case 'gemini': {
        if (!config.ai.geminiApiKey) {
          throw new Error('GEMINI_API_KEY is not configured. Cannot use Gemini provider.');
        }
        const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }

      case 'deepseek': {
        if (!config.ai.deepseekApiKey) {
          throw new Error('DEEPSEEK_API_KEY is not configured. Cannot use DeepSeek provider.');
        }
        const client = new OpenAI({
          apiKey: config.ai.deepseekApiKey,
          baseURL: 'https://api.deepseek.com'
        });
        const completion = await client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }]
        });
        return completion.choices[0].message.content;
      }

      default:
        throw new Error(`Unknown AI provider: "${resolvedProvider}". Valid providers: openai, gemini, deepseek.`);
    }
  } catch (err) {
    logger.error(`[aiService] generateText error (provider=${resolvedProvider}): ${err.message}`);
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* generateImage  (always OpenAI DALL·E 3)                            */
/* ------------------------------------------------------------------ */

async function generateImage(prompt) {
  if (!config.ai.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Cannot generate images.');
  }

  try {
    const client = new OpenAI({ apiKey: config.ai.openaiApiKey });
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024'
    });
    return response.data[0].url;
  } catch (err) {
    logger.error(`[aiService] generateImage error: ${err.message}`);
    throw err;
  }
}

module.exports = { generateText, generateImage };
