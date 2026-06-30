---
target: web/src/routes/organizacao.notas.tsx
total_score: 34
p0_count: 0
p1_count: 1
timestamp: 2026-06-28T11-56-02Z
slug: web-src-routes-organizacao-notas-tsx
---
# Design Critique: web/src/routes/organizacao.notas.tsx

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | O status de salvamento automático é exibido, mas carece de animações sutis de transição. |
| 2 | Match System / Real World | 4 | Uso rigoroso dos termos canônicos do domínio definidos em CONTEXT.md. |
| 3 | User Control and Freedom | 3 | Modais de exclusão evitam erros, mas não há um histórico de desfazer (undo) local. |
| 4 | Consistency and Standards | 4 | Estilo Monospace consistente, uso restrito de cores e raios de canto padronizados. |
| 5 | Error Prevention | 3 | Validação de campos antes do envio, mas campos de formulários poderiam destacar erros inline. |
| 6 | Recognition Rather Than Recall | 4 | Sidebar lateral e abas de navegação sempre visíveis. Árvore de estudos clara. |
| 7 | Flexibility and Efficiency | 3 | Ótimo para uso diário, mas pode se beneficiar de mais atalhos de teclado globais. |
| 8 | Aesthetic and Minimalist Design | 4 | Cabine de comando limpa, sem ruído visual, focada em legibilidade e contraste técnico. |
| 9 | Error Recovery | 3 | Mensagens de erro informativas enviadas via toast de forma direta. |
| 10 | Help and Documentation | 3 | O sistema é autoexplicativo, mas faltam tooltips ou dicas contextuais de atalhos. |
| **Total** | | **34/40** | **Good** |

## Anti-Patterns Verdict

**LLM Assessment:**
O design segue perfeitamente a Estrela do Norte "A Cabine de Comando Monocromática". Não há indícios de "AI Slop" (como cantos arredondados gigantes, sombras difusas ou gradientes genéricos). A consistência da tipografia mono dá uma identidade técnica muito forte.

**Deterministic Scan:**
O scanner automatizado retornou 0 erros ou avisos de anti-padrões.

## Overall Impression
A interface é limpa, focada e rápida. A organização em abas horizontais no módulo funciona muito bem. O maior valor está na simplicidade mecânica, mas pequenos detalhes de acessibilidade e interatividade podem elevar o sistema ao nível "flagship".

## What's Working
- **Coesão Visual:** A combinação de fundo escuro profundo, bordas cinza discretas e tipografia mono cria um ambiente de foco ideal.
- **Feedback de Hábito:** A tabela de 7 dias com checkboxes simples e o resumo mobile são muito fáceis de operar.

## Priority Issues
- **[P1] Acessibilidade de Navegação (A11y)**: Botões de ação baseados apenas em ícones (como fechar, reordenar e excluir) carecem de `aria-label` para leitores de tela.
  - *Fix*: Adicionar `aria-label` descritivos em todos os botões de ícone.
  - *Suggested command*: `$impeccable polish`
- **[P2] Feedback Visual de Foco**: Alguns botões e inputs não têm um anel de foco visível e consistente durante a navegação por teclado.
  - *Fix*: Aplicar `focus-visible:ring-2 focus-visible:ring-primary` padronizado.
  - *Suggested command*: `$impeccable layout`
- **[P2] Atalhos de Teclado**: O editor de notas e de estudos não possui atalhos de escape (`Esc` para tirar o foco) ou atalhos para ações comuns.
  - *Fix*: Adicionar manipuladores de teclado simples nas áreas de edição.
  - *Suggested command*: `$impeccable polish`

## Persona Red Flags

**Alex (Power User)**:
Falta de atalhos rápidos para criar novas notas ou alternar entre abas de organização sem usar o mouse. Alex sentirá falta de velocidade operacional.

**Sam (Accessibility-Dependent)**:
Dificuldade para navegar por teclado em botões de ícone sem etiquetas de texto ou `aria-label` explícitos.
