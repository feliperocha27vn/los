// Conversão entre o markdown salvo em `notes.content` e a lista de blocos que o
// editor manipula. O banco continua guardando markdown puro — é o que mantém a
// busca por texto e o snippet da lista funcionando sem migração.

export type BlockType = 'text' | 'code';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  /** Linguagem do bloco de código (`''` quando não informada). Vazio em blocos de texto. */
  lang: string;
}

let idCounter = 0;

export function createBlock(type: BlockType, content = '', lang = ''): Block {
  idCounter += 1;
  return { id: `block-${idCounter}`, type, content, lang };
}

/** Abertura de cerca: ```` ```ts ````. O grupo captura a linguagem, quando houver. */
const FENCE_OPEN = /^```(\S*)\s*$/;
const FENCE_CLOSE = /^```\s*$/;

export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split('\n');
  let textLines: string[] = [];

  // Um trecho de texto corrido vira um bloco por parágrafo (separados por linha
  // em branco). Linhas simples de quebra ficam dentro do mesmo bloco.
  function flushText() {
    const joined = textLines.join('\n');
    textLines = [];

    for (const paragraph of joined.split(/\n{2,}/)) {
      const trimmed = paragraph.trim();
      if (trimmed) blocks.push(createBlock('text', trimmed));
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const openMatch = FENCE_OPEN.exec(lines[i]);

    if (!openMatch) {
      textLines.push(lines[i]);
      continue;
    }

    flushText();

    const codeLines: string[] = [];
    i++;

    // Cerca não fechada (acontece enquanto se digita) consome até o fim.
    while (i < lines.length && !FENCE_CLOSE.test(lines[i])) {
      codeLines.push(lines[i]);
      i++;
    }

    blocks.push(createBlock('code', codeLines.join('\n'), openMatch[1]));
  }

  flushText();

  // O editor sempre precisa de ao menos um bloco onde digitar.
  return blocks.length > 0 ? blocks : [createBlock('text')];
}

export function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map((block) =>
      block.type === 'code' ? `\`\`\`${block.lang}\n${block.content}\n\`\`\`` : block.content,
    )
    .join('\n\n')
    .trim();
}
