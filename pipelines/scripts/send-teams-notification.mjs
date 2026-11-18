const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
const message = process.env.NOTIFICATION_MESSAGE;

if (!webhookUrl || !message) {
  console.error("TEAMS_WEBHOOK_URL and NOTIFICATION_MESSAGE must be set");
  process.exit(1);
}

const payload = {
  type: "message",
  attachments: [
    {
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.4",
        body: [{ type: "TextBlock", text: message, wrap: true }],
      },
    },
  ],
};

const response = await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const body = await response.text();
console.log(
  `Teams webhook responded: ${response.status} ${response.statusText}`,
);
if (body) console.log(body);

if (!response.ok) {
  process.exit(1);
}
