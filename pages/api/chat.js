import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

    // 1. Fetch inventory with prices (added price to select)
    const { data: inventory } = await supabase
      .from('books')
      .select('title, age_range, image_src, price')
      .order('title', { ascending: true });

    // 2. Price detection (new addition)
    const isPriceQuery = lastUserMessage.includes('price') || 
                        lastUserMessage.includes('cost') ||
                        lastUserMessage.includes('how much');

    // 3. Find relevant books (added price to select)
    const { data: books } = await supabase
      .from('books')
      .select('title, description, age_range, themes, image_src, price')
      .or(`title.ilike.%${lastUserMessage}%,description.ilike.%${lastUserMessage}%,themes.cs.{${lastUserMessage}}`)
      .limit(3);

    // 4. Enhanced system prompt with price context (added price info)
    const systemPrompt = `
      You're StoryBot, the friendly guide to "Journey of 18 Miles" children's books. 
      Personality:
      - Warm and book-loving
      - Naturally curious about reading preferences
      - Gently guides conversations to stories
      - Uses varied, creative phrasing
      
      Cultural Context:
      - All stories are originally African, told by African authors
      - Available in two formats:
        1. English/French with ethnic language phrases (e.g., "Jambo!" in Swahili stories)
        2. Complete African language versions (Shona, Setswana, Yoruba, Swahili, etc.)
      - Designed for diaspora parents to teach native languages

      Important Context:
      - Current book prices range from $${Math.min(...inventory.map(b => b.price))} to $${Math.max(...inventory.map(b => b.price))}
      - When mentioning books, include price if relevant (format: "Title - $X.XX")
      - For price questions, be specific and mention if books are on sale

      Rules:
      1. When discussing books:
         - Suggest 1-3 titles from: ${inventory.map(b => `${b.title} ($${b.price})`).join(', ')}
         - Highlight unique aspects (themes: ${[...new Set(inventory.flatMap(b => b.themes))].join(', ')})
         - Mention age ranges naturally ("great for 5-8 year olds")

      2. For other topics:
         - Acknowledge politely
         - Share a book-related insight
         - Transition naturally
         - NEVER repeat deflection phrases

      3. Special skills:
         - Theme-based recommendations with price context
         - Reading level matching
         - Engaging storytelling about books
    `;

    // 5. Generate natural response (unchanged)
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 200,
      frequency_penalty: 0.5
    });

    let reply = completion.choices[0].message.content;

    // 6. Enhance with book data (added price handling)
    if (books?.length > 0) {
      if (isPriceQuery) {
        // Special formatting for price queries
        reply = `${reply}\n\n${books.map(b => 
          `• ${b.title}: $${b.price} - ${b.description.substring(0, 60)}...`
        ).join('\n')}`;
      } else {
        // Normal enhancement
        reply = await enhanceWithBooks(reply, books);
      }
    }

    res.status(200).json({
      reply,
      books: books?.map(b => ({
        title: b.title,
        description: b.description,
        ageRange: b.age_range,
        themes: b.themes,
        price: b.price,  // Added price to response
        image: b.image_src
      })) || []
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      reply: "I can check prices for any storybook - could you tell me which one you're interested in?" 
    });
  }
}

// Updated helper function to include prices
async function enhanceWithBooks(reply, books) {
  const enhancement = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `Enhance this recommendation naturally. Include prices when relevant. Books: ${JSON.stringify(books.map(b => ({
          title: b.title,
          price: b.price,
          description: b.description
        })))}`
      },
      {
        role: "user",
        content: reply
      }
    ],
    temperature: 0.6,
    max_tokens: 150
  });
  return enhancement.choices[0].message.content;
}