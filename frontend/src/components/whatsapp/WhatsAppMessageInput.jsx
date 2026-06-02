import { useState, useRef } from 'react';
import { Smile, Paperclip, Send, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const ATTACH_OPTIONS = [
  { type: 'image', label: 'Photo', icon: ImageIcon },
  { type: 'pdf', label: 'PDF', icon: FileText },
  { type: 'document', label: 'Document', icon: FileText },
];

export default function WhatsAppMessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const inputRef = useRef(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend({ text: trimmed, type: 'text' });
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttach = (type) => {
    setShowAttach(false);
    onSend({
      text: type === 'pdf' ? 'Shared document' : type === 'image' ? 'Shared photo' : 'Shared file',
      type,
      attachment: {
        name: type === 'pdf' ? 'Itinerary.pdf' : type === 'image' ? 'photo.jpg' : 'document.docx',
        size: '1.2 MB',
        url: type === 'image' ? 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop' : '#',
      },
    });
  };

  return (
    <div className="shrink-0 px-3 py-2.5 bg-wa-header/90 backdrop-blur-md border-t border-wa-border">
      {showAttach && (
        <div className="flex gap-3 mb-3 px-1">
          {ATTACH_OPTIONS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAttach(type)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-full bg-wa-input border border-wa-border flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                <Icon className="w-5 h-5 text-wa-text-secondary group-hover:text-emerald-500" />
              </div>
              <span className="text-[10px] text-wa-text-muted">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-wa-list-hover text-wa-text-muted shrink-0"
          aria-label="Emoji"
        >
          <Smile className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => setShowAttach((s) => !s)}
          className={cn('p-2 rounded-lg hover:bg-wa-list-hover shrink-0 transition-colors', showAttach ? 'text-emerald-500' : 'text-wa-text-muted')}
          aria-label="Attach"
        >
          {showAttach ? <X className="w-6 h-6" /> : <Paperclip className="w-6 h-6" />}
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message"
            rows={1}
            className="w-full resize-none rounded-xl px-4 py-2.5 bg-wa-input border border-wa-border text-sm text-wa-text-primary placeholder:text-wa-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 max-h-32"
            style={{ minHeight: '42px' }}
          />
        </div>

        <Button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          size="icon"
          className="shrink-0 rounded-full w-11 h-11 bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/25 disabled:opacity-40"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
