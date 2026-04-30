/**
 * react-markdown component overrides used by the chatbot's assistant bubble.
 *
 * Extracted from `components/ChatbotWidget.js` so the same map is shared
 * across mobile/desktop variants and can be tweaked without re-rendering
 * the whole widget tree.
 */
export const markdownComponents = {
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-xs font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="block bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto"
        {...props}
      >
        {children}
      </code>
    );
  },
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-300 pl-3 italic text-gray-700 my-2">
      {children}
    </blockquote>
  ),
};
