import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";
const ClickSend = require("../../../vendor/clicksend");

const CLICKSEND_USERNAME = process.env.CLICKSEND_USERNAME;
const CLICKSEND_API_KEY = process.env.CLICKSEND_API_KEY;
const CLICKSEND_NUMBER = process.env.CLICKSEND_NUMBER;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const incomingMessage = request.body.message;

  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are an SMS spam detector who tells the user whether a message looks like spam or a safe message, try to explain why you made that decision",
      },
      {
        role: "user",
        content: incomingMessage,
      },
    ],
    max_tokens: 300,
    temperature: 0.2,
  });

  const message = new ClickSend.SmsMessage();
  message.from = CLICKSEND_NUMBER;
  message.to = request.body.from;
  message.body = completion.data.choices[0].message?.content as string;

  const smsApi = new ClickSend.SMSApi(CLICKSEND_USERNAME, CLICKSEND_API_KEY);
  const smsCollection = new ClickSend.SmsMessageCollection();

  smsCollection.messages = [message];

  await smsApi.smsSendPost(smsCollection);

  // what to reply here?
  response.send("ok");
}
