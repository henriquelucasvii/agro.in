# Módulo de análise foliar

## Estado implementado

O Agro.in agora possui um fluxo mobile de captura, pré-processamento, triagem,
histórico e feedback. A foto passa pelas seguintes etapas:

1. validação de formato, tamanho e resolução;
2. correção de orientação e compressão sem metadados;
3. avaliação aproximada de luz, contraste, foco e presença de tecido vegetal;
4. leitura de proporções visuais verde, amarela, marrom e escura;
5. classificação local conservadora ou chamada do provedor especializado;
6. geração de hipóteses, perguntas de confirmação e recomendações;
7. armazenamento privado da miniatura e do resultado;
8. feedback do usuário e registro de eventual diagnóstico confirmado.

A implementação local nunca afirma identificar fungo, bactéria, vírus ou espécie.
Ela informa apenas padrões visuais. Quando a variável
`KINDWISE_CROP_HEALTH_API_KEY` está configurada, o backend envia a imagem
comprimida ao `crop.health` e normaliza as três hipóteses mais prováveis. A chave
fica somente no servidor.

## Limite agronômico essencial

Uma fotografia RGB de uma folha pode levantar hipóteses de clorose, necrose,
doença ou estresse. Ela não mede N, P, K, pH, matéria orgânica ou fertilidade do
solo. Sintomas parecidos podem ser produzidos por água, raiz, fitotoxicidade,
doença e diferentes deficiências.

A própria Embrapa descreve a diagnose foliar como análise química de tecido
coletado de forma padronizada e recomenda interpretá-la junto com análise de
solo, histórico, cultura e condições da lavoura:

- [Diagnose foliar — Embrapa](https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/cenoura/producao/manejo-do-solo/analise-do-solo/adubacao-e-nutricao/diagnose-foliar)
- [Análise foliar em milho — Embrapa](https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/milho/producao/manejo-do-solo-e-adubacao/adubacao-e-fertilidade-do-solo/diagnose-foliar)
- [Análise foliar em pimenta — Embrapa](https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/pimenta/producao/manejo-do-solo/analise-foliar)

Por isso, o produto usa o termo **hipótese visual de estresse nutricional** e não
“estimativa do solo”. Dose de fertilizante ou defensivo não deve ser gerada
automaticamente.

## Fontes brasileiras encontradas

### Digipathos

A Embrapa disponibilizou publicamente a base Digipathos, com quase 3 mil imagens
de doenças descritas por especialistas em culturas como soja, café, arroz,
feijão, trigo, milho e frutas. Não foi encontrada uma API pública da Embrapa que
receba a foto e devolva um diagnóstico pronto.

