const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt for the agentic AI
const SYSTEM_PROMPT = `You are Relay, an intelligent AI agent platform. Your job is to understand user requests and help them build and interact with AI agents.

When a user describes what they want, you should:
1. Understand their intent (data analysis, document processing, automation, etc.)
2. Ask clarifying questions if needed
3. Suggest the appropriate agent type and configuration
4. Help them set up integrations if needed
5. Generate dynamic responses, reports, charts, and visualizations based on their data

You have access to various tools and integrations including:
- Data analysis (spreadsheets, databases, SQL)
- Document processing (PDFs, contracts, reports)
- Workflow automation (Salesforce, Slack, Gmail, etc.)
- Financial calculations and forecasting
- Research and monitoring
- Customer support

When generating reports or visualizations, provide the data in a structured format that can be rendered as charts, tables, or other UI components.

Always be helpful, professional, and concise.`;

// Chat completion
async function chatCompletion(messages, context = {}) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    return {
      content: completion.choices[0].message.content,
      usage: completion.usage
    };
  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw error;
  }
}

// Analyze user intent and suggest agent configuration
async function analyzeIntent(userPrompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze the user's request and determine:
1. The agent type (data_analysis, document_processing, workflow_automation, financial, research, support)
2. Required integrations (salesforce, slack, gmail, database, etc.)
3. Suggested configuration
4. Any clarifying questions needed

Return a JSON response with this structure:
{
  "agentType": "string",
  "confidence": number,
  "suggestedName": "string",
  "description": "string",
  "requiredIntegrations": ["string"],
  "configuration": {},
  "clarifyingQuestions": ["string"],
  "uiComponents": ["chart", "table", "metrics", "timeline"]
}`
        },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Intent analysis error:', error);
    throw error;
  }
}

// Generate dynamic UI components based on data
async function generateUIComponents(data, componentType) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Generate UI component specifications based on the provided data. 
Return a JSON structure that can be rendered as React components.
Available component types: chart (line, bar, pie), table, metrics, timeline, cards

Example output:
{
  "type": "dashboard",
  "components": [
    {
      "type": "metrics",
      "data": [{"label": "Revenue", "value": "$84.2K", "change": "+23%"}]
    },
    {
      "type": "chart",
      "chartType": "line",
      "title": "Weekly Revenue",
      "data": [{"x": "Mon", "y": 45}, ...]
    }
  ]
}`
        },
        { role: 'user', content: `Data: ${JSON.stringify(data)}\nComponent type: ${componentType}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('UI generation error:', error);
    throw error;
  }
}

// Generate a full report with visualizations
async function generateReport(prompt, data) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Generate a comprehensive report with insights and visualizations.
Return a JSON structure with:
- title
- summary
- key findings
- recommended actions
- uiComponents for rendering

The UI components should include appropriate charts, tables, and metrics.`
        },
        { 
          role: 'user', 
          content: `Prompt: ${prompt}\nData: ${JSON.stringify(data)}` 
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Report generation error:', error);
    throw error;
  }
}

module.exports = {
  chatCompletion,
  analyzeIntent,
  generateUIComponents,
  generateReport
};
