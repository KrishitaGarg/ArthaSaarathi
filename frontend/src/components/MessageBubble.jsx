export default function MessageBubble({ message }) {
  const isUser = message.sender === "user";
  const isUpload = message.meta?.type === "upload";

  const baseClasses = isUser
    ? "bg-[#1E40AF] text-white"
    : "bg-gray-100 text-gray-900 border border-[#1E3A8A]";

  const uploadClasses =
    "bg-[#1E40AF] text-white";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
          isUpload ? uploadClasses : baseClasses
        }`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
}
