# Google Gemini AI Integration

## Overview
NutriSearch now uses **Google Gemini** API instead of OpenAI for AI-powered nutrition analysis, meal planning, and recommendations.

## Why Gemini?
- **Free tier available** - Up to 60 requests per minute
- **High-quality responses** - Competitive with GPT-4
- **Multimodal capabilities** - Can handle text and images
- **Better pricing** - Lower costs than OpenAI for production use
- **Easy setup** - No complex authentication

## Getting Started

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key" or "Get API Key"
3. Select your Google Cloud project (or create new one)
4. Copy the API key

### 2. Configure Environment

Create or update your `.env` file:

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_api_key_here
AI_MODEL=gemini-1.5-flash

# Optional: Use different models
# AI_MODEL=gemini-1.5-pro
# AI_MODEL=gemini-2.0-flash
```

### 3. Install Dependencies

No new packages needed! The integration uses existing `axios` dependency.

### 4. Test Integration

```bash
cd backend
node test-gemini-ai.js
```

Expected output:
```
🧪 Testing Gemini AI Integration

📝 Test 1: Check Gemini API availability
   Status: ✅ Available

📝 Test 2: Nutrition Analysis
   ✅ Analysis received:
      Assessment: ...

...
```

## API Features

### Nutrition Analysis
```javascript
const analysis = await aiService.analyzeNutritionProfile(userProfile, foods);
```
Returns: assessment, nutrients_focus, recommendations, risks, tips

### Meal Plan Generation
```javascript
const mealPlan = await aiService.generateMealPlan(userProfile, preferences);
```
Returns: 7-day meal plan with meals and calories

### Recommendations
```javascript
const recommendations = await aiService.getRecommendations(foodList, healthGoals);
```
Returns: prioritize, limit, combinations, gaps, strategy

### Chat Assistant
```javascript
const chat = await aiService.chatWithNutritionist(message, conversationHistory);
```
Returns: nutrition advice from AI assistant

## Model Selection

### `gemini-1.5-flash` (Recommended)
- **Speed**: ⚡⚡⚡ Fastest
- **Cost**: $ Lowest
- **Quality**: ⭐⭐⭐⭐ Excellent
- **Use case**: Most requests, real-time chat
- **Best for**: Production

### `gemini-1.5-pro`
- **Speed**: ⚡⚡ Moderate
- **Cost**: $$ Higher
- **Quality**: ⭐⭐⭐⭐⭐ Excellent
- **Use case**: Complex analysis
- **Best for**: Premium analysis

### `gemini-2.0-flash`
- **Speed**: ⚡⚡⚡ Fastest
- **Cost**: $ Lower
- **Quality**: ⭐⭐⭐⭐⭐ Best
- **Use case**: Latest capabilities
- **Best for**: Future-proofing

## Frontend Integration

The frontend doesn't need changes! It communicates through the same API endpoints:

- `POST /api/nutrition/analysis` - Get nutrition analysis
- `POST /api/nutrition/meal-plan` - Generate meal plan
- `POST /api/nutrition/recommendations` - Get recommendations
- `POST /api/chat/nutritionist` - Chat with AI

## Rate Limits

Google Gemini API free tier:
- **60 requests per minute**
- **1,000 requests per day** (approximate)
- No credit card required

For higher limits, upgrade to paid plan in Google AI Studio.

## Error Handling

The service gracefully falls back to basic responses if:
1. API key is not configured
2. API request fails
3. Response format is invalid

Check server logs for detailed error messages.

## Troubleshooting

### "Gemini API key not configured"
- Add `GEMINI_API_KEY` to `.env`
- Restart the server: `npm run dev`

### "Invalid Gemini response format"
- Check that API key is valid at https://aistudio.google.com/app/apikey
- Ensure you're not hitting rate limits
- Try with `gemini-1.5-flash` model

### Slow Responses
- Use `gemini-1.5-flash` instead of `-pro`
- Reduce `maxOutputTokens` if needed
- Check network connection

### Low Quality Responses
- Try `gemini-1.5-pro` model
- Increase temperature to 0.8-0.9 for creativity
- Provide more context in prompts

## Implementation Details

### Request Format
```javascript
{
    contents: [{
        parts: [{
            text: "Your prompt here"
        }]
    }],
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000
    }
}
```

### Response Format
```javascript
{
    candidates: [{
        content: {
            parts: [{
                text: "Response text"
            }]
        }
    }]
}
```

## Migration from OpenAI

If you previously used OpenAI:

1. Remove `OPENAI_API_KEY` from `.env`
2. Add `GEMINI_API_KEY` to `.env`
3. Set `AI_MODEL=gemini-1.5-flash`
4. Restart server - no code changes needed!

All frontend functionality remains identical.

## Cost Comparison

### Monthly Usage: 100,000 requests

**Google Gemini (Flash)**
- Free tier: 0-60 req/min (included)
- Paid tier: $0.075 per 1M tokens
- Estimated: $0-2/month

**OpenAI (GPT-3.5)**
- No free tier
- $0.5 per 1M tokens
- Estimated: $50+/month

## Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Get API Key](https://aistudio.google.com/app/apikey)
- [Gemini API Docs](https://ai.google.dev/api/rest)
- [Model Information](https://ai.google.dev/models)
- [Pricing](https://ai.google.dev/pricing)

## Support

For issues:
1. Check `.env` configuration
2. Run `test-gemini-ai.js`
3. Review server logs
4. Test at https://aistudio.google.com/ directly
