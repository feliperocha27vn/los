# Life OS

Um sistema web pessoal utilitário para centralizar rotinas diárias, controle financeiro e compromissos.

## Language

**App Shell**:
A moldura estrutural de layout que envolve a aplicação e fornece a navegação global.
_Avoid_: Layout base, Container principal

**Sidebar**:
A barra de navegação lateral esquerda fixa no App Shell para telas maiores (Desktop e Tablet).
_Avoid_: Menu lateral, Barra esquerda, Navegação esquerda

**Dashboard**:
A tela inicial do sistema que exibe uma visão geral consolidada das informações diárias, organizada com widgets financeiros no topo e colunas de organização e agenda abaixo.
_Avoid_: Home, Tela inicial, Painel

**Widget**:
Um cartão ou bloco modular no Dashboard que sumariza informações críticas de um domínio específico do sistema.
_Avoid_: Card, Bloco

**Cofre**:
Um módulo seguro no Life OS voltado para o armazenamento criptografado de informações sensíveis, como credenciais de acesso, notas seguras e chaves de API.
_Avoid_: Senhas, Chaveiro, Keychain

**Entrada do Cofre**:
Um item de informação sensível individual armazenado no Cofre, que obrigatoriamente se classifica em uma categoria (Credencial, Nota Segura ou Chave de API).
_Avoid_: Registro, Senha salva

**Credencial**:
Categoria de Entrada do Cofre destinada a autenticações em sites ou serviços, contendo Título, URL, Usuário/E-mail e Senha.
_Avoid_: Login, Conta

**Nota Segura**:
Categoria de Entrada do Cofre contendo informações textuais privadas livres, possuindo apenas Título e o Conteúdo da nota.
_Avoid_: Anotação, Bloco de notas

**Chave de API**:
Categoria de Entrada do Cofre focada em chaves de acesso de desenvolvimento, contendo Título, Provedor e Token/Secret.
_Avoid_: Token, API Key

**PIN de Acesso**:
Um código numérico de segurança definido pelo usuário, exigido para desbloquear e descriptografar temporariamente o conteúdo do Cofre.
_Avoid_: Senha do Cofre, Master Password

**Estado do Cofre**:
A condição de segurança do módulo do Cofre, alternando entre Bloqueado (conteúdo oculto e protegido) e Desbloqueado (conteúdo visível e descriptografado).
_Avoid_: Status do Cofre, Trancado/Destrancado

**Organização**:
O módulo do Life OS dedicado à gestão pessoal do usuário, englobando a lista de tarefas diárias e outras ferramentas futuras de produtividade pessoal.
_Avoid_: Tarefas, Todo List, Afazeres

**Abas de Organização**:
A barra de navegação horizontal no topo da área de conteúdo principal do módulo de Organização, utilizada para alternar entre os sub-módulos (Notas, Tarefas, Hábitos).
_Avoid_: Menu de sub-módulos, Abas superiores, Abas de navegação

**Nota**:
Um documento ou anotação pessoal de texto livre armazenado no módulo de Organização, contendo Título, Conteúdo (com suporte a formatação Markdown), um Caminho da Nota opcional e uma ou mais Tags.
_Avoid_: Documento, Bloco de notas

**Caminho da Nota**:
A trilha de navegação hierárquica (breadcrumb) exibida no topo do Editor de Notas que indica a estrutura de tópicos ou subpastas onde a nota está organizada (por exemplo, "Estudos > React > 1 - Interatividade").
_Avoid_: Pasta da Nota, Diretório de Notas

**Tag**:
Uma etiqueta ou palavra-chave de classificação opcional associada a uma Nota para agrupamento e busca rápida.
_Avoid_: Pasta, Categoria

**Painel de Notas**:
A interface de visualização do módulo de Notas em duas colunas, exibindo a listagem de notas na esquerda e o editor de texto na direita.
_Avoid_: Tela de notas

**Editor de Notas**:
A área principal do Painel de Notas onde a nota selecionada é visualizada e editada, oferecendo suporte a formatação livre em Markdown.
_Avoid_: Visualizador de notas

**Rastreador de Hábitos**:
O sub-módulo de Organização estruturado como uma tabela diária para acompanhar hábitos, pontuações de produtividade e métricas subjetivas de bem-estar.
_Avoid_: Planilha de hábitos, Tabela de rotinas, Habit Tracker

**Registro Diário**:
Cada linha na tabela do Rastreador de Hábitos, correspondendo a um dia específico, onde são assinalados os hábitos cumpridos e registradas as notas de qualidade e energia do dia.
_Avoid_: Linha de hábito, Entrada de tracker

**Hábito**:
Um item rastreável criado pelo usuário no sub-módulo Rastreador de Hábitos, identificado por Nome, Ícone (referência a biblioteca Lucide) e ordem de exibição, com estados arquivado e ativo.
_Avoid_: Atividade, Tarefa, Item

**Tarefa**:
Um item individual de trabalho dentro do quadro Kanban do sub-módulo Tarefas de Organização, classificado em uma das três colunas fixas (A Fazer, Em Progresso, Concluído) e identificado por Título, Descrição opcional, coluna e posição dentro da coluna.
_Avoid_: Card, Item, To-do

**Estudo**:
O sub-módulo de Organização estruturado como uma árvore hierárquica de conhecimento pessoal, composto por Cursos no topo, Módulos dentro de Cursos, e Páginas (documentos Markdown) dentro de Módulos.
_Avoid_: Knowledge base, Cursos, Aprendizado

**Curso**:
A unidade de escopo do topo da hierarquia do sub-módulo Estudo, representando um assunto ou área de estudo (ex: "React", "Node.js", "Inglês") e que agrupa Módulos.
_Avoid_: Disciplina, Matéria, Tópico

**Módulo**:
Um agrupamento temático dentro de um Curso do sub-módulo Estudo (ex: "1 - Interatividade"), que contém Páginas.
_Avoid_: Capítulo, Seção, Lição

**Página de Estudo**:
Um documento Markdown dentro de um Módulo do sub-módulo Estudo, contendo Título e Conteúdo, que pode ser livremente editado e auto-salvo.
_Avoid_: Anotação, Folha, Nota de estudo







