import OpenAI from 'openai';
import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });

// Set up OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test route
fastify.get('/', async (request, reply) => {
  return { message: 'Hello, Fastify with OpenAI!' };
});

// Route for OpenAI interaction
fastify.post('/chat', async (request, reply) => {
  const { message } = request.body;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
    });

    return reply.send({
      assistant_reply: response.choices[0].message.content,
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to communicate with OpenAI API.' });
  }
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();