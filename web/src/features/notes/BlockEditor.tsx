import * as React from 'react';
import { Check, Code2, Copy, Plus, Trash2, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@core/utils';
import {
  type Block,
  type BlockType,
  createBlock,
  parseBlocks,
  serializeBlocks,
} from './markdown-blocks';

interface SlashCommand {
  type: BlockType;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    type: 'text',
    label: 'Texto',
    description: 'Parágrafo simples',
    icon: Type,
    keywords: ['texto', 'text', 'paragrafo', 'paragraph'],
  },
  {
    type: 'code',
    label: 'Código',
    description: 'Bloco monoespaçado, pronto pra copiar',
    icon: Code2,
    keywords: ['codigo', 'code', 'snippet', 'terminal', 'comando'],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function filterCommands(query: string): SlashCommand[] {
  const normalized = normalize(query.trim());
  if (!normalized) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((command) =>
    command.keywords.some((keyword) => keyword.startsWith(normalized)),
  );
}

/** Menu aberto pelo "/": em qual bloco, onde a barra caiu e o que veio depois dela. */
interface SlashState {
  blockId: string;
  start: number;
  query: string;
}

interface BlockEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

export function BlockEditor({ value, onChange, onBlur, placeholder }: BlockEditorProps) {
  const [blocks, setBlocks] = React.useState<Block[]>(() => parseBlocks(value));
  const [slash, setSlash] = React.useState<SlashState | null>(null);
  const [slashIndex, setSlashIndex] = React.useState(0);

  const lastEmittedRef = React.useRef<string | null>(null);
  const focusRequestRef = React.useRef<{ blockId: string; caret?: number } | null>(null);
  const textareaRefs = React.useRef(new Map<string, HTMLTextAreaElement>());

  // Só reparseia markdown vindo de fora (troca de nota). O eco do que acabamos
  // de emitir é ignorado — reparsear a cada tecla recriaria os blocos e jogaria
  // o cursor pro fim.
  React.useEffect(() => {
    if (value === lastEmittedRef.current) return;
    setBlocks(parseBlocks(value));
    setSlash(null);
  }, [value]);

  React.useLayoutEffect(() => {
    const request = focusRequestRef.current;
    if (!request) return;
    focusRequestRef.current = null;

    const textarea = textareaRefs.current.get(request.blockId);
    if (!textarea) return;

    textarea.focus();
    const caret = request.caret ?? textarea.value.length;
    textarea.setSelectionRange(caret, caret);
  });

  const commit = React.useCallback(
    (next: Block[]) => {
      setBlocks(next);
      const markdown = serializeBlocks(next);
      lastEmittedRef.current = markdown;
      onChange(markdown);
    },
    [onChange],
  );

  const registerRef = React.useCallback((id: string, element: HTMLTextAreaElement | null) => {
    if (element) textareaRefs.current.set(id, element);
    else textareaRefs.current.delete(id);
  }, []);

  const matches = filterCommands(slash?.query ?? '');

  function handleContentChange(id: string, content: string, caret: number) {
    const block = blocks.find((item) => item.id === id);
    commit(blocks.map((item) => (item.id === id ? { ...item, content } : item)));

    if (slash && slash.blockId === id) {
      // A barra sumiu (apagada) ou o cursor voltou pra antes dela: encerra.
      if (content[slash.start] !== '/' || caret <= slash.start) {
        setSlash(null);
        return;
      }

      const query = content.slice(slash.start + 1, caret);
      if (/\s/.test(query)) {
        setSlash(null);
        return;
      }

      setSlash({ ...slash, query });
      setSlashIndex(0);
      return;
    }

    // Abre pelo texto resultante, não pelo keydown: o keydown roda antes do
    // caractere existir, e o estado ainda não teria chegado neste handler.
    // Exige início de bloco ou espaço antes, senão uma URL (https://) abriria
    // o menu no meio da digitação.
    if (!block || block.type !== 'text') return;

    const slashAt = caret - 1;
    const afterBoundary = slashAt === 0 || /\s/.test(content[slashAt - 1]);

    if (slashAt >= 0 && content[slashAt] === '/' && afterBoundary) {
      setSlash({ blockId: id, start: slashAt, query: '' });
      setSlashIndex(0);
    }
  }

  function applyCommand(command: SlashCommand) {
    if (!slash) return;

    const index = blocks.findIndex((block) => block.id === slash.blockId);
    if (index < 0) return;

    const block = blocks[index];
    // O espaço antes da barra faz parte do gatilho, não do texto — sem o
    // trimEnd ele sobraria como espaço solto no fim do parágrafo salvo.
    const withoutQuery =
      block.content.slice(0, slash.start).trimEnd() +
      block.content.slice(slash.start + 1 + slash.query.length);

    const updated = [...blocks];
    setSlash(null);

    // Bloco vazio vira o tipo escolhido; bloco com texto ganha um irmão abaixo.
    if (withoutQuery.trim() === '') {
      updated[index] = { ...block, type: command.type, content: '', lang: '' };
      commit(updated);
      focusRequestRef.current = { blockId: block.id, caret: 0 };
      return;
    }

    const created = createBlock(command.type);
    updated[index] = { ...block, content: withoutQuery };
    updated.splice(index + 1, 0, created);
    commit(updated);
    focusRequestRef.current = { blockId: created.id, caret: 0 };
  }

  function splitBlock(block: Block, caret: number) {
    const index = blocks.findIndex((item) => item.id === block.id);
    if (index < 0) return;

    const created = createBlock('text', block.content.slice(caret));
    const updated = [...blocks];
    updated[index] = { ...block, content: block.content.slice(0, caret) };
    updated.splice(index + 1, 0, created);

    commit(updated);
    focusRequestRef.current = { blockId: created.id, caret: 0 };
  }

  function mergeIntoPrevious(index: number) {
    const current = blocks[index];
    const previous = blocks[index - 1];

    // Backspace não deve empurrar texto pra dentro de um bloco de código sem
    // querer — nesse caso só devolve o foco pro bloco de cima.
    if (previous.type === 'code' && current.content !== '') {
      textareaRefs.current.get(previous.id)?.focus();
      return;
    }

    const caret = previous.content.length;
    const updated = [...blocks];
    updated[index - 1] = { ...previous, content: previous.content + current.content };
    updated.splice(index, 1);

    commit(updated);
    focusRequestRef.current = { blockId: previous.id, caret };
  }

  function deleteBlock(id: string) {
    const index = blocks.findIndex((block) => block.id === id);
    if (index < 0) return;

    const remaining = blocks.filter((block) => block.id !== id);
    const next = remaining.length > 0 ? remaining : [createBlock('text')];

    commit(next);
    focusRequestRef.current = { blockId: next[Math.max(0, index - 1)].id };
  }

  function appendBlock() {
    const created = createBlock('text');
    commit([...blocks, created]);
    focusRequestRef.current = { blockId: created.id, caret: 0 };
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>, block: Block) {
    const textarea = event.currentTarget;
    const caret = textarea.selectionStart;
    const menuOpen = slash?.blockId === block.id && matches.length > 0;

    if (menuOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSlashIndex((current) => (current + 1) % matches.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSlashIndex((current) => (current - 1 + matches.length) % matches.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        applyCommand(matches[slashIndex] ?? matches[0]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setSlash(null);
        return;
      }
    }

    if (event.key === 'Enter' && block.type === 'text' && !event.shiftKey) {
      event.preventDefault();
      splitBlock(block, caret);
      return;
    }

    // Dentro de código o Enter é quebra de linha; pra sair, Ctrl/Cmd+Enter.
    if (event.key === 'Enter' && block.type === 'code' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      const created = createBlock('text');
      const index = blocks.findIndex((item) => item.id === block.id);
      const updated = [...blocks];
      updated.splice(index + 1, 0, created);
      commit(updated);
      focusRequestRef.current = { blockId: created.id, caret: 0 };
      return;
    }

    if (event.key === 'Backspace' && caret === 0 && textarea.selectionEnd === 0) {
      const index = blocks.findIndex((item) => item.id === block.id);
      if (index <= 0) return;
      event.preventDefault();
      mergeIntoPrevious(index);
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
      {blocks.map((block, index) => (
        <BlockRow
          key={block.id}
          block={block}
          placeholder={index === 0 ? placeholder : undefined}
          registerRef={registerRef}
          onContentChange={handleContentChange}
          onLangChange={(id, lang) =>
            commit(blocks.map((item) => (item.id === id ? { ...item, lang } : item)))
          }
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onDelete={deleteBlock}
          slashOpen={slash?.blockId === block.id && matches.length > 0}
          matches={matches}
          slashIndex={slashIndex}
          onSlashSelect={applyCommand}
          onSlashHover={setSlashIndex}
        />
      ))}

      <button
        type="button"
        onClick={appendBlock}
        className="mt-1 flex items-center gap-1.5 self-start rounded-md px-1.5 py-1 text-[11px] text-muted-foreground/70 hover:text-foreground hover:bg-secondary transition-smooth cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar bloco
      </button>
    </div>
  );
}

interface BlockRowProps {
  block: Block;
  placeholder?: string;
  registerRef: (id: string, element: HTMLTextAreaElement | null) => void;
  onContentChange: (id: string, content: string, caret: number) => void;
  onLangChange: (id: string, lang: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>, block: Block) => void;
  onBlur?: () => void;
  onDelete: (id: string) => void;
  slashOpen: boolean;
  matches: SlashCommand[];
  slashIndex: number;
  onSlashSelect: (command: SlashCommand) => void;
  onSlashHover: (index: number) => void;
}

function BlockRow({
  block,
  placeholder,
  registerRef,
  onContentChange,
  onLangChange,
  onKeyDown,
  onBlur,
  onDelete,
  slashOpen,
  matches,
  slashIndex,
  onSlashSelect,
  onSlashHover,
}: BlockRowProps) {
  const [copied, setCopied] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Cresce junto com o conteúdo: a rolagem é da nota inteira, não de cada bloco.
  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [block.content, block.type]);

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
    } catch {
      toast.error('Não foi possível copiar o bloco.');
    }
  }

  const isCode = block.type === 'code';

  const textarea = (
    <textarea
      ref={(element) => {
        textareaRef.current = element;
        registerRef(block.id, element);
      }}
      value={block.content}
      onChange={(event) =>
        onContentChange(block.id, event.target.value, event.target.selectionStart)
      }
      onKeyDown={(event) => onKeyDown(event, block)}
      onBlur={onBlur}
      rows={1}
      placeholder={placeholder}
      aria-label={isCode ? 'Bloco de código' : 'Bloco de texto'}
      className={cn(
        'w-full resize-none border-0 bg-transparent p-0 leading-relaxed outline-none focus:ring-0 overflow-hidden',
        isCode
          ? 'px-3 py-2.5 font-mono text-[13px] text-foreground'
          : 'text-sm md:text-base text-foreground placeholder-muted-foreground/30',
      )}
    />
  );

  return (
    <div className="group relative rounded-md">
      {/* Ações do bloco — o copiar é o motivo de tudo isso existir */}
      <div className="absolute right-1 top-1 z-10 flex items-center gap-0.5 opacity-0 transition-smooth group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar bloco"
          aria-label="Copiar bloco"
          className="rounded-md bg-card/90 p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-smooth cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          title="Remover bloco"
          aria-label="Remover bloco"
          className="rounded-md bg-card/90 p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive transition-smooth cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {isCode ? (
        <div className="rounded-md border border-border bg-card/50">
          <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
            <Code2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            <input
              type="text"
              value={block.lang}
              onChange={(event) => onLangChange(block.id, event.target.value.trim())}
              onBlur={onBlur}
              placeholder="linguagem"
              aria-label="Linguagem do bloco de código"
              className="w-28 border-0 bg-transparent p-0 text-[11px] text-muted-foreground outline-none placeholder-muted-foreground/40 focus:ring-0"
            />
          </div>
          {textarea}
        </div>
      ) : (
        textarea
      )}

      {slashOpen && (
        <div
          role="listbox"
          aria-label="Inserir bloco"
          className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-2xl animate-fade-in"
        >
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 border-b border-border">
            Inserir bloco
          </div>
          {matches.map((command, index) => (
            <button
              key={command.type}
              type="button"
              role="option"
              aria-selected={index === slashIndex}
              onMouseEnter={() => onSlashHover(index)}
              // mousedown em vez de click: o blur do textarea fecharia o menu antes.
              onMouseDown={(event) => {
                event.preventDefault();
                onSlashSelect(command);
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-smooth cursor-pointer',
                index === slashIndex ? 'bg-secondary' : 'hover:bg-secondary/60',
              )}
            >
              <command.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-foreground">{command.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {command.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