- [Notícia e descrição da base Digipathos](https://www.embrapa.br/en/noticias-mais-lidas/-/asset_publisher/HA73uEmvroGS/content/id/42625978)
- [Artigo técnico sobre as bases PDDB/XDB](https://www.alice.cnptia.embrapa.br/alice/handle/doc/1097219?mode=full)
- [Exemplo de conjunto com download no OasisBR](https://oasisbr.ibict.br/vufind/Record/EMBRAPA-06_25bc8d44108060bad03dab82c2fcc4cd)

Antes de treinar comercialmente, é necessário revisar a licença de cada imagem,
atribuições e permissão de redistribuição.

### AgroAPI / Agrofit

A API Agrofit da Embrapa fornece dados de produtos e indicações registrados no
MAPA. Ela é útil **depois** de uma hipótese confirmada para filtrar produto por
cultura e alvo. Ela não diagnostica a foto.

- [Documentação da API Agrofit](https://www.portal.agroapi.cnptia.embrapa.br/api-docs/agrofit)

A etapa de defensivos deve exigir cultura, alvo, registro válido, localização e
responsável técnico. O app não deve copiar dosagem de uma fonte genérica.

### PlantAnnot

PlantAnnot é uma plataforma de anotação genômica/proteica para respostas a
estresses, não uma API de reconhecimento de doenças em fotografias.

- [PlantAnnot — Embrapa](https://www.embrapa.br/en/busca-de-solucoes-tecnologicas/-/produto-servico/7780/plantannot)

## Bases complementares para modelo próprio

- [PlantVillage](https://arxiv.org/abs/1604.03169): 54.306 imagens, 14 culturas e
  classes saudáveis/doentes; ótima para baseline, mas majoritariamente capturada
  em condições controladas.
- [PlantDoc](https://arxiv.org/abs/1911.10317): imagens mais próximas do campo,
  com fundo, iluminação e enquadramento variados.
- [Paddy Doctor](https://arxiv.org/abs/2205.11108): 16.225 imagens de arroz em
  ambiente real.
- [PlantSeg](https://www.nature.com/articles/s41597-025-06513-4.pdf): imagens
  “in the wild” com segmentação e 27 classes.

Resultados de laboratório não devem ser usados como promessa de desempenho no
campo. Estudos de generalização mostram queda relevante entre bases controladas
e fotos reais:

- [Generalização entre PlantVillage, PlantDoc, Digipathos e campo](https://doaj.org/article/e81741e8485f44b0b4f4ef55b92c95d0)
- [Viés de fundo em PlantVillage](https://arxiv.org/abs/2206.04374)

## Provedor pronto para o MVP

O adaptador implementado usa o `crop.health` da Kindwise. Segundo a documentação
do fornecedor, ele cobre cerca de 300 problemas em 23 culturas, retorna
alternativas, probabilidades, sintomas e tratamentos. A integração é opcional e
o sistema continua operando em modo de triagem visual sem a chave.

- [Descrição do crop.health](https://www.kindwise.com/crop-health)
- [Demonstração](https://crop.kindwise.com/demo/)
- [Documentação da API](https://crop.kindwise.com/docs)
- [Segurança e uso via backend](https://www.kindwise.com/faq)

Configuração:

```env
KINDWISE_CROP_HEALTH_API_KEY="sua_chave_crop_health"
```

Não use uma chave de `plant.id`: o fornecedor exige uma chave separada para
`crop.health`.

## Arquitetura recomendada para modelo Agro.in

```text
captura mobile
  -> verificação de foto/não-planta
  -> identificação da cultura
  -> segmentação de folha e lesões
  -> classificador multi-rótulo
  -> calibração de confiança e rejeição fora do domínio
  -> perguntas de confirmação
  -> base agronômica versionada
  -> revisão de especialista e feedback
```

### Estratégia de dados

1. Normalizar taxonomia, cultura, órgão, doença, agente causal, fase e severidade.
2. Manter origem, autor e licença por imagem.
3. Separar treino/validação/teste por fazenda, data e dispositivo, evitando que
   fotos quase iguais caiam em grupos diferentes.
4. Priorizar fotos brasileiras reais: luz forte, sombra, poeira, folhas
   sobrepostas e diferentes celulares.
5. Incluir classes “não é planta”, “foto inadequada”, “sintoma desconhecido” e
   “mais de uma causa”.
6. Fazer dupla anotação e arbitragem por fitopatologista/agronomista.

### Métricas mínimas

- recall e precisão por cultura/doença;
- macro F1 para evitar esconder classes raras;
- top-3 e matriz de confusão;
- calibração de probabilidade;
- taxa de rejeição correta fora do domínio;
- validação externa em fazendas não vistas no treino;
- impacto das perguntas adicionais no diagnóstico final.

## Privacidade e operação

- A foto só é enviada após consentimento explícito.
- O backend remove metadados EXIF durante a compressão.
- A miniatura fica vinculada ao usuário e exige JWT para leitura.
- O usuário pode excluir análise e foto.
- Localização é opcional e armazenada apenas quando solicitada.
- Para escala, as imagens devem migrar de `BYTEA` para Supabase Storage ou
  armazenamento de objetos com URLs assinadas e política de retenção.

## Próximos passos para produção

1. Configurar uma chave `crop.health` para habilitar doenças específicas agora.
2. Integrar Agrofit somente após confirmação e com regras de registro brasileiras.
3. Criar o catálogo versionado de recomendações por cultura, fase e região.
4. Montar a ingestão licenciada do Digipathos e das bases complementares.
5. Firmar validação com agrônomo/fitopatologista e coletar imagens locais.
6. Treinar e calibrar um modelo próprio, mantendo o provedor como comparação.
