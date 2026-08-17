import { describe, it, expect } from 'vitest';
import { createBlock, parseBlocks, serializeBlocks } from './markdown-blocks';

describe('parseBlocks', () => {
  it('devolve um bloco de texto vazio quando a nota está vazia', () => {
    const blocks = parseBlocks('');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('text');
    expect(blocks[0].content).toBe('');
  });

  it('quebra parágrafos separados por linha em branco em blocos distintos', () => {
    const blocks = parseBlocks('primeiro\n\nsegundo');

    expect(blocks.map((b) => b.content)).toEqual(['primeiro', 'segundo']);
  });

  it('mantém quebras de linha simples dentro do mesmo bloco', () => {
    const blocks = parseBlocks('linha um\nlinha dois');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe('linha um\nlinha dois');
  });

  it('extrai bloco de código com a linguagem da cerca', () => {
    const blocks = parseBlocks('antes\n\n```bash\npnpm deploy:coolify\n```\n\ndepois');

    expect(blocks.map((b) => b.type)).toEqual(['text', 'code', 'text']);
    expect(blocks[1].lang).toBe('bash');
    expect(blocks[1].content).toBe('pnpm deploy:coolify');
  });

  it('aceita cerca sem linguagem', () => {
    const blocks = parseBlocks('```\nsem linguagem\n```');

    expect(blocks[0].type).toBe('code');
    expect(blocks[0].lang).toBe('');
  });

  it('preserva linhas em branco dentro do bloco de código', () => {
    const blocks = parseBlocks('```ts\nconst a = 1;\n\nconst b = 2;\n```');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe('const a = 1;\n\nconst b = 2;');
  });

  it('consome até o fim quando a cerca não foi fechada', () => {
    const blocks = parseBlocks('```sql\nselect 1');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('code');
    expect(blocks[0].content).toBe('select 1');
  });

  it('trata nota antiga de texto puro como um único bloco de texto', () => {
    const blocks = parseBlocks('uma nota escrita antes dos blocos existirem');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('text');
  });
});

describe('serializeBlocks', () => {
  it('junta blocos com linha em branco entre eles', () => {
    const markdown = serializeBlocks([createBlock('text', 'um'), createBlock('text', 'dois')]);

    expect(markdown).toBe('um\n\ndois');
  });

  it('reconstrói a cerca do bloco de código com a linguagem', () => {
    const markdown = serializeBlocks([createBlock('code', 'ls -la', 'bash')]);

    expect(markdown).toBe('```bash\nls -la\n```');
  });

  it('descarta blocos de texto vazios nas pontas', () => {
    const markdown = serializeBlocks([
      createBlock('text', ''),
      createBlock('text', 'conteúdo'),
      createBlock('text', ''),
    ]);

    expect(markdown).toBe('conteúdo');
  });
});

describe('ida e volta', () => {
  const casos = [
    'nota simples',
    'parágrafo um\n\nparágrafo dois',
    'texto\n\n```bash\npnpm deploy:coolify --force\n```',
    '```ts\nconst x = 1;\n```\n\nfecho com texto',
    'linha um\nlinha dois\n\n```\nsem linguagem\n```',
  ];

  for (const markdown of casos) {
    it(`preserva ${JSON.stringify(markdown)}`, () => {
      expect(serializeBlocks(parseBlocks(markdown))).toBe(markdown);
    });
  }

  it('normaliza excesso de linhas em branco para o formato canônico', () => {
    expect(serializeBlocks(parseBlocks('um\n\n\n\ndois'))).toBe('um\n\ndois');
  });
});
