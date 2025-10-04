import { CheckCheck } from "lucide-react";

export default function MessageBubble({ from, text, time, isPrivateMention }) {
  const isMe = from === "me";

  // Parse and highlight mentions in the text
  const renderTextWithMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add the mention with highlighting
      parts.push(
        <span
          key={match.index}
          className={`font-semibold ${
            isMe
              ? "text-indigo-200 bg-indigo-700/30"
              : "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30"
          } px-1 rounded`}
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[75%]">
        {isPrivateMention && !isMe && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            Private mention
          </div>
        )}
        <div
          className={`rounded-2xl px-3 py-2 shadow-sm transition ${
            isMe
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
          } ${isPrivateMention ? "border-2 border-amber-400/50" : ""}`}
        >
          <p className="text-pretty">{renderTextWithMentions(text)}</p>
        </div>
        <div
          className={`mt-1 flex items-center gap-1 text-[11px] ${
            isMe ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span>{time}</span>
          {isMe && <CheckCheck size={14} className="opacity-80" />}
        </div>
      </div>
    </div>
  );
}
