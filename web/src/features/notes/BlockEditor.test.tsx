// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { BlockEditor } from './BlockEditor';

afterEach(cleanup);

/**
 * Espelha o uso real: a rota guarda o markdown em estado e devolve pro editor.
 * `onMarkdown` recebe cada valor emitido, que é exatamente o que iria pro PUT.
 */
function Harness({
  initial = '',
  onMarkdown,
}: {
  initial?: string;
  onMarkdown?: (markdown: string) => void;
}) {
  const [content, setContent] = React.useState(initial);

  return (
    <BlockEditor
      value={content}
      onChange={(markdown) => {
        setContent(markdown);
        onMarkdown?.(markdown);
      }}
      placeholder="Comece a escrever ou digite / para inserir um bloco..."
    />
  );
}

function setup(props: React.ComponentProps<typeof Harness> = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  return user;
}

describe('carregamento de notas existentes', () => {
  it('mostra a nota antiga de texto puro em um bloco editável', () => {
    setup({ initial: 'uma nota escrita antes dos blocos' });

    expect(screen.getByRole('textbox', { name: 'Bloco de texto' })).toHaveValue(
      'uma nota escrita antes dos blocos',
    );
  });

  it('separa texto e código em blocos distintos', () => {
    setup({ initial: 'antes\n\n```bash\npnpm deploy:coolify\n```\n\ndepois' });

    const textBlocks = screen.getAllByRole('textbox', { name: 'Bloco de texto' });
    const codeBlocks = screen.getAllByRole('textbox', { name: 'Bloco de código' });

    expect(textBlocks.map((el) => (el as HTMLTextAreaElement).value)).toEqual(['antes', 'depois']);
    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0]).toHaveValue('pnpm deploy:coolify');
    expect(screen.getByLabelText('Linguagem do bloco de código')).toHaveValue('bash');
  });
});

describe('menu de barra', () => {
  it('abre ao digitar / em um bloco vazio', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('/');

    const menu = await screen.findByRole('listbox', { name: 'Inserir bloco' });
    expect(within(menu).getByRole('option', { name: /Texto/ })).toBeInTheDocument();
    expect(within(menu).getByRole('option', { name: /Código/ })).toBeInTheDocument();
  });

  it('filtra as opções conforme o que se digita depois da barra', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('/cod');

    const menu = await screen.findByRole('listbox', { name: 'Inserir bloco' });
    expect(within(menu).getAllByRole('option')).toHaveLength(1);
    expect(within(menu).getByRole('option', { name: /Código/ })).toBeInTheDocument();
  });

  it('não abre no meio de uma URL', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('https://coolify');

    expect(screen.queryByRole('listbox', { name: 'Inserir bloco' })).not.toBeInTheDocument();
  });

  it('fecha com Escape sem inserir bloco', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('/');
    await screen.findByRole('listbox', { name: 'Inserir bloco' });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: 'Inserir bloco' })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('textbox', { name: 'Bloco de código' })).not.toBeInTheDocument();
  });

  it('fecha ao digitar espaço depois da barra', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('/ ');

    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: 'Inserir bloco' })).not.toBeInTheDocument();
    });
  });
});

describe('inserção de blocos', () => {
  it('converte o bloco vazio em bloco de código ao escolher Código', async () => {
    const onMarkdown = vi.fn();
    const user = setup({ onMarkdown });

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('/cod{Enter}');

    const code = await screen.findByRole('textbox', { name: 'Bloco de código' });
    expect(code).toBeInTheDocument();
    // O "/cod" digitado não pode sobrar no conteúdo
    expect(code).toHaveValue('');

    await user.type(code, 'pnpm deploy:coolify');

    expect(onMarkdown).toHaveBeenLastCalledWith('```\npnpm deploy:coolify\n```');
  });

  it('mantém o texto e cria o bloco novo abaixo quando o bloco já tem conteúdo', async () => {
    const user = setup({ initial: 'rodar antes do release:' });

    const text = screen.getByRole('textbox', { name: 'Bloco de texto' });
    await user.click(text);
    await user.keyboard(' /cod{Enter}');

    expect(await screen.findByRole('textbox', { name: 'Bloco de código' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Bloco de texto' })).toHaveValue(
      'rodar antes do release:',
    );
  });

  it('escolhe pelo teclado com as setas', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('/');
    await screen.findByRole('listbox', { name: 'Inserir bloco' });

    await user.keyboard('{ArrowDown}{Enter}');

    expect(await screen.findByRole('textbox', { name: 'Bloco de código' })).toBeInTheDocument();
  });

  it('escolhe com o mouse', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('/');

    const menu = await screen.findByRole('listbox', { name: 'Inserir bloco' });
    await user.click(within(menu).getByRole('option', { name: /Código/ }));

    expect(await screen.findByRole('textbox', { name: 'Bloco de código' })).toBeInTheDocument();
  });

  it('salva a linguagem digitada no cabeçalho do bloco', async () => {
    const onMarkdown = vi.fn();
    const user = setup({ initial: '```\nselect 1\n```', onMarkdown });

    await user.type(screen.getByLabelText('Linguagem do bloco de código'), 'sql');

    expect(onMarkdown).toHaveBeenLastCalledWith('```sql\nselect 1\n```');
  });
});

