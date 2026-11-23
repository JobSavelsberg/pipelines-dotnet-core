const {
  TEAMS_WEBHOOK_URL,
  BUILD_RESULT,
  PIPELINE,
  BUILD_NUMBER,
  BRANCH,
  REQUESTED_BY,
  REQUESTED_BY_EMAIL,
  COMMIT_MESSAGE,
  COLLECTION_URI,
  PROJECT,
  BUILD_ID,
} = process.env;

// Dynamic part: color and icon depend on the build result
const looks = {
  Succeeded: { style: "good", icon: "✅" },
  SucceededWithIssues: { style: "warning", icon: "⚠️" },
  Canceled: { style: "default", icon: "⏹️" },
}[BUILD_RESULT] ?? { style: "attention", icon: "❌" };

const buildUrl = `${COLLECTION_URI}${encodeURIComponent(PROJECT)}/_build/results?buildId=${BUILD_ID}`;

// Mention the person who ran the build, but only if we have their email
// and the build did not succeed. Remove the second condition to always mention.
const shouldMention =
  Boolean(REQUESTED_BY_EMAIL) && BUILD_RESULT !== "Succeeded";
const mentionTag = `<at>${REQUESTED_BY}</at>`;

const card = {
  type: "AdaptiveCard",
  version: "1.4",
  msteams: {
    width: "Full",
    ...(shouldMention && {
      entities: [
        {
          type: "mention",
          text: mentionTag,
          mentioned: { id: REQUESTED_BY_EMAIL, name: REQUESTED_BY },
        },
      ],
    }),
  },
  body: [
    {
      type: "Container",
      style: looks.style,
      bleed: true,
      items: [
        {
          type: "TextBlock",
          text: `${looks.icon} ${PIPELINE}`,
          size: "Large",
          weight: "Bolder",
          wrap: true,
        },
        {
          type: "TextBlock",
          text: `Build ${BUILD_RESULT}`,
          isSubtle: true,
          spacing: "None",
        },
      ],
    },
    {
      type: "FactSet",
      facts: [
        { title: "Build", value: BUILD_NUMBER },
        { title: "Branch", value: BRANCH },
        // The fact value can't hold a mention, so the mention gets its own block below
        { title: "By", value: REQUESTED_BY },
      ],
    },
    ...(shouldMention
      ? [
          {
            type: "TextBlock",
            text: `${mentionTag} your build needs attention`,
            wrap: true,
          },
        ]
      : []),
    // Collapsed until the button is clicked
    {
      type: "TextBlock",
      id: "details",
      isVisible: false,
      text: COMMIT_MESSAGE,
      wrap: true,
      isSubtle: true,
    },
  ],
  actions: [
    { type: "Action.OpenUrl", title: "View build", url: buildUrl },
    {
      type: "Action.ToggleVisibility",
      title: "Commit message",
      targetElements: ["details"],
    },
  ],
};

const res = await fetch(TEAMS_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "message",
    attachments: [
      { contentType: "application/vnd.microsoft.card.adaptive", content: card },
    ],
  }),
});

if (!res.ok)
  throw new Error(`Teams webhook failed: ${res.status} ${await res.text()}`);
console.log("Teams notification sent");
