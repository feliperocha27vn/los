---
name: Life OS
description: Painel de controle pessoal e utilitário técnico de alta densidade
colors:
  primary: "#6366f1"
  neutral-bg: "#09090b"
  neutral-card: "#18181b"
  neutral-border: "#27272a"
  neutral-text: "#fafafa"
  neutral-muted: "#a1a1aa"
  destructive: "#ef4444"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.neutral-card}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Life OS

## 1. Overview

**Creative North Star: "A Cabine de Comando Monocromática" (The Monochromatic Cockpit)**

O Life OS é concebido como uma cabine de comando pessoal, limpa e de alta densidade de informação. O design prioriza a velocidade de leitura e a utilidade imediata do usuário técnico. Toda a interface é desenhada sobre um fundo escuro profundo ("Zero-Absoluto"), estruturada com linhas finas e precisas de divisão ("Zinco Escuro") e guiada por tipografia puramente monospace (JetBrains Mono).

O sistema rejeita ativamente elementos decorativos desnecessários: não há gradientes, não há desfoques de vidro ("glassmorphism") e não há cantos excessivamente arredondados que quebrem a rigidez geométrica da cabine de comando.

**Key Characteristics:**
- **Estética Monospace:** Uso sistemático da fonte JetBrains Mono para todos os elementos de texto.
- **Densidade Utilitária:** Informações e ações dispostas de forma compacta e direta.
- **Geometria Rígida:** Bordas finas de 1px e raios de canto pequenos (máximo 6px).
- **Acentos Funcionais:** Cores vibrantes (Indigo) usadas exclusivamente para indicar foco, seleção ou estados ativos.

## 2. Colors

A paleta de cores é extremamente contida, focando na raridade e no contraste para guiar a atenção do usuário.

### Primary
- **Indigo Elétrico** (`#6366f1`): Cor de acento primária. Usada com parcimônia (limite de 10% da tela) para botões de ação principal, estados selecionados de abas e anéis de foco ativos.

### Neutral
- **Zero-Absoluto** (`#09090b`): O fundo principal do sistema. Proporciona um contraste ideal no modo escuro sem fadiga visual.
- **Zinco Escuro (Card)** (`#18181b`): Cor de fundo para cartões, widgets e painéis suspensos. Cria uma sutil distinção de profundidade.
- **Zinco Escuro (Borda)** (`#27272a`): Tom de borda padrão para divisórias de tabelas, inputs e contornos de cards.
- **Alvo Puro** (`#fafafa`): Cor principal para textos de alta importância e cabeçalhos.
- **Cinza Mudo** (`#a1a1aa`): Cor para textos secundários, descrições e placeholders. Garante contraste de legibilidade adequado (≥4.5:1).

### Named Rules
**A Regra dos 10% de Acento.** O Indigo Elétrico é uma ferramenta de atenção. Ele nunca deve ser usado como cor de fundo de painéis grandes ou em múltiplos botões secundários na mesma tela. Sua força vem de sua raridade.

## 3. Typography

**Display Font:** JetBrains Mono (com fallbacks ui-monospace, monospace)
**Body Font:** JetBrains Mono (com fallbacks ui-monospace, monospace)
**Label/Mono Font:** JetBrains Mono

**Character:** A tipografia é puramente monospace, trazendo uma sensação de terminal de desenvolvimento ou caderno de anotações técnicas. A legibilidade é garantida pelo espaçamento entre linhas e contraste de peso.

### Hierarchy
- **Display** (Bold (700), 1.5rem (24px), 1.2): Títulos de seções principais da organização, títulos do editor e cabeçalhos do Dashboard.
- **Headline** (SemiBold (600), 1.25rem (20px), 1.3): Títulos de widgets e modais.
- **Title** (SemiBold (600), 1rem (16px), 1.4): Títulos de cards, itens de lista e cabeçalhos de tabela.
- **Body** (Regular (400), 0.875rem (14px), 1.5): Textos de leitura, conteúdo de notas e descrições. Comprimento máximo de linha de 75ch.
- **Label** (SemiBold (600), 0.75rem (12px), 1.4): Rótulos de campos de formulário, etiquetas, tags e status de hábitos.

## 4. Elevation

O sistema é estritamente plano por padrão. A profundidade e a hierarquia espacial são criadas exclusivamente através do empilhamento de tons de cores (Zero-Absoluto para o fundo geral, Zinco Escuro para cartões e painéis) e bordas finas de 1px.

Não há uso de sombras projetadas (drop shadows) em estado de repouso para cartões ou botões. Sombras são reservadas exclusivamente como um feedback de estado ativo (ex: quando um modal sobrepõe o conteúdo).

### Named Rules
**A Regra da Profundidade Plana.** A separação de elementos é feita por contraste de cor de fundo e bordas de 1px. Sombras difusas são proibidas em cards normais.

## 5. Components

### Buttons
- **Shape:** Cantos levemente suavizados (4px radius).
- **Primary:** Fundo Indigo Elétrico (`#6366f1`), texto branco, sem borda. Hover: leve clareamento ou redução de opacidade (0.9).
- **Secondary / Ghost:** Fundo transparente, borda de 1px Zinco Escuro (`#27272a`), texto Alvo Puro. Hover: fundo Zinco Escuro (`#18181b`).
- **Padding:** Compacto (`8px 16px` ou `6px 12px` para botões menores).

### Cards / Containers
- **Corner Style:** Cantos levemente suavizados (6px radius).
- **Background:** Zinco Escuro (`#18181b`).
- **Border:** Contorno fino de 1px em Zinco Escuro (`#27272a`).
- **Internal Padding:** `16px` (spacing.md).

### Inputs / Fields
- **Style:** Fundo translúcido (`#09090b/40`), borda de 1px Zinco Escuro (`#27272a`), cantos de 4px.
- **Focus:** Anel de foco fino ou borda iluminada em Indigo Elétrico (`#6366f1`) com transição suave.

### Navigation (Sidebar & App Shell)
- **Style:** Barra fixa lateral esquerda no desktop, barra inferior flutuante no mobile. Fundo Zinco Escuro (`#18181b`).
- **Hover/Active:** Ícones aumentados e destacados em Indigo Elétrico quando ativos ou sob hover.

## 6. Do's and Don'ts

### Do:
- **Do** usar sempre a fonte JetBrains Mono para manter a consistência da cabine de comando técnica.
- **Do** manter a borda de 1px Zinco Escuro (`#27272a`) para separar seções de tabelas ou cards.
- **Do** garantir contraste de pelo menos 4.5:1 para todo texto de leitura secundário usando Cinza Mudo (`#a1a1aa`).

### Don't:
- **Don't** usar sombras projetadas largas ou difusas em botões ou cards de informação.
- **Don't** aplicar gradientes de cores como fundo de textos ou botões.
- **Don't** arredondar os cantos de cards ou modais acima de 12px (o padrão do sistema é 6px para cards e 4px para botões).
- **Don't** utilizar desfoques de fundo ("glassmorphism") como padrão estético decorativo.
