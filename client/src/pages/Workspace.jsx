import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { API_URL, api, getToken } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Alert, Button, Card } from '../components/ui.jsx';

const STARTERS = {
  python: 'nums = [1, 2, 3]\nprint(sum(nums))\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << 6 << endl;\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(6);\n    }\n}\n',
};

const MONACO_LANGUAGE = { python: 'python', cpp: 'cpp', java: 'java' };

function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [online, setOnline] = useState(0);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api('/chat/general').then(setMessages).catch(() => {});

    const socket = io(API_URL, { auth: { token: getToken() } });
    socketRef.current = socket;
    socket.on('message', (m) => setMessages((prev) => [...prev, m]));
    socket.on('presence', setOnline);
    socket.on('connect_error', (e) => setError(e.message));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    socketRef.current?.emit('message', text);
    setDraft('');
  };

  return (
    <Card className="flex h-[32rem] flex-col p-0">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <p className="text-sm font-medium">Live chat</p>
        <span className="text-xs text-slate-500">{online} online</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <div key={m._id} className={m.author === user._id ? 'text-right' : ''}>
            <p className="text-xs text-slate-500">{m.authorName}</p>
            <p
              className={`mt-0.5 inline-block max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                m.author === user._id ? 'bg-indigo-500/25' : 'bg-slate-800'
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        {!messages.length && (
          <p className="pt-12 text-center text-sm text-slate-600">
            No messages yet. Start the discussion.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <Alert>{error}</Alert>
        </div>
      )}

      <form onSubmit={send} className="flex gap-2 border-t border-slate-800 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <Button type="submit">Send</Button>
      </form>
    </Card>
  );
}

function Ide() {
  const [language, setLanguage] = useState('python');
  const [source, setSource] = useState(STARTERS.python);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const pickLanguage = (next) => {
    setLanguage(next);
    setSource(STARTERS[next]);
    setResult(null);
  };

  const run = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      setResult(await api('/execute', { method: 'POST', body: { language, source, stdin } }));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="flex h-[32rem] flex-col p-0">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2">
        {Object.keys(STARTERS).map((lang) => (
          <button
            key={lang}
            onClick={() => pickLanguage(lang)}
            className={`rounded-lg px-3 py-1.5 text-xs capitalize ${
              language === lang ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {lang === 'cpp' ? 'C++' : lang}
          </button>
        ))}
        <Button onClick={run} disabled={running} className="ml-auto">
          {running ? 'Running...' : '▶ Run'}
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={MONACO_LANGUAGE[language]}
          value={source}
          onChange={(value) => setSource(value ?? '')}
          options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
        />
      </div>

      <div className="border-t border-slate-800 p-3">
        <input
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="stdin (optional)"
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
        />
        <Alert>{error}</Alert>
        {result && (
          <div className="max-h-32 overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-xs">
            <p className="mb-1 text-slate-500">{result.status}</p>
            {result.stdout && <pre className="whitespace-pre-wrap text-emerald-300">{result.stdout}</pre>}
            {result.stderr && <pre className="whitespace-pre-wrap text-rose-300">{result.stderr}</pre>}
            {result.compileOutput && (
              <pre className="whitespace-pre-wrap text-amber-300">{result.compileOutput}</pre>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Workspace() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chat &amp; Code IDE</h1>
        <p className="text-sm text-slate-400">
          Discuss a problem, then test the idea without leaving the app.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Chat />
        <Ide />
      </div>
    </div>
  );
}