describe('botão de copiar', () => {
  it('copia o conteúdo do bloco e confirma visualmente', async () => {
    const user = setup({ initial: '```bash\npnpm deploy:coolify --force\n```' });

    const copyButton = screen.getByRole('button', { name: 'Copiar bloco' });
    await user.click(copyButton);

    await expect(navigator.clipboard.readText()).resolves.toBe('pnpm deploy:coolify --force');
    // O ícone vira um check por alguns instantes
    await waitFor(() => expect(copyButton.querySelector('svg')).toHaveClass('text-primary'));
  });

  it('copia apenas o bloco clicado, não a nota inteira', async () => {
    const user = setup({ initial: 'contexto da nota\n\n```bash\nls -la\n```' });

    const buttons = screen.getAllByRole('button', { name: 'Copiar bloco' });
    await user.click(buttons[1]);

    await expect(navigator.clipboard.readText()).resolves.toBe('ls -la');
  });
});

describe('edição de blocos', () => {
  it('Enter em bloco de texto cria um bloco novo', async () => {
    const onMarkdown = vi.fn();
    const user = setup({ initial: 'primeiro', onMarkdown });

    const text = screen.getByRole('textbox', { name: 'Bloco de texto' });
    await user.click(text);
    await user.keyboard('{End}{Enter}segundo');

    await waitFor(() => {
      expect(screen.getAllByRole('textbox', { name: 'Bloco de texto' })).toHaveLength(2);
    });
    expect(onMarkdown).toHaveBeenLastCalledWith('primeiro\n\nsegundo');
  });

  it('Enter dentro de bloco de código quebra linha em vez de criar bloco', async () => {
    const onMarkdown = vi.fn();
    const user = setup({ initial: '```sh\nprimeira\n```', onMarkdown });

    const code = screen.getByRole('textbox', { name: 'Bloco de código' });
    await user.click(code);
    await user.keyboard('{End}{Enter}segunda');

    expect(screen.getAllByRole('textbox', { name: 'Bloco de código' })).toHaveLength(1);
    expect(onMarkdown).toHaveBeenLastCalledWith('```sh\nprimeira\nsegunda\n```');
  });

  it('remove um bloco pelo botão', async () => {
    const onMarkdown = vi.fn();
    const user = setup({ initial: 'fica\n\n```\nsai\n```', onMarkdown });

    const buttons = screen.getAllByRole('button', { name: 'Remover bloco' });
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'Bloco de código' })).not.toBeInTheDocument();
    });
    expect(onMarkdown).toHaveBeenLastCalledWith('fica');
  });

  it('adiciona bloco pelo botão do rodapé', async () => {
    const user = setup({ initial: 'só um bloco' });

    await user.click(screen.getByRole('button', { name: /Adicionar bloco/ }));

    await waitFor(() => {
      expect(screen.getAllByRole('textbox', { name: 'Bloco de texto' })).toHaveLength(2);
    });
  });
});

describe('formato salvo', () => {
  it('emite markdown, nunca JSON — a busca do backend depende disso', async () => {
    const onMarkdown = vi.fn();
    const user = setup({ initial: 'contexto', onMarkdown });

    await user.click(screen.getByRole('textbox', { name: 'Bloco de texto' }));
    await user.keyboard('{End} /cod{Enter}');

    const code = await screen.findByRole('textbox', { name: 'Bloco de código' });
    await user.type(code, 'pnpm test');

    const emitted = onMarkdown.mock.lastCall?.[0] as string;
    expect(emitted).toBe('contexto\n\n```\npnpm test\n```');
    expect(() => JSON.parse(emitted)).toThrow();
  });
});
