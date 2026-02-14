 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/api/send-telegram.js b/api/send-telegram.js
new file mode 100644
index 0000000000000000000000000000000000000000..4e4d73525a2b8e3e07c4f08f574497e9e78a19fc
--- /dev/null
+++ b/api/send-telegram.js
@@ -0,0 +1,62 @@
+export default async function handler(req, res) {
+  if (req.method !== 'POST') {
+    return res.status(405).json({ error: 'Method not allowed' });
+  }
+
+  const token = process.env.TELEGRAM_BOT_TOKEN;
+  const chatId = process.env.TELEGRAM_CHAT_ID;
+
+  if (!token || !chatId) {
+    return res.status(500).json({ error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variable.' });
+  }
+
+  try {
+    const {
+      submittedAt,
+      currentPart,
+      totalQuestions,
+      totalKeyed,
+      correctCount,
+      bandScore,
+      answers = {}
+    } = req.body || {};
+
+    const sortedAnswers = Object.entries(answers)
+      .sort((a, b) => Number(a[0]) - Number(b[0]))
+      .map(([question, answer]) => `Q${question}: ${answer}`)
+      .join('\n');
+
+    const header = [
+      '📝 *New IELTS Listening Submission*',
+      `🕒 Time: ${submittedAt || new Date().toISOString()}`,
+      `📚 Part: ${currentPart ?? '-'}`,
+      `✅ Correct: ${correctCount ?? 0}/${totalQuestions ?? totalKeyed ?? '-'}`,
+      bandScore ? `🏅 Band: ${bandScore}` : null,
+      '',
+      '*Answers:*'
+    ].filter(Boolean).join('\n');
+
+    const text = `${header}\n${sortedAnswers || 'No answers submitted.'}`;
+
+    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
+      method: 'POST',
+      headers: { 'Content-Type': 'application/json' },
+      body: JSON.stringify({
+        chat_id: chatId,
+        text,
+        parse_mode: 'Markdown'
+      })
+    });
+
+    const telegramResult = await telegramResponse.json();
+    if (!telegramResponse.ok || !telegramResult.ok) {
+      return res.status(502).json({
+        error: telegramResult.description || 'Telegram API request failed.'
+      });
+    }
+
+    return res.status(200).json({ ok: true });
+  } catch (error) {
+    return res.status(500).json({ error: error.message || 'Unknown server error' });
+  }
+}
 
EOF
)
