const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Normalize sanction PDF links to include full API_BASE URL
function normalizeSanctionLinks(text) {
  if (!text) return text;
  return String(text).replace(
    /\/sanctions\/sanction_[\w-]+\.pdf/g,
    (match) => `${API_BASE}${match}`
  );
}

// Regex to detect URLs
const urlRegex = /(https?:\/\/[^\s]+)/g;

function renderWithLinks(text) {
  if (!text) return null;

  return String(text)
    .split(urlRegex)
    .map((part, index) => {
      if (urlRegex.test(part)) {
        const cleanUrl = part.replace(/\.+$/, "");

        return (
          <a
            key={index}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-words text-blue-600 hover:text-blue-800"
          >
            {cleanUrl}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
}

// MessageBubble component
export default function MessageBubble({ message }) {
  const isUser = message.sender === "user";

  const normalizedText = normalizeSanctionLinks(message.text);

  return (
    <div className={`flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">
          {renderWithLinks(normalizedText)}
        </p>

        <div className="text-[10px] opacity-60 mt-1 text-right">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
